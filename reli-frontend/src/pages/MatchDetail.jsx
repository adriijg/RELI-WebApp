import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import { getMatchDetail, getMatches, getStats, getCompetitions, getPlayerSeasonStats, getQuintetStatus, getQuintetTally, deleteQuintetVote, getAllPlayers, getMyQuintetVote, openQuintet, closeQuintet, saveQuintetVote } from '../services/api';
import { useApp } from '../context/AppContext';
import { rememberAdminMatch } from '../utils/adminRecentMatches';
import { STATUS_LABELS } from '../constants/matchStatus';
import { jerseyForCompetition } from '../constants/jerseys';
import { POSITION_LABELS } from '../constants/positions';
import { isMatchLive } from '../utils/matches';

const FALLBACK_PHOTO = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png';
const QUINTET_SLOTS = [
  { x: 50, y: 16 },
  { x: 22, y: 36 },
  { x: 78, y: 36 },
  { x: 50, y: 56 },
  { x: 50, y: 78 },
];

function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupGoals(goals) {
  const map = new Map();
  for (const goal of goals) {
    const existing = map.get(goal.playerId);
    if (existing) {
      existing.minutes.push(goal.minute);
    } else {
      map.set(goal.playerId, {
        playerId: goal.playerId,
        playerName: goal.playerName,
        jerseyNumber: goal.jerseyNumber,
        minutes: [goal.minute],
      });
    }
  }
  return Array.from(map.values());
}

function getMatchList(data) {
  return Array.isArray(data) ? data : data?.content ?? [];
}

function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(fs|f s|futsal)\s+/, '');
}

function isPlayed(match) {
  const timestamp = match?.date ? new Date(match.date).getTime() : NaN;
  if (!Number.isNaN(timestamp) && timestamp > Date.now()) return false;
  return match?.status === 'FINISHED' || (match?.ourGoals != null && match?.rivalGoals != null);
}

function sortNewestFirst(matches) {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });
}

function getResultGoals(match) {
  return {
    ourGoals: match.ourGoals,
    rivalGoals: match.rivalGoals,
  };
}

async function getFfmMatches(competitionIds) {
  const results = await Promise.allSettled(
    competitionIds.map(async (competitionId) => {
      const indexResponse = await fetch(`/ffm/${competitionId}/index.json`);
      if (!indexResponse.ok) return [];
      const index = await indexResponse.json();
      const rounds = await Promise.all(
        (index.rounds || []).map(async (round) => {
          const response = await fetch(`/ffm/${competitionId}/jornada-${round}.json`);
          if (!response.ok) return [];
          const games = await response.json();
          return games.map((game) => ({ ...game, competitionId, jornada: round }));
        }),
      );
      return rounds.flat();
    }),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

function mapTeamMatches(ffmMatches, rivalName) {
  const rivalKey = normalizeName(rivalName);
  const rivalCodes = new Set(
    ffmMatches.flatMap((game) => {
      if (normalizeName(game.home) === rivalKey) return [game.homeCode];
      if (normalizeName(game.away) === rivalKey) return [game.awayCode];
      return [];
    }),
  );
  const teamCode = [...rivalCodes][0];
  if (!teamCode) return [];

  return ffmMatches
    .filter((game) => String(game.homeCode) === String(teamCode) || String(game.awayCode) === String(teamCode))
    .map((game) => {
      const isHome = String(game.homeCode) === String(teamCode);
      return {
        id: `ffm-${game.competitionId}-${game.jornada}-${game.homeCode}-${game.awayCode}`,
        rival: isHome ? game.away : game.home,
        home: isHome,
        date: game.date,
        status: game.homeGoals != null && game.awayGoals != null ? 'FINISHED' : 'SCHEDULED',
        ourGoals: game.homeGoals,
        rivalGoals: game.awayGoals,
        jornada: game.jornada,
        competitionId: game.competitionId,
      };
    });
}

function buildRivalInfo(detail, allMatches, teamMatches) {
  const match = detail.match;
  const currentRival = detail.rivalInfo?.rivalName || match.rival;
  const rivalKey = normalizeName(currentRival);
  const sourceMatches = allMatches.filter((candidate) => normalizeName(candidate.rival) === rivalKey);
  const fallbackInfo = detail.rivalInfo || {};

  if (!sourceMatches.length) {
    return {
      ...fallbackInfo,
      rivalName: currentRival,
      recentMatches: sortNewestFirst((teamMatches.length ? teamMatches : fallbackInfo.recentMatches || []).filter(isPlayed)).slice(0, 5),
      headToHead: sortNewestFirst((fallbackInfo.headToHead || []).filter(isPlayed)),
    };
  }

  const pastMatches = sourceMatches.filter(isPlayed);
  const recentMatches = sortNewestFirst(
    (teamMatches.length ? teamMatches : pastMatches).filter((candidate) => String(candidate.id) !== String(match.id) && isPlayed(candidate)),
  ).slice(0, 5);
  const headToHead = sortNewestFirst(pastMatches);
  const results = headToHead.map(getResultGoals);
  const ourWins = results.filter(({ ourGoals, rivalGoals }) => ourGoals > rivalGoals).length;
  const rivalWins = results.filter(({ ourGoals, rivalGoals }) => ourGoals < rivalGoals).length;

  return {
    ...fallbackInfo,
    rivalName: currentRival,
    recentMatches,
    headToHead,
    ourWins,
    draws: headToHead.length - ourWins - rivalWins,
    rivalWins,
  };
}

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, openAuth } = useApp();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quintet, setQuintet] = useState(null);
  const [quintetPlayers, setQuintetPlayers] = useState([]);
  const [quintetLoading, setQuintetLoading] = useState(false);
  const [quintetSeasonId, setQuintetSeasonId] = useState(null);
  const [myVoteIds, setMyVoteIds] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [voteSaving, setVoteSaving] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [quintetStatus, setQuintetStatus] = useState(null);
  const isVoteOpen = quintetStatus?.open === true;
  const [allPlayersMap, setAllPlayersMap] = useState(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detailResult, matchesResult, statsResult] = await Promise.allSettled([
        getMatchDetail(id),
        getMatches({ page: 0, size: 1000, sortBy: 'date', direction: 'desc' }),
        getStats({ matchId: id, size: 200 }),
      ]);
      if (detailResult.status === 'rejected') throw detailResult.reason;
      const data = detailResult.value;
      if (isAdmin) rememberAdminMatch(data.match);
      const statsValue = statsResult.status === 'fulfilled' ? statsResult.value : [];
      const matchStats = Array.isArray(statsValue) ? statsValue : statsValue?.content ?? [];
      const allMatches = matchesResult.status === 'fulfilled' ? getMatchList(matchesResult.value) : [];
      const competitionIds = [...new Set(
        allMatches
          .filter((candidate) => normalizeName(candidate.rival) === normalizeName(data.rivalInfo?.rivalName || data.match.rival))
          .map((candidate) => candidate.competitionId)
          .filter((competitionId) => competitionId != null),
      )];
      if (data.match.competitionId != null) competitionIds.push(data.match.competitionId);
      const ffmMatches = await getFfmMatches([...new Set(competitionIds)]);
      const teamMatches = mapTeamMatches(ffmMatches, data.rivalInfo?.rivalName || data.match.rival);
      setDetail({ ...data, stats: matchStats, rivalInfo: buildRivalInfo(data, allMatches, teamMatches) });
    } catch (err) {
      setError(err.message || 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const jornada = detail?.match?.jornada;
    const competitionId = detail?.match?.competitionId;
    if (jornada == null || competitionId == null) return;
    let cancelled = false;
    (async () => {
      setQuintetLoading(true);
      try {
        const competitionsData = await getCompetitions({ size: 200 });
        const competitions = Array.isArray(competitionsData) ? competitionsData : competitionsData?.content ?? [];
        const competition = competitions.find((c) => String(c.id) === String(competitionId));
        const seasonId = competition?.seasonId;
        if (!seasonId) return;
        if (cancelled) return;
        setQuintetSeasonId(seasonId);
        const [tally, stats] = await Promise.all([
          getQuintetTally(seasonId, jornada).catch(() => null),
          getPlayerSeasonStats({ seasonId }).catch(() => []),
        ]);
        if (cancelled) return;
        setQuintet(tally);
        // stats trae playerId, mapear a id para reutilizar lógica existente
        let mapped = (Array.isArray(stats) ? stats : []).map((p) => ({
          id: p.playerId,
          name: p.name,
          nickname: p.nickname,
          surnames: p.surnames,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          photoUrl: p.photoUrl,
        }));
        // solo convocados de ese partido
        const callups = detail?.callups || [];
        const callupIds = new Set(callups.map((c) => String(c.playerId ?? c.id)));
        if (callups.length > 0) {
          mapped = mapped.filter((p) => callupIds.has(String(p.id)));
        } else {
          mapped = [];
        }
        if (mapped.length > 0) setQuintetPlayers(mapped);
        else {
          const fallback = await getAllPlayers().catch(() => []);
          let fb = Array.isArray(fallback) ? fallback : [];
          if (callups.length > 0) {
            fb = fb.filter((p) => callupIds.has(String(p.id)));
          } else {
            fb = [];
          }
          setQuintetPlayers(fb);
        }
      } finally {
        if (!cancelled) setQuintetLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [detail?.match?.jornada, detail?.match?.competitionId]);

  useEffect(() => {
    if (!quintetSeasonId || !detail?.match?.jornada) { setQuintetStatus(null); return; }
    getQuintetStatus(quintetSeasonId, detail.match.jornada).then(setQuintetStatus).catch(() => setQuintetStatus({ open: false }));
  }, [quintetSeasonId, detail?.match?.jornada]);

  useEffect(() => {
    getAllPlayers().then((list) => {
      const m = new Map();
      (Array.isArray(list) ? list : []).forEach((p) => m.set(p.id, p));
      // también añadir los de quintetPlayers por si tienen nick actualizado por temporada
      quintetPlayers.forEach((p) => { if (!m.has(p.id)) m.set(p.id, p); });
      setAllPlayersMap(m);
    }).catch(() => {});
  }, [quintetPlayers]);

  useEffect(() => {
    const jornada = detail?.match?.jornada;
    if (!user || !quintetSeasonId || jornada == null) {
      setMyVoteIds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mine = await getMyQuintetVote(quintetSeasonId, jornada).catch(() => null);
        if (cancelled) return;
        const ids = mine?.playerIds?.length === 5 ? mine.playerIds.map(Number) : null;
        setMyVoteIds(ids);
        setSelectedIds(ids ?? []);
      } catch {
        if (!cancelled) setMyVoteIds(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user, quintetSeasonId, detail?.match?.jornada]);

  const toggleQuintetPlayer = (playerId) => {
    if (!user) {
      openAuth('login');
      return;
    }
    if (!isVoteOpen) return;
    const numericId = Number(playerId);
    setVoteError('');
    setSelectedIds((current) => {
      if (current.includes(numericId)) return current.filter((item) => item !== numericId);
      if (current.length >= 5) return current;
      return [...current, numericId];
    });
  };

  const submitQuintetVote = async () => {
    const jornada = detail?.match?.jornada;
    const matchId = detail?.match?.id;
    if (!user) {
      openAuth('login');
      return;
    }
    if (!isVoteOpen) return;
    if (!quintetSeasonId || jornada == null || selectedIds.length !== 5) return;
    setVoteSaving(true);
    setVoteError('');
    try {
      const ballot = await saveQuintetVote({
        seasonId: Number(quintetSeasonId),
        jornada,
        matchId,
        playerIds: selectedIds,
      });
      const ids = (ballot?.playerIds ?? selectedIds).map(Number);
      setMyVoteIds(ids);
      setSelectedIds(ids);
      const tally = await getQuintetTally(quintetSeasonId, jornada).catch(() => null);
      if (tally) setQuintet(tally);
    } catch (err) {
      setVoteError(err.message || 'No se pudo guardar tu voto');
    } finally {
      setVoteSaving(false);
    }
  };

  const deleteMyVote = async () => {
    if (!quintetSeasonId || !detail?.match?.jornada) return;
    try {
      await deleteQuintetVote(quintetSeasonId, detail.match.jornada);
      setMyVoteIds(null);
      setSelectedIds([]);
      const s = await getQuintetStatus(quintetSeasonId, detail.match.jornada).catch(() => null);
      if (s) setQuintetStatus(s);
      const tally = await getQuintetTally(quintetSeasonId, detail.match.jornada).catch(() => null);
      if (tally) setQuintet(tally);
    } catch (e) { alert(e.message || 'No se pudo borrar'); }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-64 sm:h-72 rounded-[40px] bg-card-bg animate-pulse" />
        <div className="h-40 rounded-3xl bg-card-bg animate-pulse" />
        <div className="h-40 rounded-3xl bg-card-bg animate-pulse" />
      </main>
    );
  }

  if (error || !detail?.match) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="card-depth rounded-3xl p-8 sm:p-10 text-center">
          <p className="text-4xl sm:text-5xl font-black italic text-re-rojo mb-4">404</p>
          <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase mb-2">
            {error || 'Partido no encontrado'}
          </h1>
          <Link
            to="/"
            className="inline-block mt-4 bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const { match, goals, callups, rivalInfo, stats = [] } = detail;
  const isHome = match.home !== false;
  const left = isHome
    ? { name: 'REAL LISIADOS', isUs: true }
    : { name: match.rival, isUs: false };
  const right = isHome
    ? { name: match.rival, isUs: false }
    : { name: 'REAL LISIADOS', isUs: true };
  const leftGoals = isHome ? match.ourGoals : match.rivalGoals;
  const rightGoals = isHome ? match.rivalGoals : match.ourGoals;
  const historicalJersey = (playerId, jerseyNumber) =>
    jerseyForCompetition(playerId, match.competitionId, jerseyNumber);
  const scorers = groupGoals(goals).map((scorer) => ({
    ...scorer,
    jerseyNumber: historicalJersey(scorer.playerId, scorer.jerseyNumber),
  }));
  const jerseyByPlayer = new Map();
  for (const g of goals) {
    if (g?.playerId != null && g?.jerseyNumber != null && !jerseyByPlayer.has(g.playerId)) {
      jerseyByPlayer.set(g.playerId, historicalJersey(g.playerId, g.jerseyNumber));
    }
  }
  for (const c of callups) {
    if (c?.playerId != null && c?.jerseyNumber != null && !jerseyByPlayer.has(c.playerId)) {
      jerseyByPlayer.set(c.playerId, historicalJersey(c.playerId, c.jerseyNumber));
    }
  }
  const carded = stats.filter((s) => (s?.yellowCards ?? 0) > 0 || (s?.redCards ?? 0) > 0);
  const formattedDate = formatDateTime(match.date);
  const finished = match.status === 'FINISHED' && match.ourGoals != null && match.rivalGoals != null;
  const displayName = (playerId, fallback) => {
    const p = allPlayersMap.get(playerId);
    if (p) return p.nickname || p.name || fallback;
    const q = quintetPlayers.find((x) => String(x.id) === String(playerId));
    if (q) return q.nickname || q.name || fallback;
    return fallback;
  };

  return (
    <main className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Cabecera */}
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl sm:rounded-[40px] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] overflow-hidden">
        <div className="bg-re-rojo px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 text-white font-black text-[10px] sm:text-[11px] tracking-widest uppercase hover:text-white/80 transition-colors"
          >
            ← Volver
          </button>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/80 truncate max-w-[50%] text-right">
            {match.competitionName || 'Competición'}
            {match.jornada != null ? ` • J${match.jornada}` : ''}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-muted/10 text-muted-foreground border border-card-border">
              {STATUS_LABELS[match.status] || match.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
            <div className="text-center flex-1 min-w-0">
              <div className="h-10 sm:h-14 flex items-center justify-center mb-2">
                {left.isUs ? (
                  <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                ) : (
                  <span className="text-3xl sm:text-5xl lg:text-6xl">⚽</span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg lg:text-2xl font-black tracking-tighter uppercase break-words leading-tight">
                {left.name}
              </h2>
            </div>

            <div className="shrink-0 text-center px-1 sm:px-2">
              {finished ? (
                <span className="text-re-rojo font-black italic text-3xl sm:text-4xl lg:text-5xl tracking-tighter block leading-none">
                  {leftGoals} - {rightGoals}
                </span>
              ) : (
                <span className="text-re-rojo font-black italic text-3xl sm:text-4xl lg:text-5xl tracking-tighter block leading-none">
                  VS
                </span>
              )}
              <p className="hidden sm:block mt-2 sm:mt-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-muted-foreground leading-tight">
                {formattedDate || 'Fecha TBD'}
              </p>
            </div>

            <div className="text-center flex-1 min-w-0">
              <div className="h-10 sm:h-14 flex items-center justify-center mb-2">
                {right.isUs ? (
                  <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                ) : (
                  <span className="text-3xl sm:text-5xl lg:text-6xl">⚽</span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg lg:text-2xl font-black tracking-tighter uppercase break-words leading-tight">
                {right.name}
              </h2>
            </div>
          </div>

          <p className="sm:hidden mt-4 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-tight">
            {formattedDate || 'Fecha TBD'}
          </p>

          <div className="mt-4 pt-4 border-t border-card-border text-center">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-re-rojo mb-1">📍 Sede</p>
            <p className="font-black text-xs sm:text-sm uppercase text-foreground/80">
              {match.location || 'Sede por confirmar'}
            </p>
            {finished && (
              <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-foreground/70">
                {callups.length} convocados
                {carded.length > 0 ? ` · ${carded.length} ${carded.length === 1 ? 'tarjeta' : 'tarjetas'}` : ''}
                {goals.length > 0 ? ` · ${goals.length} ${goals.length === 1 ? 'gol' : 'goles'}` : ' · sin goles nuestros'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Goleadores */}
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Goleadores</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {goals.length} {goals.length === 1 ? 'gol' : 'goles'}
          </span>
        </div>

        {scorers.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-4 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            {finished && (match.ourGoals ?? 0) === 0
              ? 'El Real Lisiados no marcó en este partido.'
              : 'Todavía no hay goles registrados para este partido.'}
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {scorers.map((scorer) => (
              <li
                key={scorer.playerId}
                className="flex items-center gap-2 sm:gap-4 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-rojo text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {scorer.jerseyNumber}
                </span>
                <span className="font-black text-xs sm:text-sm flex-1 min-w-0 truncate text-foreground dark:text-white">{displayName(scorer.playerId, scorer.playerName)}</span>
                <span className="text-re-rojo font-black text-[10px] sm:text-xs tracking-widest uppercase shrink-0">
                  ⚽ {scorer.minutes.filter((m) => m != null).map((m) => `${m}'`).join(', ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tarjetas */}
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Tarjetas</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {carded.length} {carded.length === 1 ? 'jugador' : 'jugadores'}
          </span>
        </div>

        {carded.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 sm:py-8 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            Sin tarjetas en este partido.
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {carded.map((s) => (
              <li
                key={s.playerId}
                className="flex items-center gap-2 sm:gap-4 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-azul-oscuro text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {jerseyByPlayer.get(s.playerId) ?? '—'}
                </span>
                <span className="font-black text-xs sm:text-sm flex-1 min-w-0 truncate">{displayName(s.playerId, s.playerName)}</span>
                <span className="shrink-0 flex items-center gap-2 text-[10px] sm:text-xs font-black tracking-widest uppercase">
                  {(s.yellowCards ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-4 rounded-[3px] bg-yellow-400 border border-yellow-600" />
                      {s.yellowCards > 1 ? `x${s.yellowCards}` : ''}
                    </span>
                  )}
                  {(s.redCards ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-4 rounded-[3px] bg-red-600 border border-red-800" />
                      {s.redCards > 1 ? `x${s.redCards}` : ''}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Convocados */}
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Convocados</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {callups.length} {callups.length === 1 ? 'jugador' : 'jugadores'}
          </span>
        </div>

        {callups.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 sm:py-8 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            Aún no hay convocados para este partido.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {callups.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 sm:gap-3 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-azul-oscuro text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {historicalJersey(player.playerId ?? player.id, player.jerseyNumber)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs sm:text-sm truncate">{displayName(player.playerId ?? player.id, player.playerName)}</p>
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {POSITION_LABELS[player.position] || player.position}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quinteto ideal de la jornada */}
      {match.jornada != null && (
        <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">
              Quinteto ideal · J{match.jornada}
            </h3>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {selectedIds.length}/5
            </span>
          </div>

          {quintetStatus && (
            <div className={`mb-3 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${isVoteOpen ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-re-rojo/10 text-re-rojo border-re-rojo/20'}`}>
              {isVoteOpen ? `Votación abierta · cierra jueves 23:59${quintetStatus.closesAt ? ` (${new Date(quintetStatus.closesAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })})` : ''}` : 'Votación cerrada · espera a que el admin la abra'}
            </div>
          )}
          {isAdmin && quintetSeasonId && match.jornada != null && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={async () => { try { const s = await openQuintet(quintetSeasonId, match.jornada); setQuintetStatus(s); } catch (e) { alert(e.message); } }} className="rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">Abrir votación</button>
              <button type="button" onClick={async () => { try { const s = await closeQuintet(quintetSeasonId, match.jornada); setQuintetStatus(s); } catch (e) { alert(e.message); } }} className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">Cerrar votación</button>
            </div>
          )}

          {quintetLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-muted/10" />
          ) : (
            <>
              {!user ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-card-border bg-muted/5 px-4 py-3">
                  <p className="text-xs font-bold text-muted-foreground">
                    Entra para votar tu quinteto de esta jornada.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    Entrar para votar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myVoteIds && (
                    <div className="space-y-2">
                      <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-[11px] font-black uppercase tracking-widest text-emerald-600">
                        Tu voto está guardado · puedes cambiarlo
                      </p>
                      {isVoteOpen && (
                        <button type="button" onClick={deleteMyVote} className="w-full rounded-full border border-re-rojo/30 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-re-rojo hover:bg-re-rojo hover:text-white transition-colors">Borrar mi voto</button>
                      )}
                    </div>
                  )}
                  {quintetPlayers.length === 0 ? (
                    <p className="text-[11px] font-bold text-muted-foreground">Aún no hay convocados para este partido.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {quintetPlayers.map((player) => {
                        const numericId = Number(player.id);
                        const taken = selectedIds.includes(numericId);
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => toggleQuintetPlayer(player.id)}
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase ${
                              taken
                                ? 'border-re-rojo bg-re-rojo text-white'
                                : 'border-card-border bg-card-bg text-foreground/70 hover:border-re-rojo/50'
                            }`}
                          >
                            {player.nickname || player.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {voteError && (
                    <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-[11px] font-bold text-red-500">
                      {voteError}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedIds([]); setVoteError(''); }}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:underline"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={submitQuintetVote}
                      disabled={selectedIds.length !== 5 || voteSaving || !isVoteOpen}
                      className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {voteSaving ? 'Guardando...' : myVoteIds ? 'Actualizar voto' : 'Enviar voto'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-card-border pt-4 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {quintet?.published ? 'Quinteto de la afición · desde el martes' : 'Recuento en vivo · votando'}
                </p>
                {quintet && (quintet.quintet || []).length > 0 ? (
                  <>
                    <div className="stadium-grass relative min-h-[340px] overflow-hidden rounded-[1.4rem] border border-re-dorado/35 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(193,154,91,0.18),transparent_46%)]" />
                      <div className="pointer-events-none absolute inset-3 rounded-sm border border-re-dorado/25" />
                      <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px bg-white/25" />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 sm:h-24 sm:w-24" />
                      <div className="pointer-events-none absolute bottom-2 left-1/2 h-10 w-24 -translate-x-1/2 border border-b-0 border-white/30" />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.4)_100%)]" />
                      {quintet.quintet.map((row, index) => {
                        const slot = QUINTET_SLOTS[index];
                        const player = quintetPlayers.find((p) => String(p.id) === String(row.playerId));
                        if (!slot) return null;
                        return (
                          <div
                            key={row.playerId}
                            className="absolute z-10 w-20 -translate-x-1/2 -translate-y-1/2 text-center"
                            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                          >
                            <span className="relative mx-auto block w-fit">
                              <img
                                src={player?.photoUrl || FALLBACK_PHOTO}
                                alt=""
                                className="relative h-10 w-10 rounded-full object-cover ring-2 ring-re-dorado shadow-lg"
                                onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
                              />
                              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-re-rojo text-[10px] font-black text-white">
                                {player?.jerseyNumber ?? '•'}
                              </span>
                            </span>
                            <span className="mt-1 block text-[10px] font-black uppercase leading-tight text-white">
                              {player?.nickname || player?.name || `Jugador ${row.playerId}`}
                            </span>
                            <span className="block text-[8px] font-bold uppercase tracking-widest text-re-dorado">
                              {row.votes} {row.votes === 1 ? 'voto' : 'votos'}
                            </span>
                          </div>
                        );
                      })}
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                        <span>Quinteto J{match.jornada}</span>
                        <span>{quintet.totalVotes} {quintet.totalVotes === 1 ? 'voto' : 'votos'}</span>
                      </div>
                    </div>
                    <ol className="space-y-2 sm:space-y-3">
                      {quintet.quintet.map((row, index) => {
                        const player = quintetPlayers.find((p) => String(p.id) === String(row.playerId));
                        return (
                          <li
                            key={row.playerId}
                            className="flex items-center gap-2 sm:gap-3 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
                          >
                            <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-rojo text-white font-black text-xs sm:text-sm flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-black text-xs sm:text-sm flex-1 min-w-0 truncate">
                              {player?.nickname || player?.name || `Jugador ${row.playerId}`}
                            </span>
                            <span className="text-re-rojo font-black text-[10px] sm:text-xs tracking-widest uppercase shrink-0">
                              {row.votes} {row.votes === 1 ? 'voto' : 'votos'}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 bg-muted/5 rounded-2xl border border-dashed border-card-border">
                    {quintet && !quintet.published
                      ? 'La votación de esta jornada sigue abierta. Elige tus 5 arriba.'
                      : 'Todavía no hay quinteto votado para esta jornada. ¡Sé el primero!'}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Últimos partidos del rival */}
      {rivalInfo && (
        <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase mb-4 sm:mb-6">
            Últimos partidos de {rivalInfo.rivalName}
          </h3>
          {rivalInfo.recentMatches?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {rivalInfo.recentMatches.map((m) => {
              const mIsHome = m.home !== false;
              const mOurGoals = mIsHome ? m.ourGoals : m.rivalGoals;
              const mRivalGoals = mIsHome ? m.rivalGoals : m.ourGoals;
              const mDate = m.date ? new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={m.id} className="flex items-center gap-2 sm:gap-3 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest shrink-0 w-20 text-center">{mDate}</span>
                  <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${mIsHome ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
                    {mIsHome ? 'Local' : 'Visitante'}
                  </span>
                  <span className="flex-1 min-w-0 text-xs sm:text-sm font-black uppercase truncate">{m.rival}</span>
                  <span className="font-black text-sm sm:text-base shrink-0">
                    {mOurGoals != null && mRivalGoals != null ? (
                      <span className={mOurGoals > mRivalGoals ? 'text-emerald-500' : mOurGoals < mRivalGoals ? 'text-re-rojo' : 'text-muted-foreground'}>
                        {mOurGoals} - {mRivalGoals}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 bg-muted/5 rounded-2xl border border-dashed border-card-border">
              Todavía no hay partidos jugados registrados.
            </p>
          )}
        </section>
      )}

      {/* Histórico contra ellos */}
      {rivalInfo && (
        <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-3xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">
              Histórico vs {rivalInfo.rivalName}
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500">{rivalInfo.ourWins ?? 0}V</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rivalInfo.draws ?? 0}E</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-re-rojo">{rivalInfo.rivalWins ?? 0}D</span>
            </div>
          </div>
          {rivalInfo.headToHead?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {rivalInfo.headToHead.map((m) => {
              const mIsHome = m.home !== false;
              const mOurGoals = mIsHome ? m.ourGoals : m.rivalGoals;
              const mRivalGoals = mIsHome ? m.rivalGoals : m.ourGoals;
              const resultGoals = getResultGoals(m);
              const mDate = m.date ? new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={m.id} className="flex items-center gap-2 sm:gap-3 bg-muted/5 dark:bg-white/5 border border-card-border dark:border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest shrink-0 w-20 text-center">{mDate}</span>
                  <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${mIsHome ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
                    {mIsHome ? 'Local' : 'Visitante'}
                  </span>
                  <span className="flex-1 min-w-0 text-xs sm:text-sm font-black uppercase truncate">{m.rival}</span>
                  <span className="font-black text-sm sm:text-base shrink-0">
                    {mOurGoals != null && mRivalGoals != null ? (
                      <span className={resultGoals.ourGoals > resultGoals.rivalGoals ? 'text-emerald-500' : resultGoals.ourGoals < resultGoals.rivalGoals ? 'text-re-rojo' : 'text-muted-foreground'}>
                        {mOurGoals} - {mRivalGoals}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 bg-muted/5 rounded-2xl border border-dashed border-card-border">
              Todavía no hay enfrentamientos registrados.
            </p>
          )}
          <p className="px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-t border-card-border mt-4">
            {(rivalInfo.ourWins ?? 0) + (rivalInfo.draws ?? 0) + (rivalInfo.rivalWins ?? 0)} partidos · {rivalInfo.ourWins ?? 0} victorias · {rivalInfo.draws ?? 0} empates · {rivalInfo.rivalWins ?? 0} derrotas
          </p>
        </section>
      )}

      {/* Estado en vivo */}
      {isMatchLive(match) && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl py-3 sm:py-4 text-center">
          <p className="font-black text-xs sm:text-sm tracking-widest uppercase text-blue-500 animate-pulse">
            ⚡ Partido en juego
          </p>
        </div>
      )}
    </main>
  );
}
