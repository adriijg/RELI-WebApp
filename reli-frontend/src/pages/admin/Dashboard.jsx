import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader';
import StatCard from '../../components/admin/StatCard';
import { getEvents, getMatches, getPlayers, getSeasons, getCompetitions, getStats, getUsers, toPage } from '../../services/api';

const CARDS = [
  { key: 'matches', label: 'Partidos', to: '/admin/partidos', accent: 'red', fetcher: (p) => getMatches({ ...p, size: 1 }) },
  { key: 'events', label: 'Noticias', to: '/admin/noticias', accent: 'gold', fetcher: (p) => getEvents({ ...p, size: 1 }) },
  { key: 'players', label: 'Jugadores', to: '/admin/jugadores', accent: 'blue', fetcher: (p) => getPlayers({ ...p, size: 1 }) },
  { key: 'seasons', label: 'Temporadas', to: '/admin/temporadas', accent: 'green', fetcher: (p) => getSeasons({ ...p, size: 1 }) },
  { key: 'competitions', label: 'Competiciones', to: '/admin/competiciones', accent: 'purple', fetcher: (p) => getCompetitions({ ...p, size: 1 }) },
  { key: 'stats', label: 'Estadísticas', to: '/admin/estadisticas', accent: 'orange', fetcher: (p) => getStats({ ...p, size: 1 }) },
  { key: 'users', label: 'Usuarios', to: '/admin/usuarios', accent: 'slate', fetcher: () => getUsers() },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

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
        })
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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del club y acceso rápido a la gestión de cada sección."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
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

      <div className="card-depth rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-black italic tracking-tighter uppercase mb-2">Acciones rápidas</h2>
        <p className="text-sm font-bold text-muted-foreground mb-6">
          Atajos para lo que más se toca del día a día.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
