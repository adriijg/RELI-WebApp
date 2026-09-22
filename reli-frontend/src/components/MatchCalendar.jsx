import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHomeMatches, isMatchLive } from '../utils/matches';
import { STATUS_LABELS } from '../constants/matchStatus';

function formatMonth(date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function CalendarMatch({ match, navigate }) {
  const date = new Date(match.date);
  const isHome = match.home !== false;
  const live = isMatchLive(match);

  return (
    <button
      type="button"
      onClick={() => navigate(`/partidos/${match.id}`)}
      className="w-full grid grid-cols-[52px_minmax(0,1fr)_auto] sm:grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-transparent hover:border-card-border hover:bg-muted/5 transition-colors text-left group"
    >
      <div className="text-center border-r border-card-border pr-3 sm:pr-5">
        <p className="text-2xl sm:text-3xl font-black leading-none text-re-rojo">{date.getDate()}</p>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
          {date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {formatTime(date)}
          </span>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            live ? 'bg-blue-500/10 text-blue-500' : 'bg-re-dorado/15 text-re-dorado'
          }`}>
            {live ? 'En vivo' : STATUS_LABELS[match.status] || match.status}
          </span>
        </div>
        <p className="font-black uppercase tracking-tight truncate group-hover:text-re-rojo transition-colors">
          {isHome ? 'Real Lisiados' : match.rival}
          <span className="text-foreground/30 mx-2">vs</span>
          {isHome ? match.rival : 'Real Lisiados'}
        </p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tight truncate mt-1">
          {isHome ? 'Local' : 'Visitante'}{match.location ? ` · ${match.location}` : ''}
        </p>
      </div>

      <span className="text-foreground/30 group-hover:text-re-rojo transition-colors text-lg" aria-hidden="true">→</span>
    </button>
  );
}

export default function MatchCalendar() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeMatches()
      .then((data) => setMatches(data.filter((match) => match.date && match.status !== 'FINISHED')))
      .catch((error) => console.error('Error cargando el calendario:', error))
      .finally(() => setLoading(false));
  }, []);

  const groupedMatches = matches.reduce((groups, match) => {
    const date = new Date(match.date);
    const month = formatMonth(date);
    if (!groups[month]) groups[month] = [];
    groups[month].push(match);
    return groups;
  }, {});

  return (
    <section className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-card-bg rounded-[32px] border border-card-border shadow-card">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-re-rojo mb-2">Agenda del equipo</p>
          <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none">Calendario</h2>
        </div>
        <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próximos partidos</span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-re-rojo font-black uppercase tracking-widest text-xs animate-pulse">Cargando calendario...</div>
      ) : Object.keys(groupedMatches).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground font-bold text-sm">No hay partidos programados.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([month, monthMatches]) => (
            <div key={month}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-card-border pb-2 mb-2">
                {month}
              </h3>
              <div className="divide-y divide-card-border/70">
                {monthMatches.map((match) => (
                  <CalendarMatch key={match.id} match={match} navigate={navigate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}