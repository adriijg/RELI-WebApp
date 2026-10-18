import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader';
import StatCard from '../../components/admin/StatCard';
import {
  getEvents,
  getMatches,
  getPlayers,
  getSeasons,
  getCompetitions,
  getStats,
  getUsers,
  toPage,
} from '../../services/api';
import { getRecentAdminMatches } from '../../utils/adminRecentMatches';
import { getMatchOutcome, scoreTextClass } from '../../utils/matchResult';

const CARDS = [
  { key: 'matches', label: 'Partidos', to: '/admin/partidos', accent: 'red', fetcher: (p) => getMatches({ ...p, size: 1 }) },
  { key: 'events', label: 'Noticias', to: '/admin/noticias', accent: 'gold', fetcher: (p) => getEvents({ ...p, size: 1 }) },
  { key: 'players', label: 'Jugadores', to: '/admin/jugadores', accent: 'blue', fetcher: (p) => getPlayers({ ...p, size: 1 }) },
  { key: 'seasons', label: 'Temporadas', to: '/admin/temporadas', accent: 'green', fetcher: (p) => getSeasons({ ...p, size: 1 }) },
  { key: 'competitions', label: 'Competiciones', to: '/admin/competiciones', accent: 'purple', fetcher: (p) => getCompetitions({ ...p, size: 1 }) },
  { key: 'stats', label: 'Estadísticas', to: '/admin/estadisticas', accent: 'orange', fetcher: (p) => getStats({ ...p, size: 1 }) },
  { key: 'users', label: 'Usuarios', to: '/admin/usuarios', accent: 'slate', fetcher: (p) => getUsers({ ...p, size: 1 }) },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = {};
      await Promise.all(
        CARDS.map(async (card) => {
          try {
            const data = await card.fetcher({});
            results[card.key] = Array.isArray(data) ? data.length : toPage(data).totalElements;
          } catch {
            results[card.key] = '—';
          }
        }),
      );
      if (!cancelled) {
        setCounts(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMatches({ page: 0, size: 20, sortBy: 'date', direction: 'desc' })
      .then((data) => {
        if (cancelled) return;
        const matches = toPage(data).content;
        const byId = new Map(matches.map((match) => [String(match.id), match]));
        const managed = getRecentAdminMatches()
          .map((saved) => byId.get(String(saved.id)) || saved)
          .filter(Boolean);
        const managedIds = new Set(managed.map((match) => String(match.id)));
        const fallback = matches.filter((match) => !managedIds.has(String(match.id)));
        setRecentMatches([...managed, ...fallback].slice(0, 5));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del club y acceso rápido a la gestión de cada sección."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 mb-6">
        {CARDS.map((card) => (
          <Link key={card.key} to={card.to} className="block">
            <StatCard
              label={card.label}
              value={loading ? '…' : counts[card.key]}
              accent={card.accent}
              hint="Gestionar →"
            />
          </Link>
        ))}
      </div>

      {recentMatches.length > 0 && (
        <div className="card-depth rounded-3xl p-5 sm:p-6 mb-8">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-re-dorado mb-3">
            Partidos recientes — toca para editar
          </h3>
          <div className="space-y-2">
            {recentMatches.map((match) => {
              const hasScore = match.status === 'FINISHED' && match.ourGoals != null && match.rivalGoals != null;
              return (
                <Link
                  key={match.id}
                  to={`/admin/partidos?edit=${match.id}`}
                  className="flex items-center gap-3 bg-muted/5 border border-card-border rounded-2xl px-4 py-3.5 hover:bg-re-rojo/5 hover:border-re-rojo/20 transition-colors"
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0 ${
                      match.home ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  >
                    {match.home ? 'L' : 'V'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-black text-[15px] leading-none">{match.rival}</span>
                    <span className="block text-[11px] font-bold text-muted-foreground">
                      {match.date ? new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
                      {match.competitionName ? ` · ${match.competitionName}` : ''}
                    </span>
                  </span>
                  <span className={`shrink-0 font-black text-[15px] ${hasScore ? scoreTextClass(getMatchOutcome(match.ourGoals, match.rivalGoals)) : 'text-re-rojo'}`}>
                    {hasScore ? `${match.ourGoals}-${match.rivalGoals}` : '→'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-depth rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-black italic tracking-tighter uppercase mb-2">Acciones rápidas</h2>
        <p className="text-sm font-bold text-muted-foreground mb-6">
          Atajos para lo que más se toca del día a día.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/admin/partidos" label="Nuevo partido" />
          <QuickAction to="/admin/noticias" label="Publicar noticia" />
          <QuickAction to="/admin/estadisticas" label="Registrar stats" />
          <QuickAction to="/admin/jugadores" label="Gestionar plantilla" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-2 bg-re-rojo text-white font-black px-5 py-4 rounded-2xl text-[11px] tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
    >
      {label}
      <span>→</span>
    </Link>
  );
}
