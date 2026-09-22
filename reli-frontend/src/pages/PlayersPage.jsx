import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllPlayers, getPlayerSeasonStats, getSeasons, toPage } from '../services/api';
import { POSITION_LABELS } from '../constants/positions';

const POSITION_ORDER = ['PORTERO', 'CIERRE', 'ALA', 'PIVOT'];

const SORT_OPTIONS = [
  { value: 'jerseyNumber', label: 'Dorsal' },
  { value: 'goals', label: 'Goles' },
  { value: 'appearances', label: 'Partidos' },
  { value: 'assists', label: 'Asistencias' },
  { value: 'yellowCards', label: 'Amarillas' },
  { value: 'redCards', label: 'Rojas' },
  { value: 'cleanSheets', label: 'Porterías 0' },
];

const POSITION_ICONS = {
  PORTERO: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v4l3 3" />
    </svg>
  ),
  CIERRE: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  ALA: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  PIVOT: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  ),
};

const STAT_COLORS = {
  goals: 'text-re-rojo',
  assists: 'text-emerald-500',
  yellowCards: 'text-amber-400',
  redCards: 'text-re-rojo',
  appearances: 'text-sky-500',
};

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className={`text-base sm:text-lg font-black ${color}`}>{value ?? 0}</span>
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-foreground/50">{label}</span>
    </div>
  );
}

function PlayerCard({ player }) {
  const stats = player;

  return (
    <div className="card-depth rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300 group">
      <div className="flex items-center gap-4 mb-3">
        <div className="relative shrink-0">
          <img
            src={stats.photoUrl}
            alt={stats.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-card-border group-hover:border-re-rojo/50 transition-colors"
            onError={(e) => { e.target.src = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png'; }}
          />
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-re-azul-oscuro text-white font-black text-xs flex items-center justify-center shadow-lg">
            {stats.jerseyNumber}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">
            {stats.nickname || stats.name}
          </h3>
          {stats.nickname && (
            <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{stats.name}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-around border-t border-card-border pt-3 gap-2 sm:gap-3 flex-wrap">
        <StatBadge label="PJ" value={stats.appearances} color={STAT_COLORS.appearances} />
        <StatBadge label="Goles" value={stats.goals} color={STAT_COLORS.goals} />
        <StatBadge label="Asist." value={stats.assists} color={STAT_COLORS.assists} />
        <StatBadge label="TA" value={stats.yellowCards} color={STAT_COLORS.yellowCards} />
        <StatBadge label="TR" value={stats.redCards} color={STAT_COLORS.redCards} />
        {stats.position === 'PORTERO' && (
          <StatBadge label="P0" value={stats.cleanSheets} color="text-emerald-400" />
        )}
      </div>
    </div>
  );
}

function PositionSection({ position, players }) {
  const label = POSITION_LABELS[position] || position;
  const icon = POSITION_ICONS[position];

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-re-rojo/10 border border-re-rojo/20 flex items-center justify-center text-re-rojo">
          {icon}
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{label}</h2>
        <span className="text-xs font-black text-foreground/40 uppercase tracking-widest">{players.length}</span>
      </div>
      <div className="space-y-3">
        {players.map((p) => (
          <PlayerCard key={p.playerId} player={p} />
        ))}
      </div>
    </section>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('jerseyNumber');
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPlayerSeasonStats({ seasonId: selectedSeasonId });
      if (data && data.length > 0) {
        setPlayers(data);
      } else {
        const fallback = await getAllPlayers();
        setPlayers((Array.isArray(fallback) ? fallback : []).map((p) => ({
          playerId: p.id,
          name: p.name,
          nickname: p.nickname,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          photoUrl: p.photoUrl,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
          cleanSheets: 0,
        })));
      }
    } catch {
      try {
        const fallback = await getAllPlayers();
        setPlayers((Array.isArray(fallback) ? fallback : []).map((p) => ({
          playerId: p.id,
          name: p.name,
          nickname: p.nickname,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          photoUrl: p.photoUrl,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
          cleanSheets: 0,
        })));
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

  const grouped = useMemo(() => {
    const map = new Map();
    for (const pos of POSITION_ORDER) {
      map.set(pos, []);
    }
    for (const p of players) {
      const arr = map.get(p.position);
      if (arr) {
        arr.push(p);
      } else {
        map.set(p.position, [p]);
      }
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    }
    return map;
  }, [players, sortBy]);

  const totalGoals = useMemo(() => players.reduce((s, p) => s + p.goals, 0), [players]);
  const totalAssists = useMemo(() => players.reduce((s, p) => s + p.assists, 0), [players]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-32 rounded-3xl bg-card-bg animate-pulse" />
        <div className="h-48 rounded-3xl bg-card-bg animate-pulse" />
        <div className="h-48 rounded-3xl bg-card-bg animate-pulse" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <div className="card-depth rounded-3xl p-10 text-center">
          <p className="text-re-rojo font-black text-sm uppercase tracking-widest">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-re-rojo to-re-dorado">
          Plantilla
        </h1>
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="players-season" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
            Temporada
          </label>
          <select
            id="players-season"
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-card-bg border border-card-border rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40 cursor-pointer"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center gap-4 sm:gap-8 pt-2">
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-re-rojo">{totalGoals}</span>
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-foreground/40 mt-1">Goles totales</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-card-border" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-500">{totalAssists}</span>
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-foreground/40 mt-1">Asistencias totales</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-card-border" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{players.length}</span>
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-foreground/40 mt-1">Jugadores</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/40">
          <span><span className="text-sky-500">PJ</span> Partidos</span>
          <span><span className="text-re-rojo">Goles</span> Goles</span>
          <span><span className="text-emerald-500">Asist.</span> Asistencias</span>
          <span><span className="text-amber-400">TA</span> Amarillas</span>
          <span><span className="text-re-rojo">TR</span> Rojas</span>
          <span><span className="text-emerald-400">P0</span> Porterías 0</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card-bg border border-card-border rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {POSITION_ORDER.map((pos) => {
        const sectionPlayers = grouped.get(pos) || [];
        if (sectionPlayers.length === 0) return null;
        return <PositionSection key={pos} position={pos} players={sectionPlayers} />;
      })}
    </main>
  );
}
