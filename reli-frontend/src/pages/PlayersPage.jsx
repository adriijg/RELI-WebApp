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
  { value: 'assists', label: 'Asistencias' },
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
      if (data && data.length > 0) {
        setPlayers(data.map((player) => ({
          ...player,
          jerseyNumber: jerseyForSeason(player.playerId, selectedSeasonId, player.jerseyNumber),
        })));
      } else {
        const fallback = await getAllPlayers();
        setPlayers((Array.isArray(fallback) ? fallback : []).map((player) => emptyPlayer(player, selectedSeasonId)));
      }
    } catch {
      try {
        const fallback = await getAllPlayers();
        setPlayers((Array.isArray(fallback) ? fallback : []).map((player) => emptyPlayer(player, selectedSeasonId)));
      } catch {
        setError('No se pudieron cargar los jugadores');
      }
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

        <StadiumSquad
          grouped={grouped}
          players={players}
          line={line}
          seasonName={selectedSeason?.name}
          sortBy={sortBy}
          onOpen={setSelectedPlayer}
          modalOpen={Boolean(selectedPlayer)}
        />

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
