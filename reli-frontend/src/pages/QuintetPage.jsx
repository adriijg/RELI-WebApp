import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { getAllPlayers, getCompetitions, getMatches, getMatchDetail, getPlayerSeasonStats, getQuintetBallots, getQuintetSeasonTally, getQuintetStatus, getQuintetTally, deleteQuintetVote, getMyQuintetVote, getSeasons, openQuintet, closeQuintet, saveQuintetVote, toPage } from '../services/api';
import { jerseyForSeason } from '../constants/jerseys';
import { POSITION_LABELS } from '../constants/positions';

const FALLBACK_PHOTO = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png';
const VOTES_KEY = 'reli-quinteto-votes';
const LEGACY_KEY = 'reli-quinteto';
const SLOTS = [
  { id: 'pivot', x: 50, y: 16 },
  { id: 'ala-izq', x: 22, y: 36 },
  { id: 'ala-der', x: 78, y: 36 },
  { id: 'cierre', x: 50, y: 56 },
  { id: 'portero', x: 50, y: 78 },
];

function emptyLineup() {
  return Object.fromEntries(SLOTS.map((slot) => [slot.id, null]));
}

function readVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

function readVote(userKey, seasonId, jornada) {
  if (!userKey) return null;
  const saved = readVotes()[String(userKey)];
  if (!saved) return null;
  if (String(saved.seasonId) !== String(seasonId) || Number(saved.jornada) !== Number(jornada)) return null;
  return saved;
}

function writeVote(userKey, payload) {
  const all = readVotes();
  all[String(userKey)] = payload;
  localStorage.setItem(VOTES_KEY, JSON.stringify(all));
}

function claimLegacy(userKey) {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw || !userKey) return;
  localStorage.removeItem(LEGACY_KEY);
  try {
    const parsed = JSON.parse(raw);
    const all = readVotes();
    if (!all[String(userKey)]) {
      all[String(userKey)] = parsed;
      localStorage.setItem(VOTES_KEY, JSON.stringify(all));
    }
  } catch {
    /* el voto antiguo no se reutiliza */
  }
}

function weekMatch(matches) {
  const dated = matches
    .filter((match) => match.jornada != null && match.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = Date.now();
  const grace = 36 * 60 * 60 * 1000;
  return dated.find((match) => new Date(match.date).getTime() >= now - grace) || dated.at(-1) || null;
}

function formatWhen(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function QuintetPage() {
  const { user, isAdmin, openAuth } = useApp();
  const voterKey = user?.id ?? user?.username ?? '';
  const [players, setPlayers] = useState([]);
  const [match, setMatch] = useState(null);
  const [seasonId, setSeasonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lineup, setLineup] = useState(emptyLineup);
  const [activeSlot, setActiveSlot] = useState(SLOTS[0].id);
  const [saved, setSaved] = useState(null);
  const [tally, setTally] = useState(null);
  const [ballots, setBallots] = useState([]);
  const [seasonTally, setSeasonTally] = useState(null);
  const [quintetStatus, setQuintetStatus] = useState(null);
  const isVoteOpen = quintetStatus?.open === true;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [seasonData, competitionData, matchData] = await Promise.all([
        getSeasons({ size: 100, sortBy: 'name', direction: 'desc' }),
        getCompetitions({ size: 100 }),
        getMatches({ size: 100, sortBy: 'date', direction: 'asc' }),
      ]);
      const seasons = toPage(seasonData).content;
      const current = seasons.find((season) => season.current) || seasons[0];
      const competitionIds = new Set(
        toPage(competitionData).content
          .filter((competition) => current && String(competition.seasonId) === String(current.id))
          .map((competition) => competition.id),
      );
      const seasonMatches = toPage(matchData).content.filter((item) => competitionIds.has(item.competitionId));
      const chosen = weekMatch(seasonMatches);
      // roster por temporada: solo jugadores asignados a esa temporada
      let squad = [];
      if (current) {
        try {
          const stats = await getPlayerSeasonStats({ seasonId: current.id });
          squad = Array.isArray(stats) ? stats : [];
          // stats ya trae jersey del roster; mapear a formato esperado
          squad = squad.map((p) => ({
            id: p.playerId,
            name: p.name,
            nickname: p.nickname,
            surnames: p.surnames,
            jerseyNumber: jerseyForSeason(p.playerId, current.id, p.jerseyNumber),
            position: p.position,
            photoUrl: p.photoUrl,
          }));
        } catch {
          squad = await getAllPlayers().catch(() => []);
          squad = (Array.isArray(squad) ? squad : []).map((player) => ({
            ...player,
            jerseyNumber: jerseyForSeason(player.id, current.id, player.jerseyNumber),
          }));
        }
        if (squad.length === 0) {
          const fallback = await getAllPlayers().catch(() => []);
          squad = (Array.isArray(fallback) ? fallback : []).map((player) => ({
            ...player,
            jerseyNumber: jerseyForSeason(player.id, current.id, player.jerseyNumber),
          }));
        }
      } else {
        const fallback = await getAllPlayers().catch(() => []);
        squad = Array.isArray(fallback) ? fallback : [];
      }
      setSeasonId(current ? String(current.id) : '');
      setMatch(chosen);
      // solo convocados de ese partido
      if (chosen?.id) {
        try {
          const d = await getMatchDetail(chosen.id);
          const callups = d?.callups || [];
          const ids = new Set(callups.map(c => String(c.playerId ?? c.id)));
          if (callups.length > 0) {
            squad = squad.filter(p => ids.has(String(p.id)));
          } else {
            squad = [];
          }
        } catch {}
      }
      setPlayers(squad);
    } catch {
      setError('No se pudo abrir la votación de esta jornada.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyBallot = (ballot) => {
    const next = Object.fromEntries(SLOTS.map((slot, index) => [slot.id, ballot.playerIds[index]]));
    setSaved({ ...ballot, lineup: next });
    setLineup(next);
  };

  const refreshPublic = useCallback(async (currentSeason, currentMatch) => {
    if (!currentSeason || !currentMatch) return;
    const tallyData = await getQuintetTally(currentSeason, currentMatch.jornada).catch(() => null);
    setTally(tallyData);
    const seasonData = await getQuintetSeasonTally(currentSeason).catch(() => null);
    setSeasonTally(seasonData);
    try {
      const st = await getQuintetStatus(currentSeason, currentMatch.jornada).catch(() => null);
      setQuintetStatus(st);
    } catch { setQuintetStatus(null); }
    if (!isAdmin) {
      setBallots([]);
      return;
    }
    const list = await getQuintetBallots(currentSeason, currentMatch.jornada).catch(() => []);
    setBallots(Array.isArray(list) ? list : []);
  }, [isAdmin]);

  useEffect(() => {
    if (!seasonId || !match?.jornada) { setQuintetStatus(null); return; }
    getQuintetStatus(seasonId, match.jornada).then(setQuintetStatus).catch(() => setQuintetStatus({ open: false }));
  }, [seasonId, match?.jornada]);

  useEffect(() => {
    if (!seasonId || !match) return undefined;
    let cancelled = false;
    (async () => {
      if (!voterKey) {
        setSaved(null);
        setLineup(emptyLineup());
        setBallots([]);
        const [tallyData, seasonData] = await Promise.all([
          getQuintetTally(seasonId, match.jornada).catch(() => null),
          getQuintetSeasonTally(seasonId).catch(() => null),
        ]);
        if (!cancelled) {
          setTally(tallyData);
          setSeasonTally(seasonData);
        }
        return;
      }
      claimLegacy(voterKey);
      let mine = null;
      try {
        mine = await getMyQuintetVote(seasonId, match.jornada);
      } catch {
        mine = null;
      }
      if (!mine) {
        const local = readVote(voterKey, seasonId, match.jornada);
        const playerIds = local?.lineup ? SLOTS.map((slot) => local.lineup[slot.id]).filter(Boolean) : [];
        if (playerIds.length === 5) {
          try {
            mine = await saveQuintetVote({
              seasonId: Number(seasonId),
              jornada: match.jornada,
              matchId: match.id,
              playerIds,
            });
          } catch {
            mine = null;
          }
        }
      }
      if (cancelled) return;
      if (mine?.playerIds?.length === 5) applyBallot(mine);
      else {
        setSaved(null);
        setLineup(emptyLineup());
      }
      await refreshPublic(seasonId, match);
    })();
    return () => { cancelled = true; };
  }, [voterKey, seasonId, match, refreshPublic]);

  const displayLineup = voterKey ? lineup : emptyLineup();
  const chosenIds = useMemo(
    () => new Set(Object.values(displayLineup).filter(Boolean)),
    [displayLineup],
  );
  const filled = chosenIds.size;
  const locked = Boolean(saved);

  const assign = (player) => {
    if (!voterKey) {
      openAuth('login');
      return;
    }
    if (!isVoteOpen) return;
    if (locked) return;
    if (chosenIds.has(player.id)) {
      setLineup((current) => {
        const next = { ...current };
        for (const slot of SLOTS) {
          if (next[slot.id] === player.id) next[slot.id] = null;
        }
        return next;
      });
      return;
    }
    const target = lineup[activeSlot] == null
      ? activeSlot
      : SLOTS.find((slot) => lineup[slot.id] == null)?.id;
    if (!target) return;
    setLineup((current) => ({ ...current, [target]: player.id }));
    const nextEmpty = SLOTS.find((slot) => slot.id !== target && lineup[slot.id] == null);
    if (nextEmpty) setActiveSlot(nextEmpty.id);
  };

  const clearSlot = (slotId) => {
    if (!isVoteOpen) return;
    if (locked) return;
    setLineup((current) => ({ ...current, [slotId]: null }));
    setActiveSlot(slotId);
  };

  const submit = async () => {
    if (!voterKey) {
      openAuth('login');
      return;
    }
    if (!isVoteOpen) return;
    if (locked || filled < 5 || !match) return;
    const playerIds = SLOTS.map((slot) => lineup[slot.id]);
    const ballot = await saveQuintetVote({
      seasonId: Number(seasonId),
      jornada: match.jornada,
      matchId: match.id,
      playerIds,
    });
    writeVote(voterKey, {
      seasonId,
      jornada: match.jornada,
      matchId: match.id,
      lineup,
      votedAt: new Date().toISOString(),
    });
    applyBallot(ballot);
    refreshPublic(seasonId, match);
  };

  const editVote = () => setSaved(null);
  const deleteVote = async () => {
    if (!seasonId || !match?.jornada) return;
    try {
      await deleteQuintetVote(seasonId, match.jornada);
      setSaved(null);
      setMyVoteIds(null);
      setLineup(emptyLineup());
      // limpia localStorage por si quedó
      try {
        const all = JSON.parse(localStorage.getItem('reli-quinteto-votes') || '{}');
        const key = String(voterKey);
        if (all[key] && String(all[key].seasonId) === String(seasonId) && Number(all[key].jornada) === Number(match.jornada)) {
          delete all[key];
          localStorage.setItem('reli-quinteto-votes', JSON.stringify(all));
        }
      } catch {}
      const s = await getQuintetStatus(seasonId, match.jornada).catch(() => null);
      if (s) setQuintetStatus(s);
      await refreshPublic(seasonId, match);
    } catch (e) { alert(e.message || 'No se pudo borrar'); }
  };

  const playerById = (id) => players.find((player) => player.id === id);

  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="h-10 animate-pulse rounded-2xl bg-card-bg" />
        <div className="mt-3 h-80 animate-pulse rounded-3xl bg-card-bg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="card-depth rounded-2xl p-8 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-re-rojo">{error}</p>
        </div>
      </main>
    );
  }

  return (
      <main className="mx-auto max-w-xl space-y-3 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-re-rojo">Una vez por semana</p>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gradient-re">
            Mejor quinteto
          </h1>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/45">
          {match ? `Jornada ${match.jornada} · ${filled}/5` : 'Sin jornada'}
        </p>
      </header>

      <p className="text-xs text-foreground/60">
        {match
          ? `Jornada ${match.jornada}${match.rival ? ` ante ${match.rival}` : ''}${formatWhen(match.date) ? ` · ${formatWhen(match.date)}` : ''}. Los cinco que quieras, sin mirar el puesto.`
          : 'Todavía no hay una jornada abierta para votar.'}
      </p>

      {quintetStatus && (
        <div className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${isVoteOpen ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-re-rojo/10 text-re-rojo border-re-rojo/20'}`}>
          {isVoteOpen ? `Votación abierta · cierra jueves 23:59${quintetStatus.closesAt ? ` (${new Date(quintetStatus.closesAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })})` : ''}` : 'Votación cerrada · espera a que el admin la abra'}
        </div>
      )}
      {isAdmin && match && seasonId && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={async () => { try { const s = await openQuintet(seasonId, match.jornada); setQuintetStatus(s); } catch (e) { alert(e.message); } }} className="rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">Abrir votación</button>
          <button type="button" onClick={async () => { try { const s = await closeQuintet(seasonId, match.jornada); setQuintetStatus(s); } catch (e) { alert(e.message); } }} className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">Cerrar votación</button>
        </div>
      )}

      <section className="space-y-3">
        <div className="stadium-grass relative min-h-[400px] overflow-hidden rounded-[1.4rem] border border-re-dorado/35 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,154,91,0.18),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-3 rounded-sm border border-re-dorado/25" />
          <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px bg-white/25" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 sm:h-24 sm:w-24" />
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-10 w-24 -translate-x-1/2 border border-b-0 border-white/30" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.4)_100%)]" />

          {SLOTS.map((slot, index) => {
            const player = playerById(displayLineup[slot.id]);
            const armed = !locked && activeSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  if (!isVoteOpen) return;
                  if (!voterKey) { openAuth('login'); return; }
                  if (player) clearSlot(slot.id);
                  else setActiveSlot(slot.id);
                }}
                className="absolute z-10 w-20 -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                aria-label={player ? `Quitar a ${player.nickname || player.name}` : `Hueco ${index + 1}`}
              >
                {player ? (
                  <motion.span layoutId={`quintet-${player.id}`} className="block">
                    <span className="relative mx-auto block w-fit">
                      <span className={`absolute -inset-1 rounded-full ${armed ? 'bg-re-dorado/40 blur-sm' : ''}`} />
                      <img
                        src={player.photoUrl || FALLBACK_PHOTO}
                        alt=""
                        className="relative h-10 w-10 rounded-full object-cover ring-2 ring-re-dorado shadow-lg"
                        onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-re-rojo text-[10px] font-black text-white">
                        {player.jerseyNumber}
                      </span>
                    </span>
                    <span className="mt-1 block text-[10px] font-black uppercase leading-tight text-white">
                      {player.nickname || player.name}
                    </span>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-re-dorado">
                      {POSITION_LABELS[player.position] || player.position}
                    </span>
                  </motion.span>
                ) : (
                  <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-black text-re-dorado ${armed ? 'border-re-dorado bg-re-dorado/20 shadow-[0_0_18px_rgba(193,154,91,0.45)]' : 'border-white/40 bg-black/25'}`}>
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
            <span>{!voterKey ? 'Entra para votar' : locked ? 'Tu voto' : 'Tu quinteto'}</span>
            <span>{match ? `J${match.jornada}` : ''}</span>
          </div>
        </div>

        {isVoteOpen && players.length === 0 && (
          <div className="rounded-2xl border border-dashed border-card-border bg-muted/5 px-4 py-3 text-center text-[11px] font-bold text-muted-foreground">Aún no hay convocados para este partido, votación no disponible.</div>
        )}
        {isVoteOpen && voterKey && !locked && players.length > 0 && (
          <div className="rounded-[1.4rem] border border-re-dorado/20 bg-card-bg/80 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-re-dorado">
              Plantilla · cualquier puesto
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {players.map((player) => {
                const taken = chosenIds.has(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => assign(player)}
                    className={`flex items-center gap-1.5 rounded-full border px-1.5 py-1 pr-2.5 text-left ${
                      taken
                        ? 'border-re-rojo bg-re-rojo text-white'
                        : 'border-card-border bg-card-bg text-foreground/80 hover:border-re-dorado/50'
                    }`}
                  >
                    <img
                      src={player.photoUrl || FALLBACK_PHOTO}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                      onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
                    />
                    <span className="text-[10px] font-black uppercase leading-none">
                      {player.nickname || player.name}
                      <span className={`mt-0.5 block text-[8px] font-bold tracking-widest ${taken ? 'text-white/70' : 'text-re-dorado'}`}>
                        {POSITION_LABELS[player.position]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-foreground/55">
            {!voterKey
              ? 'Entra con tu cuenta. El voto no se comparte al salir.'
              : locked
                ? 'Este quinteto es solo tuyo. Puedes cambiarlo hasta la siguiente jornada.'
                : 'Un voto por jornada, ligado a tu usuario.'}
          </p>
          {!voterKey ? (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
            >
              Entrar para votar
            </button>
          ) : locked ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={editVote}
                className="rounded-full border border-re-dorado/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-re-dorado"
              >
                Cambiar voto
              </button>
              {isVoteOpen && (
                <button
                  type="button"
                  onClick={deleteVote}
                  className="rounded-full border border-re-rojo/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-re-rojo hover:bg-re-rojo hover:text-white transition-colors"
                >
                  Borrar voto
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={filled < 5 || !isVoteOpen}
              className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enviar voto
            </button>
          )}
        </div>
      </section>

      {(isAdmin || tally?.published) && tally && (
        <section className="rounded-[1.4rem] border border-re-dorado/30 bg-[#071018] p-4 text-white">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-re-dorado">
            {tally.published ? 'Publicado desde el martes' : 'Recuento en vivo'}
          </p>
          <h2 className="mt-1 text-lg font-black italic uppercase tracking-tight">Quinteto de la afición</h2>
          <p className="mt-1 text-[11px] text-white/55">
            {tally.totalVotes} {tally.totalVotes === 1 ? 'voto' : 'votos'}. Cada jugador suma un apoyo por papeleta. El martes quedan los cinco más votados.
          </p>
          <ol className="mt-3 space-y-2">
            {(tally.quintet || []).map((row, index) => {
              const player = playerById(row.playerId);
              return (
                <li key={row.playerId} className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2">
                  <span className="text-sm font-black uppercase">{index + 1}. {player?.nickname || player?.name || `Jugador ${row.playerId}`}</span>
                  <span className="text-[11px] font-black text-re-dorado">{row.votes} {row.votes === 1 ? 'voto' : 'votos'}</span>
                </li>
              );
            })}
            {(!tally.quintet || tally.quintet.length === 0) && (
              <li className="text-[11px] text-white/45">Todavía no hay papeletas en esta jornada.</li>
            )}
          </ol>
        </section>
      )}

      {seasonTally && (seasonTally.yearlyQuintet || []).length > 0 && (
        <section className="rounded-[1.4rem] border border-re-dorado/30 bg-card-bg p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-re-rojo">Acumulado temporada</p>
          <h2 className="mt-1 text-lg font-black italic uppercase tracking-tight">Quinteto del año · {seasonTally.totalBallots} papeletas</h2>
          <p className="mt-1 text-[11px] text-foreground/60">
            Suma de todas las jornadas: 4 jugadores de campo más votados + portero más votado.
          </p>
          <div className="stadium-grass relative mt-3 min-h-[280px] overflow-hidden rounded-[1.2rem] border border-re-dorado/35">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,154,91,0.18),transparent_46%)]" />
            <div className="pointer-events-none absolute inset-3 rounded-sm border border-re-dorado/25" />
            <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px bg-white/25" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
            {seasonTally.yearlyQuintet.map((row, index) => {
              const slot = SLOTS[index];
              const player = playerById(row.playerId);
              if (!slot) return null;
              return (
                <div key={row.playerId} className="absolute z-10 w-20 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                  <span className="relative mx-auto block w-fit">
                    <img src={player?.photoUrl || FALLBACK_PHOTO} alt="" className="relative h-10 w-10 rounded-full object-cover ring-2 ring-re-dorado shadow-lg" onError={(e) => { e.target.src = FALLBACK_PHOTO; }} />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-re-rojo text-[10px] font-black text-white">{player?.jerseyNumber ?? '•'}</span>
                  </span>
                  <span className="mt-1 block text-[10px] font-black uppercase leading-tight text-white">{player?.nickname || player?.name || `Jugador ${row.playerId}`}</span>
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-re-dorado">{row.votes} votos</span>
                </div>
              );
            })}
          </div>
          <ol className="mt-3 space-y-2">
            {(seasonTally.yearlyQuintet || []).map((row, index) => {
              const player = playerById(row.playerId);
              return (
                <li key={row.playerId} className="flex items-center justify-between rounded-xl bg-muted/20 px-3 py-2">
                  <span className="text-sm font-black uppercase">{index + 1}. {player?.nickname || player?.name || `Jugador ${row.playerId}`} <span className="text-[10px] text-foreground/50">({POSITION_LABELS[player?.position] || player?.position || ''})</span></span>
                  <span className="text-[11px] font-black text-re-rojo">{row.votes} votos</span>
                </li>
              );
            })}
          </ol>
          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] font-black uppercase tracking-widest text-re-dorado">Ver ranking completo</summary>
            <ol className="mt-2 space-y-1">
              {(seasonTally.ranking || []).map((row, index) => {
                const player = playerById(row.playerId);
                return (
                  <li key={row.playerId} className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-1.5 text-xs">
                    <span>{index + 1}. {player?.nickname || player?.name || row.playerId}</span>
                    <span className="font-black">{row.votes}</span>
                  </li>
                );
              })}
            </ol>
          </details>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-[1.4rem] border border-white/10 bg-card-bg p-4">
          <h2 className="text-sm font-black uppercase tracking-tight">Quién ha votado</h2>
          <ul className="mt-3 space-y-2">
            {ballots.map((ballot) => (
              <li key={ballot.userId} className="rounded-xl border border-card-border px-3 py-2">
                <p className="text-[11px] font-black uppercase text-re-rojo">{ballot.username}</p>
                <p className="mt-1 text-[11px] text-foreground/70">
                  {ballot.playerIds.map((id) => playerById(id)?.nickname || playerById(id)?.name || id).join(' · ')}
                </p>
              </li>
            ))}
            {ballots.length === 0 && (
              <li className="text-[11px] text-foreground/50">Nadie ha enviado el quinteto todavía.</li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
