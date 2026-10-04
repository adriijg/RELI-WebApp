import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { getCompetitions, getSeasons, getStandings, getMatchesByCompetition, toPage, getNeutralMatches, saveNeutralMatch, deleteNeutralMatch, getRoundActas, fetchActaHtml, fetchActaPdf } from '../services/api';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS } from '../constants/matchStatus';
import AdminMatchEditButton from '../components/admin/AdminMatchEditButton';
import { computeStandings } from '../utils/standings';
import { getMatchOutcome, scoreTextClass } from '../utils/matchResult';

function formatDate(dateStr) {
  if (!dateStr) return 'Por confirmar';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Por confirmar';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function MatchRow({ match, navigate }) {
  const isHome = match.home !== false;
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PROGRESS';

  return (
    <div
      onClick={() => navigate(`/partidos/${match.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/partidos/${match.id}`); }}
      className="mx-3 my-2 flex cursor-pointer items-center gap-2 rounded-2xl border border-card-border dark:border-white/10 bg-muted/5 dark:bg-black/30 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-re-dorado/40 dark:hover:border-re-dorado/50 sm:gap-3 sm:px-4"
    >
      <div className="w-14 shrink-0 border-r border-card-border dark:border-re-dorado/25 pr-2 text-center sm:w-20">
        <p className="text-[8px] font-black uppercase tracking-widest text-re-dorado sm:text-[10px]">{formatDate(match.date)}</p>
        {match.date && (
          <p className="text-[8px] font-bold text-muted-foreground dark:text-white/45 sm:text-[10px]">{formatTime(match.date)}</p>
        )}
      </div>

      <div className="flex-1 min-w-0 text-right overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] font-black uppercase tracking-tight text-foreground dark:text-white sm:text-sm">
          {isHome ? 'Real Lisiados' : match.rival}
        </span>
      </div>

      <div className="shrink-0 text-center px-1 sm:px-2">
        {finished && match.ourGoals != null && match.rivalGoals != null ? (
          <span className={`${scoreTextClass(getMatchOutcome(match.ourGoals, match.rivalGoals))} font-black italic text-base sm:text-xl tracking-tighter`}>
            {isHome ? match.ourGoals : match.rivalGoals} - {isHome ? match.rivalGoals : match.ourGoals}
          </span>
        ) : live ? (
          <span className="text-blue-500 font-black text-[9px] sm:text-xs tracking-widest uppercase animate-pulse">EN VIVO</span>
        ) : (
          <span className="text-xs font-black italic text-re-rojo sm:text-sm">VS</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] sm:text-sm font-black uppercase tracking-tight text-foreground dark:text-white">
          {isHome ? match.rival : 'Real Lisiados'}
        </span>
      </div>

      <div className="shrink-0 text-right">
        <span className={`text-[7px] sm:text-[9px] font-black px-1.5 sm:px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap ${
          finished ? 'bg-muted/10 text-foreground/50' :
          live ? 'bg-blue-500/10 text-blue-500' :
          'bg-re-dorado/15 text-re-dorado'
        }`}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <AdminMatchEditButton matchId={match.id} />
      </div>
    </div>
  );
}

function RoundRow({ game, onClick, dbId }) {
  const finished = game.homeGoals != null && game.awayGoals != null;
  const clickable = typeof onClick === 'function';
  const ourOutcome = game.ours && game.ourGoals != null && game.rivalGoals != null
    ? getMatchOutcome(game.ourGoals, game.rivalGoals)
    : null;
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`flex items-center gap-2 rounded-2xl p-3 transition-colors sm:gap-3 sm:p-4 ${
        game.ours ? 'border border-re-rojo/30 bg-re-rojo/10' : ''
      } ${clickable ? 'cursor-pointer hover:bg-white/5 hover:border-re-dorado/20' : ''}`}
    >
      <div className="shrink-0 w-14 sm:w-20 text-center">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/40">{formatDate(game.date)}</p>
        {game.date && (
          <p className="text-[8px] sm:text-[10px] font-bold text-foreground/30">{formatTime(game.date)}</p>
        )}
      </div>

      <div className="flex-1 min-w-0 text-right overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] sm:text-sm font-black uppercase tracking-tight">
          {game.home}
        </span>
      </div>

      <div className="shrink-0 text-center px-1 sm:px-2">
        {finished ? (
          <span className={`${ourOutcome ? scoreTextClass(ourOutcome) : 'text-re-rojo'} font-black italic text-base sm:text-xl tracking-tighter`}>
            {game.homeGoals} - {game.awayGoals}
          </span>
        ) : (
          <span className="text-foreground/30 font-black text-xs sm:text-sm">VS</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] sm:text-sm font-black uppercase tracking-tight">
          {game.away}
        </span>
      </div>

      <div className="shrink-0 hidden md:block w-32 text-right">
        <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/30 truncate block">
          {game.venue || ''}
        </span>
      </div>
      {dbId != null && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <AdminMatchEditButton matchId={dbId} />
        </div>
      )}
    </div>
  );
}

function normTeam(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sameGame(a, b) {
  if (a?.homeCode && b?.homeCode && a?.awayCode && b?.awayCode) {
    return String(a.homeCode) === String(b.homeCode) && String(a.awayCode) === String(b.awayCode);
  }
  return normTeam(a?.home) === normTeam(b?.home) && normTeam(a?.away) === normTeam(b?.away);
}

function toInputDateTime(iso) {
  if (!iso) return '';
  const s = String(iso).slice(0, 16);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? s : '';
}

/** Editor inline de un partido neutro (solo admin). */
function NeutralEditor({ game, neutral, competitionId, jornada, onSaved, onClose }) {
  const [date, setDate] = useState(() => toInputDateTime(neutral?.date ?? game.date));
  const [venue, setVenue] = useState(neutral?.venue ?? game.venue ?? '');
  const [homeGoals, setHomeGoals] = useState(neutral?.homeGoals ?? game.homeGoals ?? '');
  const [awayGoals, setAwayGoals] = useState(neutral?.awayGoals ?? game.awayGoals ?? '');
  const [status, setStatus] = useState(neutral?.status ?? (game.homeGoals != null && game.awayGoals != null ? 'FINISHED' : 'SCHEDULED'));
  const [codacta, setCodacta] = useState(neutral?.codacta ?? game.codacta ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const hg = homeGoals === '' ? null : Number(homeGoals);
      const ag = awayGoals === '' ? null : Number(awayGoals);
      await saveNeutralMatch({
        id: neutral?.id ?? null,
        competitionId: Number(competitionId),
        jornada,
        homeName: game.home,
        awayName: game.away,
        homeCode: game.homeCode ?? null,
        awayCode: game.awayCode ?? null,
        date: date ? `${date}:00` : null,
        venue: venue.trim() || null,
        status: hg != null && ag != null ? 'FINISHED' : status,
        homeGoals: hg,
        awayGoals: ag,
        codacta: codacta.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!neutral?.id) { onClose(); return; }
    if (!window.confirm(`¿Borrar la corrección de ${game.home} - ${game.away}? Se volverá al dato de federación.`)) return;
    setSaving(true);
    try {
      await deleteNeutralMatch(neutral.id);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'No se pudo borrar');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-card-border dark:border-white/10 bg-card-bg dark:bg-black/30 px-2.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-re-dorado';
  return (
    <div className="mx-3 mb-3 rounded-2xl border border-re-dorado/30 bg-re-dorado/5 p-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-re-dorado">
        Corregir: {game.home} - {game.away}{neutral?.id ? ' (hay corrección guardada)' : ''}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Fecha y hora</span>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sede</span>
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Pabellón…" className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Goles local</span>
          <input type="number" min="0" max="30" value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Goles visitante</span>
          <input type="number" min="0" max="30" value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estado</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="SCHEDULED">Programado</option>
            <option value="FINISHED">Finalizado</option>
            <option value="POSTPONED">Aplazado</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-muted-foreground">CodActa</span>
          <input type="text" value={codacta} onChange={(e) => setCodacta(e.target.value)} placeholder="Ej. 78450" className={inputClass} />
        </label>
      </div>
      {error && <p className="mt-2 text-[11px] font-bold text-re-rojo">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-card-border px-4 py-2 text-[10px] font-black uppercase tracking-widest">
          Cancelar
        </button>
        {neutral?.id && (
          <button type="button" onClick={handleDelete} disabled={saving} className="ml-auto rounded-full border border-re-rojo/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-re-rojo disabled:opacity-50">
            Quitar corrección
          </button>
        )}
      </div>
    </div>
  );
}

/** Fila de partido de jornada con herramientas admin (actas + corrección neutra). */
function JornadaGameRow({ game, ourDbId, onOpenOurs, codacta, neutral, isAdmin, competitionId, jornada, onNeutralSaved, corrected }) {
  const [editing, setEditing] = useState(false);
  const [actaBusy, setActaBusy] = useState(null);
  const [actaError, setActaError] = useState('');

  const openActaHtml = async () => {
    if (!codacta) return;
    setActaBusy('html');
    setActaError('');
    try {
      const html = await fetchActaHtml(codacta, game.home, game.away);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (e) {
      setActaError(e.message || 'No se pudo abrir el acta');
    } finally {
      setActaBusy(null);
    }
  };

  const downloadActaPdf = async () => {
    if (!codacta) return;
    setActaBusy('pdf');
    setActaError('');
    try {
      const blob = await fetchActaPdf(codacta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta-J${jornada}-${codacta}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setActaError(e.message || 'No se pudo descargar el acta');
    } finally {
      setActaBusy(null);
    }
  };

  return (
    <div className={`rounded-2xl ${corrected ? 'border border-re-dorado/40 bg-re-dorado/5' : ''}`}>
      <RoundRow
        game={game}
        dbId={ourDbId}
        onClick={ourDbId != null && onOpenOurs ? onOpenOurs : undefined}
      />
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          {corrected && (
            <span className="text-[8px] font-black uppercase tracking-widest text-re-dorado">Corregido a mano</span>
          )}
          {codacta ? (
            <>
              <button
                type="button"
                onClick={openActaHtml}
                disabled={actaBusy != null}
                className="rounded-full border border-re-dorado/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white disabled:opacity-50"
              >
                {actaBusy === 'html' ? 'Abriendo…' : 'Ver acta'}
              </button>
              <button
                type="button"
                onClick={downloadActaPdf}
                disabled={actaBusy != null}
                className="rounded-full border border-re-dorado/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white disabled:opacity-50"
              >
                {actaBusy === 'pdf' ? 'Descargando…' : 'Acta PDF'}
              </button>
              <span className="text-[8px] font-bold text-muted-foreground">#{codacta}</span>
            </>
          ) : (
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Sin acta publicada</span>
          )}
          {!game.ours && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="ml-auto rounded-full border border-card-border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest hover:border-re-dorado/50 hover:text-re-dorado"
            >
              {editing ? 'Cerrar editor' : '✎ Corregir'}
            </button>
          )}
        </div>
      )}
      {actaError && <p className="px-3 pb-2 text-[11px] font-bold text-re-rojo">{actaError}</p>}
      {isAdmin && editing && !game.ours && (
        <NeutralEditor
          game={{ ...game, codacta: neutral?.codacta ?? codacta ?? null }}
          neutral={neutral}
          competitionId={competitionId}
          jornada={jornada}
          onSaved={onNeutralSaved}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

const selectClass = 'w-full rounded-lg border border-card-border dark:border-re-dorado/25 bg-card-bg dark:bg-black/30 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-re-dorado';

export default function CompetitionPage() {
  const navigate = useNavigate();
  const { isAdmin } = useApp();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [standings, setStandings] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState(null);
  const [roundIndex, setRoundIndex] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [ffmRounds, setFfmRounds] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundActas, setRoundActas] = useState(null);
  const [roundActasLoading, setRoundActasLoading] = useState(false);
  const [roundActasError, setRoundActasError] = useState('');
  const [neutralAll, setNeutralAll] = useState([]);

  const loadStandings = useCallback((competitionId, jornada) => {
    return getStandings(competitionId, jornada)
      .then((data) => Array.isArray(data) ? data : [])
      .catch(() => []);
  }, []);

  const loadMatches = useCallback((competitionId) => {
    return getMatchesByCompetition(competitionId)
      .then((data) => Array.isArray(data) ? data : [])
      .catch(() => []);
  }, []);

  const loadData = useCallback((competitionId, jornada) => {
    setLoading(true);
    setError('');
    Promise.all([
      loadStandings(competitionId, jornada),
      loadMatches(competitionId),
    ])
      .then(([standingsData, matchesData]) => {
        setStandings(standingsData);
        setAllMatches(matchesData);
      })
      .catch((err) => {
        setError(err.message || 'No se pudieron cargar los datos');
        setStandings([]);
        setAllMatches([]);
      })
      .finally(() => setLoading(false));
  }, [loadStandings, loadMatches]);

  const loadNeutrals = useCallback((competitionId) => {
    if (!competitionId) { setNeutralAll([]); return; }
    getNeutralMatches(competitionId)
      .then((data) => setNeutralAll(Array.isArray(data) ? data : []))
      .catch(() => setNeutralAll([]));
  }, []);

  useEffect(() => {
    loadNeutrals(selectedId);
  }, [selectedId, loadNeutrals]);

  // Al cambiar de competición o jornada se descarta el scrapeo en vivo (hay que pedirlo a mano)
  useEffect(() => {
    setRoundActas(null);
    setRoundActasError('');
  }, [selectedId, selectedJornada]);

  const handleScrapeRound = async () => {
    if (!selectedId || selectedJornada == null || roundActasLoading) return;
    setRoundActasLoading(true);
    setRoundActasError('');
    try {
      const data = await getRoundActas(selectedId, selectedJornada);
      setRoundActas(Array.isArray(data) ? data : []);
    } catch (e) {
      setRoundActasError(e.message || 'No se pudieron scrapear las actas');
      setRoundActas(null);
    } finally {
      setRoundActasLoading(false);
    }
  };

  /** Correcciones manuales de esta jornada, haya o no scrapeo en vivo. */
  const jornadaNeutrals = useMemo(
    () => neutralAll.filter((n) => n.jornada === selectedJornada),
    [neutralAll, selectedJornada],
  );

  const findNeutral = useCallback((game) => jornadaNeutrals.find((n) => sameGame(
    { homeCode: game.homeCode, awayCode: game.awayCode, home: game.home, away: game.away },
    { homeCode: n.homeCode, awayCode: n.awayCode, home: n.homeName, away: n.awayName },
  )), [jornadaNeutrals]);

  /** Aplica correcciones manuales sobre un partido FFM (fecha, sede, resultado). */
  const withNeutral = useCallback((game) => {
    const n = findNeutral(game);
    if (!n) return { game, corrected: false };
    const merged = { ...game };
    if (n.date) merged.date = n.date;
    if (n.venue) merged.venue = n.venue;
    if (n.homeGoals != null && n.awayGoals != null) {
      merged.homeGoals = n.homeGoals;
      merged.awayGoals = n.awayGoals;
      merged.ourGoals = n.homeGoals;
      merged.rivalGoals = n.awayGoals;
    }
    if (n.codacta) merged.codacta = n.codacta;
    return { game: merged, corrected: true, neutral: n };
  }, [findNeutral]);

  useEffect(() => {
    Promise.all([
      getSeasons({ size: 100, sortBy: 'name', direction: 'desc' }),
      getCompetitions({ size: 100, sortBy: 'name', direction: 'asc' }),
    ])
      .then(([seasonsData, competitionsData]) => {
        const seasonList = toPage(seasonsData).content;
        setSeasons(seasonList);
        const compList = toPage(competitionsData).content;
        setCompetitions(compList);

        const currentSeason = seasonList.find((s) => s.current) || seasonList[0];
        if (currentSeason) {
          setSelectedSeasonId(String(currentSeason.id));
          const seasonComps = compList.filter((c) => String(c.seasonId) === String(currentSeason.id));
          const preferred = seasonComps.find((c) => c.type === 'LIGA') || seasonComps[0];
          if (preferred) {
            setSelectedId(String(preferred.id));
            loadData(preferred.id, null);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || 'No se pudieron cargar los datos');
        setLoading(false);
      });
  }, [loadData]);

  const handleSelectSeason = (e) => {
    const seasonId = e.target.value;
    setSelectedSeasonId(seasonId);
    setSelectedId('');
    setSelectedJornada(null);
    setLoading(false);
    const seasonComps = competitions.filter((c) => String(c.seasonId) === seasonId);
    const preferred = seasonComps.find((c) => c.type === 'LIGA') || seasonComps[0];
    if (preferred) {
      setSelectedId(String(preferred.id));
      loadData(preferred.id, null);
    }
  };

  const handleSelectCompetition = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setSelectedJornada(null);
    loadData(id, null);
  };

  const standingsReq = useRef(0);

  const handleSelectJornada = (e) => {
    const val = e.target.value === 'all' ? null : Number(e.target.value);
    setSelectedJornada(val);
    if (!selectedId) return;
    const req = ++standingsReq.current;
    setLoading(true);
    getStandings(selectedId, val)
      .then((data) => {
        if (standingsReq.current !== req) return;
        setStandings(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        if (standingsReq.current !== req) return;
        setError(err.message || 'No se pudo cargar la clasificación');
      })
      .finally(() => {
        if (standingsReq.current === req) setLoading(false);
      });
  };

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const bases = [`/ffm/${selectedId}`, '/ffm'];
    (async () => {
      for (const base of bases) {
        try {
          const res = await fetch(`${base}/index.json`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && String(data.competitionId) === String(selectedId)) {
            setRoundIndex({ base, data });
            return;
          }
        } catch {
          /* probar siguiente */
        }
      }
      setRoundIndex(null);
    })();
  }, [selectedId]);

  useEffect(() => {
    if (
      selectedJornada == null ||
      !roundIndex ||
      !roundIndex.data.rounds?.includes(selectedJornada)
    ) {
      return;
    }
    const wanted = selectedJornada;
    const base = roundIndex.base;
    fetch(`${base}/jornada-${wanted}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRoundData({ jornada: wanted, games: Array.isArray(data) ? data : [] }))
      .catch(() => setRoundData(null));
  }, [selectedJornada, roundIndex]);

  const roundGames =
    roundData && roundData.jornada === selectedJornada && roundData.games.length > 0
      ? roundData.games
      : null;

  // Si hay datos FFM de esta competicion, la clasificacion se calcula con
  // TODOS los resultados (no solo los nuestros)
  const ffmAvailable = Boolean(
    roundIndex && String(roundIndex.data.competitionId) === String(selectedId),
  );

  useEffect(() => {
    if (!ffmAvailable) return;
    const { base, data } = roundIndex;
    Promise.all(
      (data.rounds || []).map((r) =>
        fetch(`${base}/jornada-${r}.json`)
          .then((res) => (res.ok ? res.json() : []))
          .then((games) => ({ round: r, games: Array.isArray(games) ? games : [] }))
          .catch(() => ({ round: r, games: [] })),
      ),
    )
      .then((all) => setFfmRounds(all))
      .catch(() => setFfmRounds([]));
  }, [ffmAvailable, roundIndex]);

  const tableLoading = ffmAvailable && !Array.isArray(ffmRounds);

  const displayStandings = useMemo(() => {
    if (ffmAvailable && Array.isArray(ffmRounds)) {
      // Mergear nuestro resultado de BD en la copia de ffmRounds para que la clasificación sea inmediata y completa
      let roundsForCalc = ffmRounds;
      if (allMatches && allMatches.length > 0) {
        const dbByJornada = new Map();
        for (const m of allMatches) if (m.jornada != null && m.status === 'FINISHED') dbByJornada.set(m.jornada, m);
        if (dbByJornada.size > 0) {
          const ourCode = roundIndex.data.ourCode;
          roundsForCalc = ffmRounds.map(({ round, games }) => ({
            round,
            games: games.map(g => {
              const isOurGame = String(g.homeCode) === String(ourCode) || String(g.awayCode) === String(ourCode);
              if (!isOurGame) return g;
              const db = dbByJornada.get(round);
              if (!db || db.status !== 'FINISHED' || db.ourGoals == null || db.rivalGoals == null) return g;
              const isHome = String(g.homeCode) === String(ourCode);
              return { ...g, homeGoals: isHome ? db.ourGoals : db.rivalGoals, awayGoals: isHome ? db.rivalGoals : db.ourGoals };
            })
          }));
        }
      }
      // Correcciones manuales de partidos neutros (también cuentan para la tabla)
      if (neutralAll.length > 0) {
        const byKey = new Map();
        for (const n of neutralAll) {
          if (n.status !== 'FINISHED' || n.homeGoals == null || n.awayGoals == null) continue;
          const key = n.homeCode && n.awayCode
            ? `${n.jornada}|${n.homeCode}|${n.awayCode}`
            : `${n.jornada}|${normTeam(n.homeName)}|${normTeam(n.awayName)}`;
          byKey.set(key, n);
        }
        if (byKey.size > 0) {
          roundsForCalc = roundsForCalc.map(({ round, games }) => ({
            round,
            games: games.map(g => {
              if (g.ours) return g;
              const keyCode = g.homeCode && g.awayCode ? `${round}|${g.homeCode}|${g.awayCode}` : null;
              const keyName = `${round}|${normTeam(g.home)}|${normTeam(g.away)}`;
              const n = (keyCode && byKey.get(keyCode)) || byKey.get(keyName);
              if (!n) return g;
              return { ...g, homeGoals: n.homeGoals, awayGoals: n.awayGoals };
            })
          }));
        }
      }
      return computeStandings(roundsForCalc, roundIndex.data.ourCode, selectedJornada);
    }
    return standings;
  }, [ffmAvailable, ffmRounds, roundIndex, selectedJornada, standings, allMatches, neutralAll]);
  const standingsSource = ffmAvailable ? 'FFM (nuestro resultado dinámico, resto auto lunes)' : 'nuestros partidos';

  const selected = competitions.find((c) => String(c.id) === String(selectedId));
  const filteredCompetitions = selectedSeasonId
    ? competitions.filter((c) => String(c.seasonId) === selectedSeasonId)
    : competitions;

  const availableJornadas = useMemo(() => {
    const set = new Set();
    for (const m of allMatches) if (m.jornada != null) set.add(m.jornada);
    if (ffmAvailable && roundIndex?.data.rounds?.length) {
      for (const r of roundIndex.data.rounds) set.add(r);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allMatches, ffmAvailable, roundIndex]);

  const isLiga = selected?.type === 'LIGA';

  const displayMatches = useMemo(() => {
    let list = allMatches;
    if (selectedJornada != null) {
      list = list.filter((m) => m.jornada === selectedJornada);
    }
    return [...list].sort((a, b) => {
      if (selectedJornada == null && a.jornada !== b.jornada) {
        return (a.jornada ?? 999) - (b.jornada ?? 999);
      }
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [allMatches, selectedJornada]);

  // Refrescar al volver de admin para que se vea el nuevo resultado/puntos
  useEffect(() => {
    const onFocus = () => { if (selectedId) loadData(selectedId, selectedJornada); };
    window.addEventListener('focus', onFocus);
    const onVis = () => { if (!document.hidden && selectedId) loadData(selectedId, selectedJornada); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); };
  }, [selectedId, selectedJornada, loadData]);

  return (
    <MotionConfig reducedMotion="user">
    <main className="mx-auto max-w-5xl space-y-5 p-4 text-foreground dark:text-white sm:p-6">
      <section className="gold-sweep relative overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="stadium-beam stadium-beam-left hidden dark:block" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.45),transparent_55%)]" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-re-rojo px-5 py-4 sm:px-6"
        >
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
            {selected ? `${selected.type === 'COPA' ? 'Copa' : 'Liga'} · ${selected.seasonName || ''}` : 'Competición'}
          </p>
          <h1 className="text-2xl font-black italic uppercase leading-none tracking-tighter text-white lg:text-3xl">
            Clasificación
          </h1>
        </motion.div>

        <div className="relative p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {seasons.length > 1 && (
              <div className="flex-1 sm:max-w-xs">
                <label htmlFor="season-select" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
                  Temporada
                </label>
                <select
                  id="season-select"
                  value={selectedSeasonId}
                  onChange={handleSelectSeason}
                  className={selectClass}
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.current ? ' (Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1">
              <label htmlFor="competition-select" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
                Competición
              </label>
              <select
                id="competition-select"
                value={selectedId}
                onChange={handleSelectCompetition}
                className={selectClass}
              >
                {filteredCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'COPA' ? 'Copa' : 'Liga'})
                  </option>
                ))}
              </select>
            </div>

            {isLiga && (
              <div className="flex-1 sm:max-w-xs">
                <label htmlFor="jornada-select" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
                  Jornada
                </label>
                <select
                  id="jornada-select"
                  value={selectedJornada ?? 'all'}
                  onChange={handleSelectJornada}
                  className={selectClass}
                >
                  <option value="all">Todas</option>
                  {availableJornadas.map((j) => (
                    <option key={j} value={j}>Jornada {j}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-6">
          <div className="h-96 rounded-3xl bg-card-bg animate-pulse" />
          <div className="h-64 rounded-3xl bg-card-bg animate-pulse" />
        </div>
      ) : error ? (
        <div className="py-16 bg-card-bg rounded-3xl border border-card-border text-center text-muted-foreground font-bold text-sm tracking-widest">
          {error}
        </div>
      ) : (
        <>
          {tableLoading && (
            <div className="h-96 rounded-3xl bg-card-bg animate-pulse" />
          )}

          {!tableLoading && displayStandings && displayStandings.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="overflow-hidden">
                <table className="w-full table-fixed border-separate border-spacing-0 text-[10px] text-foreground dark:text-white lg:text-[13px]">
                  <colgroup>
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-card-border dark:border-re-dorado/20 text-[7px] font-black uppercase tracking-[0.18em] text-re-dorado lg:text-[10px]">
                      <th className="px-0 py-1.5 text-center lg:py-2.5">#</th>
                      <th className="px-0 py-1.5 text-left lg:py-2.5">Equipo</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Puntos">Pts</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Partidos jugados">PJ</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Victorias">V</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Empates">E</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Derrotas">D</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Goles a favor">GF</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Goles en contra">GC</th>
                      <th className="px-0 py-1.5 text-center lg:py-2.5" title="Diferencia de goles">DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStandings.map((row, index) => (
                      <motion.tr
                        key={row.teamName}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index, 12) * 0.045, duration: 0.35 }}
                        className={`border-b border-card-border dark:border-white/5 last:border-0 ${
                          row.isUs ? 'bg-re-rojo/10 dark:bg-re-rojo/15' : 'hover:bg-muted/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <td className="px-0 py-1.5 text-center align-middle lg:py-2.5">
                          <motion.span
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: Math.min(index, 12) * 0.045 + 0.1, type: 'spring', stiffness: 320, damping: 16 }}
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[8px] font-black lg:h-7 lg:w-7 lg:text-[11px] ${
                              index === 0
                                ? 'bg-re-dorado text-re-azul-oscuro shadow-[0_0_8px_rgba(193,154,91,0.45)]'
                                : index < 3
                                  ? 'bg-re-dorado/80 text-re-azul-oscuro'
                                  : 'bg-muted/10 dark:bg-white/10 text-muted-foreground dark:text-white/55'
                            }`}
                          >
                            {index + 1}
                          </motion.span>
                        </td>

                        <td className="px-0 py-2 align-middle lg:py-3">
                          <div className="min-w-0 px-0">
                            <span
                              className={`block truncate text-[13px] font-black uppercase tracking-tight leading-[1.1] lg:text-[16px] ${
                                row.isUs ? 'underline decoration-re-rojo decoration-2 underline-offset-4' : ''
                              } text-foreground dark:text-white sm:text-[14px]`}
                            >
                              {row.teamName}
                            </span>

                            {row.form ? (
                              <div className="mt-0.5 flex gap-0.5">
                                {row.form.split('').map((c, i) => (
                                  <span
                                    key={i}
                                    className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] text-[7px] font-black lg:h-5 lg:w-5 lg:text-[9px] ${
                                      c === 'V'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : c === 'E'
                                          ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                                          : 'bg-re-rojo/15 text-re-rojo'
                                    }`}
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-muted-foreground">—</div>
                            )}
                          </div>
                        </td>

                        <td className="px-0 py-2 text-center align-middle text-[10px] font-black text-re-rojo lg:py-3 lg:text-[16px]">{row.points}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.played}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.won}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.drawn}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.lost}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.goalsFor}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">{row.goalsAgainst}</td>
                        <td className="px-0 py-2 text-center align-middle text-[9px] font-bold lg:py-3 lg:text-[14px]">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-card-border dark:border-white/10 px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/40">
                {selectedJornada != null
                  ? `Clasificación parcial hasta la jornada ${selectedJornada} · Victoria = 3 pts · Empate = 1 pt`
                  : 'Solo cuentan los partidos finalizados · Victoria = 3 pts · Empate = 1 pt'}
                {' · Fuente: ' + standingsSource}
              </p>
            </motion.section>
          )}

          {selectedJornada != null && (() => {
            // Mostrar siempre los resultados del grupo desde FFM (incluye al resto de equipos).
            // Fuente preferida: scrapeo en vivo de la jornada (trae CodActa); si no, JSON estático.
            // Se fusiona nuestro resultado de la BD más las correcciones manuales de neutros.
            const liveGames = (roundActas && roundActas.length > 0 ? roundActas : null)
              || (roundGames && roundGames.length > 0 ? roundGames : null);
            if (liveGames) {
              const ourMatch = allMatches.find((m) => m.jornada === selectedJornada);
              const ourCode = roundIndex?.data?.ourCode;
              const mergedGames = liveGames.map(g => {
                const isOurGame = ourCode != null ? String(g.homeCode) === String(ourCode) || String(g.awayCode) === String(ourCode) : Boolean(g.ours);
                let game = { ...g, ours: isOurGame || Boolean(g.ours) };
                if (isOurGame && ourMatch && ourMatch.status === 'FINISHED' && ourMatch.ourGoals != null && ourMatch.rivalGoals != null) {
                  const isHome = String(g.homeCode) === String(ourCode);
                  game = { ...game, ours: true, ourGoals: ourMatch.ourGoals, rivalGoals: ourMatch.rivalGoals, homeGoals: isHome ? ourMatch.ourGoals : ourMatch.rivalGoals, awayGoals: isHome ? ourMatch.rivalGoals : ourMatch.ourGoals };
                }
                const { game: withFix, corrected, neutral } = withNeutral(game);
                return { game: withFix, corrected, neutral, isOurGame };
              });
              const source = roundActas ? 'en vivo (scrapeo bajo demanda)' : 'FFM (caché estática)';
              return (
                <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] text-foreground dark:text-white shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                  <div className="px-4 sm:px-6 py-4 border-b border-card-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-black uppercase tracking-tight">Jornada {selectedJornada}</h2>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleScrapeRound}
                          disabled={roundActasLoading}
                          className="rounded-full bg-re-rojo px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        >
                          {roundActasLoading ? 'Scrapeando…' : roundActas ? 'Re-scrapear actas' : 'Scrapear actas'}
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Resultados del grupo · Fuente: {source}{ourMatch ? ' · nuestro resultado dinámico' : ''} · resto auto lunes</p>
                    {isAdmin && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-re-dorado/80 mt-1">Scrapeo educado: 3 peticiones con pausas · cada acta se pide de una en una</p>
                    )}
                    {roundActasLoading && (
                      <p className="mt-2 text-[11px] font-bold text-re-dorado">Leyendo la federación con pausas… tarda unos 10 segundos.</p>
                    )}
                    {roundActasError && (
                      <p className="mt-2 rounded-xl bg-re-rojo/10 border border-re-rojo/30 px-3 py-2 text-[11px] font-bold text-re-rojo">{roundActasError}</p>
                    )}
                  </div>
                  <div className="divide-y divide-card-border">
                    {mergedGames.map((entry, i) => {
                      const clickable = Boolean(entry.isOurGame && ourMatch);
                      return (
                        <JornadaGameRow
                          key={`${entry.game.homeCode}-${entry.game.awayCode}-${i}`}
                          game={entry.game}
                          ourDbId={clickable ? ourMatch.id : null}
                          onOpenOurs={clickable ? () => navigate(`/partidos/${ourMatch.id}`) : undefined}
                          codacta={entry.neutral?.codacta ?? entry.game.codacta ?? null}
                          neutral={entry.neutral ?? null}
                          corrected={entry.corrected}
                          isAdmin={isAdmin}
                          competitionId={selectedId}
                          jornada={selectedJornada}
                          onNeutralSaved={() => loadNeutrals(selectedId)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            }
            const jornadaMatches = displayMatches.filter(m => m.jornada === selectedJornada);
            if (jornadaMatches.length > 0) {
              return (
                <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] text-foreground dark:text-white shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                  <div className="px-4 sm:px-6 py-4 border-b border-card-border flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tight">Jornada {selectedJornada}</h2>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-re-dorado">Fuente: nuestros partidos</span>
                  </div>
                  <div className="divide-y divide-card-border">
                    {jornadaMatches.map(m => <MatchRow key={m.id} match={m} navigate={navigate} />)}
                  </div>
                </section>
              );
            }
            return null;
          })()}

          {displayMatches.length > 0 && selectedJornada == null && isLiga && availableJornadas.length > 0 && (() => {
            const grouped = new Map();
            for (const m of displayMatches) {
              const key = m.jornada ?? 0;
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key).push(m);
            }
            const jornadas = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

            return (
              <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] text-foreground dark:text-white shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                <div className="border-b border-card-border dark:border-re-dorado/20 px-4 py-4 sm:px-6">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Temporada</p>
                  <h2 className="text-lg font-black italic uppercase tracking-tight">Partidos por jornada</h2>
                </div>
                <div className="pb-3">
                  {jornadas.map(([jornada, jornadaMatches], groupIndex) => (
                    <motion.div
                      key={jornada}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: Math.min(groupIndex, 6) * 0.04 }}
                    >
                       <div className="flex items-center gap-3 px-4 pb-1 pt-4 sm:px-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-re-rojo">
                          Jornada {jornada}
                        </h3>
                        <span className="h-px flex-1 bg-card-border dark:bg-re-dorado/25" />
                      </div>
                      <div>
                        {jornadaMatches.map((match) => (
                          <MatchRow key={match.id} match={match} navigate={navigate} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })()}

          {displayMatches.length > 0 && selectedJornada == null && !(isLiga && availableJornadas.length > 0) && (
            <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] text-foreground dark:text-white shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="px-4 sm:px-6 py-4 border-b border-card-border">
                <h2 className="text-lg font-black uppercase tracking-tight">Partidos</h2>
              </div>
              <div className="divide-y divide-card-border">
                {displayMatches.map((match) => (
                  <MatchRow key={match.id} match={match} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          {!tableLoading && (!displayStandings || displayStandings.length === 0) && displayMatches.length === 0 && (
            <div className="py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-center text-muted-foreground font-bold text-sm tracking-widest">
              Todavía no hay datos en esta competición.
            </div>
          )}
        </>
      )}
    </main>
    </MotionConfig>
  );
}
