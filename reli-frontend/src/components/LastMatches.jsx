import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHomeMatches } from '../utils/matches';
import logo from '../assets/reli-badge.png';

export default function LastMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  const loadMatches = useCallback(async () => {
    try {
      const list = await fetchHomeMatches();
      const finished = list
        .filter(m => m.status === 'FINISHED' && m.ourGoals != null && m.rivalGoals != null)
        .sort((a,b) => new Date(a.date) - new Date(b.date))
        .slice(-5);
      setMatches(finished);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    loadMatches().finally(() => setLoading(false));
    pollingRef.current = setInterval(loadMatches, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadMatches]);

  if (loading) return <div className="h-32 rounded-3xl bg-card-bg animate-pulse" />;
  if (matches.length === 0) return null;

  const last = matches[matches.length - 1];
  const rest = matches.slice(0, -1);

  return (
    <section className="rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Histórico reciente</p>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Últimos 5 partidos</h2>
        </div>
        <button onClick={() => navigate('/competicion')} className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-re-rojo hover:underline">Ver clasificación →</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1">
        {last && (
          <button onClick={() => navigate(`/partidos/${last.id}`)} className="snap-start shrink-0 w-[300px] sm:w-[340px] h-[168px] flex flex-col justify-between bg-gradient-to-br from-re-rojo/10 via-card-bg to-card-bg dark:from-re-rojo/20 dark:to-black/30 border-2 border-re-dorado/40 rounded-3xl p-5 text-left shadow-lg order-first sm:order-last">
            {(() => {
              const d = last.date ? new Date(last.date) : null;
              const dateFull = d ? d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha TBD';
              const our = last.ourGoals; const rival = last.rivalGoals; const won = our > rival; const isHome = last.home !== false;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-re-rojo text-white">Último</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${won ? 'bg-emerald-500/15 text-emerald-600' : 'bg-re-rojo/10 text-re-rojo'}`}>{won ? 'Victoria' : rival > our ? 'Derrota' : 'Empate'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0"><img src={logo} alt="" className="w-8 h-8 object-contain shrink-0" /><span className="truncate font-black text-sm uppercase leading-none">{last.rival}</span></span>
                    <span className={`shrink-0 font-black italic text-3xl tracking-tighter ${won ? 'text-emerald-500' : 'text-re-rojo'}`}>{our} - {rival}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground truncate">📍 {last.location || 'Sede por confirmar'} · {isHome ? 'Local' : 'Visitante'} {last.jornada ? `· J${last.jornada}` : ''}</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-re-dorado">{dateFull}</p>
                  </div>
                </>
              );
            })()}
          </button>
        )}
        {rest.map(m => {
          const d = m.date ? new Date(m.date) : null;
          const dateShort = d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
          const our = m.ourGoals; const rival = m.rivalGoals;
          return (
            <button key={m.id} onClick={() => navigate(`/partidos/${m.id}`)} className="snap-start shrink-0 w-[148px] sm:w-[168px] h-[168px] flex flex-col justify-between bg-muted/5 dark:bg-black/20 border border-card-border dark:border-white/10 rounded-3xl p-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{dateShort}</span>
              <span className={`font-black italic text-3xl tracking-tighter leading-none ${our > rival ? 'text-emerald-500' : our < rival ? 'text-re-rojo' : 'text-muted-foreground'}`}>{our} - {rival}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{m.rival}</span>
            </button>
          );
        })}
      </div>

      <button onClick={() => navigate('/competicion')} className="sm:hidden mt-3 w-full rounded-2xl border border-card-border py-3 text-[11px] font-black uppercase tracking-widest">Ver clasificación →</button>
    </section>
  );
}
