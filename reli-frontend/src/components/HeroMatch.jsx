// src/components/HeroMatch.jsx
import { useState, useEffect } from 'react';
import { getMatches } from '../services/api';
import logo from '../assets/reli-badge.png';

export default function HeroMatch() {
  const [nextMatch, setNextMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches();
        const matches = data.content || (Array.isArray(data) ? data : []);

        const upcoming = matches
          .filter(m => m.status !== 'FINISHED')
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        setNextMatch(upcoming);
      } catch (error) {
        console.error("Error cargando el próximo partido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    if (!nextMatch || !nextMatch.date) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const matchTime = new Date(nextMatch.date).getTime();
      const difference = matchTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextMatch]);

  if (loading) {
    return (
      <div className="min-h-[450px] w-full flex items-center justify-center bg-card-bg rounded-[40px] animate-pulse">
        <span className="text-re-rojo font-black uppercase tracking-widest text-sm">Escaneando Próximo Encuentro...</span>
      </div>
    );
  }

  const displayMatch = nextMatch || {
    rival: "POR CONFIRMAR",
    location: "SEDE POR CONFIRMAR",
    date: null
  };

  return (
    <section className="relative min-h-[450px] lg:h-[450px] w-full overflow-hidden rounded-[40px] bg-card-bg border border-card-border shadow-2xl transition-all">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-card-bg via-card-bg/80 to-transparent"></div>

      <div className="relative h-full max-w-6xl mx-auto flex flex-col items-center justify-center px-6 py-12 text-foreground">
        
        <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-8 lg:gap-12">
          
          {/* Equipo Local */}
          <div className="flex flex-col items-center group flex-1">
            <div className="bg-muted/5 p-4 lg:p-6 rounded-[32px] border border-card-border mb-4 transition-all group-hover:scale-105 shadow-md relative">
              <div className="absolute inset-0 bg-re-rojo/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src={logo} 
                alt="Real Lisiados F.C." 
                className="h-20 lg:h-32 w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] relative z-10" 
              />
            </div>
            <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-center uppercase leading-none">REAL LISIADOS</h3>
            <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mt-2 italic shadow-sm">#SOMOSLISIADOS</p>
          </div>

          {/* VS y CRONÓMETRO */}
          <div className="flex flex-col items-center justify-center min-w-[280px]">
            <div className="mb-4 flex flex-col items-center">
              <span className="text-re-rojo font-black italic text-5xl lg:text-7xl tracking-tighter leading-none select-none drop-shadow-xl">VS</span>
              <div className="bg-re-rojo text-white px-5 py-1.5 rounded-full shadow-lg shadow-re-rojo/20 mt-2">
                <p className="font-black text-[10px] lg:text-xs tracking-widest uppercase">
                  {nextMatch?.date ? new Date(nextMatch.date).toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase() : "FECHA TBD"}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 lg:gap-5 py-5 px-8 bg-muted/10 rounded-2xl border border-card-border backdrop-blur-sm shadow-inner">
              <div className="text-center">
                <span className="text-2xl lg:text-4xl font-black block leading-none text-re-rojo">{timeLeft.days}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Días</span>
              </div>
              <div className="text-center px-1">
                <span className="text-2xl lg:text-4xl font-black block leading-none opacity-20">:</span>
              </div>
              <div className="text-center">
                <span className="text-2xl lg:text-4xl font-black block leading-none">{timeLeft.hours}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Hrs</span>
              </div>
              <div className="text-center">
                <span className="text-2xl lg:text-4xl font-black block leading-none">{timeLeft.minutes}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Min</span>
              </div>
              <div className="text-center">
                <span className="text-2xl lg:text-4xl font-black block leading-none text-re-rojo/50">{timeLeft.seconds}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Seg</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-re-rojo mb-1 opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">Sede Oficial</span>
              </div>
              <p className="font-black text-sm lg:text-base tracking-tight text-foreground/80 uppercase max-w-[250px]">{displayMatch.location}</p>
            </div>
          </div>

          {/* Equipo Visitante */}
          <div className="flex flex-col items-center group flex-1">
            <div className="bg-muted/5 p-6 lg:p-8 rounded-[32px] border border-card-border mb-4 transition-all group-hover:scale-105 shadow-md">
              <span className="text-5xl lg:text-6xl drop-shadow-lg">⚽</span>
            </div>
            <h3 className="text-xl lg:text-3xl font-black tracking-tighter text-center uppercase leading-none">{displayMatch.rival}</h3>
            <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mt-2 uppercase shadow-sm">Rival Confirmado</p>
          </div>

        </div>

        <div className="mt-12 w-full max-w-xs scale-hover">
          <button className="w-full py-4 bg-re-rojo text-white font-black rounded-2xl shadow-xl shadow-re-rojo/20 hover:bg-re-rojo/90 transition-all text-xs lg:text-sm tracking-widest uppercase">
            MÁS INFORMACIÓN DEL ENCUENTRO
          </button>
        </div>

      </div>
    </section>
  );
}