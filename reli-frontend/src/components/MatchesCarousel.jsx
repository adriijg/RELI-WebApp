// src/components/MatchesCarousel.jsx
import { useEffect, useState } from 'react';
import { getMatches } from '../services/api'; 
import logo from '../assets/reli-badge.png';

export default function MatchesCarousel() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches();
        const fetchedMatches = data.content || (Array.isArray(data) ? data : []);
        setMatches(fetchedMatches);
      } catch (error) {
        console.error("Error cargando partidos desde la API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-re-rojo font-black uppercase tracking-[0.2em] text-sm">Sincronizando Calendario...</div>;
  }

  return (
    <section className="py-12 px-6 lg:px-8 bg-card-bg rounded-[32px] border border-card-border shadow-card transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none">Próximos Partidos</h2>
        <div className="flex gap-2">
          <button className="p-3 bg-muted/10 rounded-full hover:bg-re-rojo hover:text-white transition-all active:scale-90 border border-card-border">←</button>
          <button className="p-3 bg-muted/10 rounded-full hover:bg-re-rojo hover:text-white transition-all active:scale-90 border border-card-border">→</button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-muted-foreground font-bold text-sm tracking-widest">
          No hay partidos programados en el horizonte.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className="p-6 lg:p-8 rounded-3xl border border-card-border transition-all hover:scale-105 hover:bg-muted/5 cursor-pointer group bg-card-bg shadow-lg"
            >
              <div className="flex justify-between items-start mb-8">
                <span className="text-[9px] lg:text-[10px] font-black px-2 py-1 bg-muted/10 rounded uppercase tracking-widest text-muted-foreground">
                  {match.competition?.name || "LIGA"}
                </span>
                <span className={`text-[9px] lg:text-[10px] font-black px-3 py-1 rounded-full uppercase bg-re-dorado text-re-azul-oscuro shadow-[0_5px_15px_-5px_rgba(193,154,91,0.5)]`}>
                  {match.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="text-center flex-1">
                  <div className="h-12 lg:h-16 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                    <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                  </div>
                  <p className="text-[10px] lg:text-[11px] font-black truncate uppercase tracking-tighter transition-colors group-hover:text-re-rojo">Real Lisiados</p>
                </div>

                <div className="text-re-rojo font-black italic text-2xl lg:text-3xl tracking-tighter">
                  {match.status === 'FINISHED' ? `${match.ourGoals} - ${match.rivalGoals}` : 'VS'}
                </div>

                <div className="text-center flex-1">
                  <div className="text-4xl lg:text-5xl mb-4 group-hover:-rotate-12 transition-transform drop-shadow-xl h-12 lg:h-16 flex items-center justify-center text-slate-400">⚽</div>
                  <p className="text-[10px] lg:text-[11px] font-black truncate uppercase tracking-tighter transition-colors group-hover:text-re-rojo">{match.rival}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-card-border text-center">
                <p className="text-re-rojo font-black text-xs lg:text-sm mb-1 uppercase tracking-widest">
                  {match.date ? new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase() : "FECHA TBD"}
                </p>
                <p className="text-[9px] lg:text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                  📍 {match.location || "Sede por confirmar"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}