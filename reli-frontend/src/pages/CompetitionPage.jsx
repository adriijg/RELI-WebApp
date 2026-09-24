import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { getCompetitions, getSeasons, getStandings, getMatchesByCompetition, toPage } from '../services/api';
import { STATUS_LABELS } from '../constants/matchStatus';
import { computeStandings } from '../utils/standings';

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/partidos/${match.id}`)}
      className="mx-3 my-2 flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-re-dorado/50 sm:gap-3 sm:px-4"
    >
      <div className="w-14 shrink-0 border-r border-re-dorado/25 pr-2 text-center sm:w-20">
        <p className="text-[8px] font-black uppercase tracking-widest text-re-dorado sm:text-[10px]">{formatDate(match.date)}</p>
        {match.date && (
          <p className="text-[8px] font-bold text-white/45 sm:text-[10px]">{formatTime(match.date)}</p>
        )}
      </div>

      <div className="flex-1 min-w-0 text-right overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] font-black uppercase tracking-tight text-white sm:text-sm">
          {isHome ? 'Real Lisiados' : match.rival}
        </span>
      </div>

      <div className="shrink-0 text-center px-1 sm:px-2">
        {finished && match.ourGoals != null && match.rivalGoals != null ? (
          <span className="text-re-rojo font-black italic text-base sm:text-xl tracking-tighter">
            {isHome ? match.ourGoals : match.rivalGoals} - {isHome ? match.rivalGoals : match.ourGoals}
          </span>
        ) : live ? (
          <span className="text-blue-500 font-black text-[9px] sm:text-xs tracking-widest uppercase animate-pulse">EN VIVO</span>
        ) : (
          <span className="text-xs font-black italic text-re-rojo sm:text-sm">VS</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left overflow-hidden team-name-cell">
        <span className="team-name-ticker text-[10px] sm:text-sm font-black uppercase tracking-tight text-white">
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
    </motion.div>
  );
}

function RoundRow({ game }) {
  const finished = game.homeGoals != null && game.awayGoals != null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 rounded-2xl p-3 transition-colors sm:gap-3 sm:p-4 ${
        game.ours ? 'border border-re-rojo/30 bg-re-rojo/10' : ''
      }`}
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
          <span className="text-re-rojo font-black italic text-base sm:text-xl tracking-tighter">
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
    </motion.div>
  );
}

const selectClass = 'w-full rounded-xl border border-re-dorado/25 bg-black/30 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-re-dorado';

export default function CompetitionPage() {
  const navigate = useNavigate();
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
    if (ffmAvailable) {
      if (!Array.isArray(ffmRounds)) return null;
      return computeStandings(ffmRounds, roundIndex.data.ourCode, selectedJornada);
    }
    return standings;
  }, [ffmAvailable, ffmRounds, roundIndex, selectedJornada, standings]);

  const selected = competitions.find((c) => String(c.id) === String(selectedId));
  const filteredCompetitions = selectedSeasonId
    ? competitions.filter((c) => String(c.seasonId) === selectedSeasonId)
    : competitions;

  const availableJornadas = useMemo(() => {
    if (ffmAvailable && roundIndex?.data.rounds?.length) {
      return [...roundIndex.data.rounds].sort((a, b) => a - b);
    }
    const set = new Set();
    for (const m of allMatches) {
      if (m.jornada != null) set.add(m.jornada);
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

  return (
    <MotionConfig reducedMotion="user">
    <main className="mx-auto max-w-5xl space-y-8 p-4 text-white sm:p-6">
      <section className="gold-sweep relative overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="stadium-beam stadium-beam-left" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.45),transparent_55%)]" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-re-rojo px-5 py-6 sm:px-8"
        >
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
            {selected ? `${selected.type === 'COPA' ? 'Copa' : 'Liga'} · ${selected.seasonName || ''}` : 'Competición'}
          </p>
          <h1 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-white lg:text-4xl">
            Clasificación
          </h1>
        </motion.div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {seasons.length > 1 && (
              <div className="flex-1 sm:max-w-xs">
                <label htmlFor="season-select" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
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
              <label htmlFor="competition-select" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
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
                <label htmlFor="jornada-select" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-re-dorado">
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
              className="overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm text-white">
                  <thead>
                    <tr className="border-b border-re-dorado/20 text-[9px] font-black uppercase tracking-widest text-re-dorado lg:text-[10px]">
                      <th className="text-center px-3 py-4 w-12">#</th>
                      <th className="text-left px-3 py-4">Equipo</th>
                      <th className="text-center px-2 py-4" title="Partidos jugados">PJ</th>
                      <th className="text-center px-2 py-4" title="Ganados">G</th>
                      <th className="text-center px-2 py-4" title="Empatados">E</th>
                      <th className="text-center px-2 py-4" title="Perdidos">P</th>
                      <th className="text-center px-2 py-4 hidden sm:table-cell" title="Goles a favor">GF</th>
                      <th className="text-center px-2 py-4 hidden sm:table-cell" title="Goles en contra">GC</th>
                      <th className="text-center px-2 py-4" title="Diferencia de goles">DG</th>
                      <th className="text-center px-3 py-4" title="Puntos">Pts</th>
                      <th className="text-center px-3 py-4 hidden md:table-cell" title="Racha (últimos 5)">Racha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStandings.map((row, index) => (
                      <motion.tr
                        key={row.teamName}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index, 12) * 0.045, duration: 0.35 }}
                        className={`border-b border-white/5 last:border-0 ${
                          row.isUs ? 'bg-re-rojo/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="px-3 py-4 text-center">
                          <motion.span
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: Math.min(index, 12) * 0.045 + 0.1, type: 'spring', stiffness: 320, damping: 16 }}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                              index === 0
                                ? 'bg-re-dorado text-re-azul-oscuro shadow-[0_0_16px_rgba(193,154,91,0.55)]'
                                : index < 3
                                  ? 'bg-re-dorado/80 text-re-azul-oscuro'
                                  : 'bg-white/10 text-white/55'
                            }`}
                          >
                            {index + 1}
                          </motion.span>
                        </td>
                        <td className="px-3 py-4 font-black uppercase text-xs lg:text-sm truncate max-w-[180px]">
                          {row.teamName}
                          {row.isUs && (
                            <span className="ml-2 text-[8px] font-black uppercase tracking-widest bg-re-rojo text-white px-2 py-0.5 rounded-full align-middle">
                              Nosotros
                            </span>
                          )}
                        </td>
                        <td className="text-center px-2 py-4 font-bold">{row.played}</td>
                        <td className="text-center px-2 py-4 font-bold">{row.won}</td>
                        <td className="text-center px-2 py-4 font-bold">{row.drawn}</td>
                        <td className="text-center px-2 py-4 font-bold">{row.lost}</td>
                        <td className="text-center px-2 py-4 font-bold hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="text-center px-2 py-4 font-bold hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="text-center px-2 py-4 font-bold">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="text-center px-3 py-4 font-black text-re-rojo text-base">{row.points}</td>
                    <td className="text-center px-3 py-4 hidden md:table-cell">
                      {row.form ? (
                        <span className="inline-flex gap-1">
                          {row.form.split('').map((c, i) => (
                            <span
                              key={i}
                              className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-[10px] font-black ${
                                c === 'V'
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : c === 'E'
                                    ? 'bg-muted/15 text-muted-foreground'
                                    : 'bg-re-rojo/15 text-re-rojo'
                              }`}
                            >
                              {c}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-white/10 px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-white/40">
                {selectedJornada != null
                  ? `Clasificación parcial hasta la jornada ${selectedJornada} · Victoria = 3 pts · Empate = 1 pt`
                  : 'Solo cuentan los partidos finalizados · Victoria = 3 pts · Empate = 1 pt'}
                {ffmAvailable ? ' · Fuente: FFM' : ' · Fuente: nuestros partidos'}
              </p>
            </motion.section>
          )}

          {selectedJornada != null && roundGames && roundGames.length > 0 && (
            <section className="overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="px-4 sm:px-6 py-4 border-b border-card-border">
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Jornada {selectedJornada}
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Resultados del grupo · Fuente: FFM
                </p>
              </div>
              <div className="divide-y divide-card-border">
                {roundGames.map((game, i) => (
                  <RoundRow key={`${game.homeCode}-${game.awayCode}-${i}`} game={game} />
                ))}
              </div>
            </section>
          )}

          {displayMatches.length > 0 && selectedJornada == null && isLiga && availableJornadas.length > 0 && (() => {
            const grouped = new Map();
            for (const m of displayMatches) {
              const key = m.jornada ?? 0;
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key).push(m);
            }
            const jornadas = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

            return (
              <section className="overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                <div className="border-b border-re-dorado/20 px-4 py-4 sm:px-6">
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
                        <span className="h-px flex-1 bg-re-dorado/25" />
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
            <section className="overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
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
