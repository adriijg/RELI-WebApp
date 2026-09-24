import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCompetitions, getMatches, getStats, toPage } from '../services/api';
import { POSITION_LABELS } from '../constants/positions';

const FALLBACK_PHOTO = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png';

const STAT_ITEMS = [
  { key: 'appearances', label: 'PJ', hint: 'PJ', color: 'text-sky-500' },
  { key: 'goals', label: 'Goles', hint: 'GOL', color: 'text-re-rojo' },
  { key: 'assists', label: 'Asist.', hint: 'AST', color: 'text-emerald-500' },
  { key: 'yellowCards', label: 'TA', hint: 'TA', color: 'text-amber-400' },
  { key: 'redCards', label: 'TR', hint: 'TR', color: 'text-re-rojo' },
];

function formatMatchDate(date) {
  if (!date) return 'Sin fecha';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function rate(value, appearances) {
  if (!appearances) return '0.00';
  return (value / appearances).toFixed(2);
}

export default function PlayerDetailModal({ player, seasonId, seasonName, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState('');

  useEffect(() => {
    if (!player) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [player, onClose]);

  useEffect(() => {
    if (!player) return undefined;
    let cancelled = false;
    setLoadingMatches(true);
    setMatchesError('');
    setMatches([]);

    Promise.all([
      getStats({ playerId: player.playerId, size: 100, sortBy: 'id', direction: 'desc' }),
      getMatches({ size: 100, sortBy: 'date', direction: 'desc' }),
      getCompetitions({ size: 100 }),
    ])
      .then(([statsData, matchesData, competitionsData]) => {
        if (cancelled) return;
        const seasonCompetitionIds = new Set(
          toPage(competitionsData).content
            .filter((competition) => !seasonId || String(competition.seasonId) === String(seasonId))
            .map((competition) => competition.id)
        );
        const matchById = new Map();
        for (const match of toPage(matchesData).content) {
          if (!seasonId || seasonCompetitionIds.has(match.competitionId)) {
            matchById.set(match.id, match);
          }
        }
        const rows = toPage(statsData).content
          .filter((stat) => matchById.has(stat.matchId))
          .map((stat) => ({ ...stat, match: matchById.get(stat.matchId) }))
          .sort((a, b) => new Date(b.match?.date || 0) - new Date(a.match?.date || 0));
        setMatches(rows);
      })
      .catch(() => {
        if (!cancelled) setMatchesError('No se pudo cargar el detalle por partido.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [player, seasonId]);

  if (!player) return null;

  const positionLabel = POSITION_LABELS[player.position] || player.position;
  const displayName = player.nickname || player.name;
  const legalName = player.surnames ? `${player.name} ${player.surnames}` : player.name;
  const statItems = player.position === 'PORTERO'
    ? [...STAT_ITEMS, { key: 'cleanSheets', label: 'P0', hint: 'P0', color: 'text-emerald-400' }]
    : STAT_ITEMS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar ficha del jugador"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-modal-title"
        className="relative flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-background border border-card-border shadow-2xl"
      >
        <div className="relative shrink-0 overflow-hidden bg-re-azul-oscuro px-6 pt-6 pb-5 text-white">
          <div className="absolute -right-6 -top-8 text-8xl font-black italic text-white/5 select-none">
            {player.jerseyNumber}
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4 relative">
            <div className="relative shrink-0">
              <img
                src={player.photoUrl}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
              />
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-re-rojo text-white font-black text-sm flex items-center justify-center shadow-lg">
                {player.jerseyNumber}
              </span>
            </div>
            <div className="min-w-0 pr-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-re-dorado">{positionLabel}</p>
              <h2 id="player-modal-title" className="text-2xl font-black uppercase tracking-tight truncate">
                {displayName}
              </h2>
              {player.nickname && (
                <p className="mt-0.5 text-sm font-medium text-white/75 truncate">{legalName}</p>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/40 mb-2">Ficha</h3>
            <dl className="overflow-hidden rounded-2xl border border-card-border bg-card-bg">
              <InfoRow label="Nombre" value={legalName} />
              <div className="grid grid-cols-2 border-t border-card-border">
                <InfoRow label="Apodo" value={player.nickname || 'Sin apodo'} />
                <InfoRow label="Dorsal" value={player.jerseyNumber} className="border-l border-card-border" />
              </div>
              <div className="grid grid-cols-2 border-t border-card-border">
                <InfoRow label="Posición" value={positionLabel} />
                <InfoRow label="Temporada" value={seasonName || 'Actual'} className="border-l border-card-border" />
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/40 mb-2">Estadísticas</h3>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-card-border bg-card-bg">
              {statItems.map((item) => (
                <div key={item.key} className="border-card-border px-2 py-3 text-center [&:nth-child(3n+2)]:border-x [&:nth-child(n+4)]:border-t">
                  <p className={`text-xl font-black tabular-nums ${item.color}`}>{player[item.key] ?? 0}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-foreground/45">{item.label}</p>
                </div>
              ))}
              <div className="border-t border-card-border px-2 py-3 text-center">
                <p className="text-xl font-black tabular-nums text-foreground">{rate(player.goals, player.appearances)}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-foreground/45">Gol/PJ</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/40 mb-2">Por partido</h3>
            {loadingMatches && (
              <div className="h-20 rounded-2xl bg-card-bg animate-pulse border border-card-border" />
            )}
            {matchesError && (
              <p className="text-xs font-bold text-re-rojo">{matchesError}</p>
            )}
            {!loadingMatches && !matchesError && matches.length === 0 && (
              <p className="text-xs font-bold text-foreground/50">
                No hay registros partido a partido en esta temporada.
              </p>
            )}
            {!loadingMatches && matches.length > 0 && (
              <ul className="space-y-2 pb-1">
                {matches.map((stat) => (
                  <li key={stat.id}>
                    <Link
                      to={`/partidos/${stat.matchId}`}
                      className="card-depth rounded-2xl px-3 py-3 flex items-center gap-3 hover:border-re-rojo/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black uppercase tracking-tight truncate">
                          {stat.match?.home === false ? 'Visitante' : stat.match?.home ? 'Local' : 'Partido'} · {stat.matchRival}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {formatMatchDate(stat.match?.date)}
                          {stat.match?.jornada ? ` · J${stat.match.jornada}` : ''}
                          {stat.mvp ? ' · MVP' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-center">
                        <MiniStat label="G" value={stat.goals} color="text-re-rojo" />
                        <MiniStat label="A" value={stat.assists} color="text-emerald-500" />
                        <MiniStat label="TA" value={stat.yellowCards} color="text-amber-400" />
                        <MiniStat label="TR" value={stat.redCards} color="text-re-rojo" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={`px-3.5 py-2.5 ${className}`}>
      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-foreground/40">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <p className={`text-sm font-black ${color}`}>{value ?? 0}</p>
      <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{label}</p>
    </div>
  );
}
