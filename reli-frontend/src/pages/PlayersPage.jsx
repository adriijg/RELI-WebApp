import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { getAllPlayers, getPlayerSeasonStats, getSeasons, toPage } from '../services/api';
import { jerseyForSeason } from '../constants/jerseys';
import { POSITION_LABELS } from '../constants/positions';
import PlayerDetailModal from '../components/PlayerDetailModal';
import StadiumSquad from '../components/squad/StadiumSquad';

const POSITION_ORDER = ['PIVOT', 'ALA', 'CIERRE', 'PORTERO'];

const SORT_OPTIONS = [
  { value: 'jerseyNumber', label: 'Dorsal' },
  { value: 'goals', label: 'Goles' },
  { value: 'appearances', label: 'Partidos' },
  { value: 'yellowCards', label: 'Amarillas' },
  { value: 'redCards', label: 'Rojas' },
  { value: 'cleanSheets', label: 'Porterías 0' },
];

function emptyPlayer(player, seasonId) {
  return {
    playerId: player.id,
    name: player.name,
    nickname: player.nickname,
    surnames: player.surnames,
    jerseyNumber: jerseyForSeason(player.id, seasonId, player.jerseyNumber),
    position: player.position,
    photoUrl: player.photoUrl,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    appearances: 0,
    cleanSheets: 0,
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('jerseyNumber');
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [line, setLine] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPlayerSeasonStats({ seasonId: selectedSeasonId });
      // Con roster por temporada, si la lista viene vacía es porque no hay asignados
      setPlayers((Array.isArray(data) ? data : []).map((player) => ({
        ...player,
        jerseyNumber: jerseyForSeason(player.playerId, selectedSeasonId, player.jerseyNumber),
      })));
    } catch {
      setError('No se pudieron cargar los jugadores');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    getSeasons({ size: 100, sortBy: 'name', direction: 'desc' })
      .then((data) => {
        const seasonList = toPage(data).content;
        setSeasons(seasonList);
        const currentSeason = seasonList.find((season) => season.current) || seasonList[0];
        if (currentSeason) setSelectedSeasonId(String(currentSeason.id));
      })
      .catch(() => setSeasons([]));
  }, []);

  useEffect(() => {
    if (selectedSeasonId) load();
  }, [load, selectedSeasonId]);

  // Refrescar al volver de /admin/estadísticas para que se vea la edición
  useEffect(() => {
    const onFocus = () => { if (selectedSeasonId) load(); };
    window.addEventListener('focus', onFocus);
    const onVis = () => { if (!document.hidden && selectedSeasonId) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load, selectedSeasonId]);

  useEffect(() => {
    setSelectedPlayer(null);
  }, [selectedSeasonId]);

  const closePlayer = useCallback(() => setSelectedPlayer(null), []);
  const selectedSeason = seasons.find((season) => String(season.id) === String(selectedSeasonId));

  const grouped = useMemo(() => {
    const map = new Map();
    for (const pos of POSITION_ORDER) map.set(pos, []);
    for (const player of players) {
      const bucket = map.get(player.position);
      if (bucket) bucket.push(player);
      else map.set(player.position, [player]);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    }
    return map;
  }, [players, sortBy]);

  const totalGoals = useMemo(() => players.reduce((sum, player) => sum + player.goals, 0), [players]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="h-10 animate-pulse rounded-2xl bg-card-bg" />
        <div className="mt-3 h-[28rem] animate-pulse rounded-3xl bg-card-bg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="card-depth rounded-2xl p-8 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-re-rojo">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-5xl space-y-3 p-4 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-re-rojo">Primer equipo</p>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gradient-re sm:text-3xl">
              Plantilla
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/45">
            {players.length} jugadores · {totalGoals} goles
          </p>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={line === 'ALL'} onClick={() => setLine('ALL')}>
              Todos
            </FilterChip>
            {POSITION_ORDER.map((pos) => (
              <FilterChip key={pos} active={line === pos} onClick={() => setLine(pos)}>
                {POSITION_LABELS[pos]}
                <span className="ml-1 opacity-60">{grouped.get(pos)?.length || 0}</span>
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/40">
              Temp.
              <select
                id="players-season"
                value={selectedSeasonId}
                onChange={(event) => setSelectedSeasonId(event.target.value)}
                className="cursor-pointer rounded-lg border border-card-border bg-card-bg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}{season.current ? ' · actual' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/40">
              Orden
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="cursor-pointer rounded-lg border border-card-border bg-card-bg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        </main>
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <StadiumSquad
            grouped={grouped}
            players={players}
            line={line}
            seasonName={selectedSeason?.name}
            sortBy={sortBy}
            onOpen={setSelectedPlayer}
            modalOpen={Boolean(selectedPlayer)}
          />
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-3 p-4 sm:p-6 pt-6">
        {(() => {
          const filtered = [...players]
            .filter((p) => line === 'ALL' || p.position === line)
            .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
          if (!filtered.length) return null;
          return (
            <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3 border-b border-card-border dark:border-re-dorado/20 px-4 py-4 sm:px-6">
                <h2 className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">Estadísticas · {selectedSeason?.name || 'Plantilla'}</h2>
                <span className="rounded-full bg-re-dorado/15 dark:bg-re-dorado/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-re-dorado">{filtered.length} jugadores</span>
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-muted/5 dark:bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/60">
                    <tr>
                      <th className="px-4 py-3 sm:px-6 w-[42%]">Jugador</th>
                      <th className="px-2 py-3 text-left">Pos</th>
                      <th className="px-1.5 py-3 text-center">PJ</th>
                      <th className="px-1.5 py-3 text-center text-re-rojo">G</th>
                      <th className="px-1.5 py-3 text-center">TA</th>
                      <th className="px-1.5 py-3 text-center">TR</th>
                      <th className="px-1.5 py-3 text-center">PO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border dark:divide-white/5 text-[13px]">
                    {filtered.map((p) => (
                      <tr key={p.playerId} onClick={() => setSelectedPlayer(p)} className="cursor-pointer transition hover:bg-muted/5 dark:hover:bg-white/[0.04]">
                        <td className="px-4 py-3.5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <img src={p.photoUrl || 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png'} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-card-border dark:ring-white/10" onError={(e) => { e.target.src = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png'; }} />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate text-[15px] font-black uppercase leading-none tracking-tight text-foreground dark:text-white">
                                {p.nickname || p.name}
                                <span className="rounded-md bg-foreground dark:bg-white px-1.5 py-0.5 text-[11px] font-black leading-none text-background dark:text-[#071018]">#{p.jerseyNumber}</span>
                              </p>
                              <p className="text-[11px] font-bold text-muted-foreground dark:text-white/60 truncate">{[p.name, p.surnames].filter(Boolean).join(' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-left"><span className="inline-flex rounded-full bg-muted/10 dark:bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground/70 dark:text-white/70">{POSITION_LABELS[p.position] || p.position}</span></td>
                        <td className="px-1.5 py-3.5 text-center font-bold tabular-nums text-foreground dark:text-white">{p.appearances}</td>
                        <td className="px-1.5 py-3.5 text-center font-black tabular-nums text-re-rojo">{p.goals}</td>
                        <td className="px-1.5 py-3.5 text-center"><span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-black tabular-nums text-amber-600 dark:text-amber-400">{p.yellowCards}</span></td>
                        <td className="px-1.5 py-3.5 text-center"><span className="rounded bg-re-rojo/10 px-1.5 py-0.5 font-black tabular-nums text-re-rojo">{p.redCards}</span></td>
                        <td className="px-1.5 py-3.5 text-center tabular-nums text-foreground dark:text-white">{p.position === 'PORTERO' ? p.cleanSheets : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-card-border dark:divide-white/5">
                {filtered.map((p) => (
                  <button key={p.playerId} type="button" onClick={() => setSelectedPlayer(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/5 dark:hover:bg-white/[0.04]">
                    <img src={p.photoUrl || 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png'} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-card-border dark:ring-white/10" onError={(e) => { e.target.src = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png'; }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-black uppercase leading-none tracking-tight text-foreground dark:text-white">{p.nickname || p.name}</p>
                        <span className="shrink-0 rounded bg-card-border dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-foreground/70 dark:text-white/70">#{p.jerseyNumber}</span>
                        <span className="truncate text-[10px] font-black uppercase tracking-widest text-foreground/50 dark:text-white/50">{POSITION_LABELS[p.position] || p.position}</span>
                      </div>
                      <p className="truncate text-[11px] font-bold text-muted-foreground dark:text-white/60">{[p.name, p.surnames].filter(Boolean).join(' ')}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full bg-muted/10 dark:bg-white/10 px-2 py-0.5 font-bold text-foreground dark:text-white">PJ <b className="font-black">{p.appearances}</b></span>
                        <span className="rounded-full bg-re-rojo px-2 py-0.5 font-black text-white">G {p.goals}</span>
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-black text-amber-700 dark:text-amber-400">TA {p.yellowCards}</span>
                        <span className="rounded-full bg-re-rojo/10 px-2 py-0.5 font-black text-re-rojo">TR {p.redCards}</span>
                        {p.position === 'PORTERO' && <span className="rounded-full bg-muted/10 dark:bg-white/10 px-2 py-0.5 text-foreground dark:text-white">PO {p.cleanSheets}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-muted-foreground dark:text-white/40">›</span>
                  </button>
                ))}
              </div>
              <p className="border-t border-card-border dark:border-white/5 bg-muted/5 dark:bg-white/[0.03] px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/50 sm:px-6">Toca para abrir la ficha completa</p>
            </section>
          );
        })()}

        <PlayerDetailModal
          player={selectedPlayer}
          seasonId={selectedSeasonId}
          seasonName={selectedSeason?.name}
          onClose={closePlayer}
        />
      </main>
    </MotionConfig>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
        active ? 'text-white' : 'border border-card-border bg-card-bg text-foreground/60 hover:text-foreground'
      }`}
    >
      {active && (
        <motion.span
          layoutId="squad-filter"
          className="absolute inset-0 bg-re-rojo"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
