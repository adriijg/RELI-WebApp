// src/components/HeroMatch.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import { fetchHomeMatches, pickFeaturedMatch, isMatchLive } from '../utils/matches';

export default function HeroMatch() {
  const navigate = useNavigate();
  const [nextMatch, setNextMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matches = await fetchHomeMatches();
        setNextMatch(pickFeaturedMatch(matches));
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
      <div className="min-h-[300px] lg:min-h-[450px] w-full flex items-center justify-center bg-card-bg rounded-[40px] animate-pulse">
        <span className="text-re-rojo font-black uppercase tracking-widest text-sm">Escaneando Próximo Encuentro...</span>
      </div>
    );
  }

  const displayMatch = nextMatch || {
    rival: "POR CONFIRMAR",
    home: true,
    location: "SEDE POR CONFIRMAR",
    date: null
  };

  // Si somos visitantes, el rival va a la izquierda y nosotros a la derecha
  const isHome = displayMatch.home !== false;
  const leftTeam = isHome
    ? { name: 'REAL LISIADOS', isUs: true }
    : { name: displayMatch.rival, isUs: false };
  const rightTeam = isHome
    ? { name: displayMatch.rival, isUs: false }
    : { name: 'REAL LISIADOS', isUs: true };

  return (
    <section className="relative min-h-0 lg:min-h-[450px] lg:h-[450px] w-full overflow-hidden rounded-[40px] bg-card-bg border border-card-border shadow-2xl transition-all">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-card-bg via-card-bg/80 to-transparent"></div>

      <div className="relative h-full max-w-6xl mx-auto flex flex-col items-center justify-center px-4 py-6 lg:px-6 lg:py-12 text-foreground">

        <div className="grid grid-cols-[1fr_auto_1fr] items-start w-full gap-x-2 gap-y-5 lg:flex lg:flex-nowrap lg:items-center lg:justify-between lg:gap-12">

          {/* Equipo Local (izquierda) */}
          <div className="order-1 lg:order-none flex flex-col items-center group min-w-0 lg:flex-1">
            <div className="bg-muted/5 rounded-2xl lg:rounded-[32px] border border-card-border mb-2 lg:mb-4 transition-all group-hover:scale-105 shadow-md w-[76px] h-[76px] sm:w-24 sm:h-24 lg:w-44 lg:h-44 flex items-center justify-center p-2 lg:p-4">
              {leftTeam.isUs ? (
                <img
                  src={logo}
                  alt="Real Lisiados F.C."
                  className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <span className="text-5xl lg:text-6xl drop-shadow-lg">⚽</span>
              )}
            </div>
            <h3 className="text-[11px] sm:text-sm lg:text-3xl font-black tracking-tighter text-center uppercase leading-tight lg:leading-none max-w-[110px] lg:max-w-none">{leftTeam.name}</h3>
            <p className="text-[8px] lg:text-[10px] font-black text-muted-foreground tracking-[0.12em] lg:tracking-[0.2em] mt-1 lg:mt-2 italic shadow-sm text-center">
              {leftTeam.isUs ? '#SOMOSLISIADOS' : 'Rival Confirmado'}
            </p>
          </div>

          <div className="order-2 lg:hidden flex items-center justify-center h-[76px] sm:h-24">
            <span className="text-re-rojo font-black italic text-2xl sm:text-3xl tracking-tighter leading-none select-none">VS</span>
          </div>

          {/* VS y CRONÓMETRO */}
          <div className="order-4 lg:order-none col-span-3 lg:col-span-auto flex flex-col items-center justify-center w-full lg:w-auto lg:min-w-[280px]">
            <div className="mb-3 lg:mb-4 flex flex-col items-center">
              <span className="hidden lg:block text-re-rojo font-black italic text-7xl tracking-tighter leading-none select-none drop-shadow-xl">VS</span>
              <div className="bg-re-rojo text-white px-4 lg:px-5 py-1 lg:py-1.5 rounded-full shadow-lg shadow-re-rojo/20 mt-2">
                <p className="font-black text-[10px] lg:text-xs tracking-widest uppercase">
                  {isMatchLive(nextMatch)
                    ? '⚡ EN JUEGO'
                    : nextMatch?.date
                    ? `${new Date(nextMatch.date).toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase()}${nextMatch?.jornada != null ? ` • J${nextMatch.jornada}` : ''}`
                    : "FECHA TBD"}
                </p>
              </div>
            </div>
            
            {isMatchLive(nextMatch) ? (
              <div className="flex justify-center py-5 px-8 bg-blue-500/10 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                <p className="font-black text-sm lg:text-base tracking-widest uppercase text-blue-500 animate-pulse">
                  Partido en juego
                </p>
              </div>
            ) : (
            <div className="flex justify-center gap-2 lg:gap-5 py-3 px-4 lg:py-5 lg:px-8 bg-muted/10 rounded-2xl border border-card-border backdrop-blur-sm shadow-inner w-full max-w-[290px] lg:max-w-none">
              <div className="text-center">
                <span className="text-xl lg:text-4xl font-black block leading-none text-re-rojo">{timeLeft.days}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Días</span>
              </div>
              <div className="text-center px-1">
                <span className="text-xl lg:text-4xl font-black block leading-none opacity-20">:</span>
              </div>
              <div className="text-center">
                <span className="text-xl lg:text-4xl font-black block leading-none">{timeLeft.hours}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Hrs</span>
              </div>
              <div className="text-center">
                <span className="text-xl lg:text-4xl font-black block leading-none">{timeLeft.minutes}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Min</span>
              </div>
              <div className="text-center">
                <span className="text-xl lg:text-4xl font-black block leading-none text-re-rojo/50">{timeLeft.seconds}</span>
                <span className="text-[8px] lg:text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Seg</span>
              </div>
            </div>
            )}

            <div className="mt-4 lg:mt-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-re-rojo mb-1 opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">Sede Oficial</span>
              </div>
              <p className="font-black text-sm lg:text-base tracking-tight text-foreground/80 uppercase max-w-[250px]">{displayMatch.location || 'SEDE POR CONFIRMAR'}</p>
            </div>
          </div>

          {/* Equipo Visitante (derecha) */}
          <div className="order-3 lg:order-none flex flex-col items-center group min-w-0 lg:flex-1">
            <div className="bg-muted/5 rounded-2xl lg:rounded-[32px] border border-card-border mb-2 lg:mb-4 transition-all group-hover:scale-105 shadow-md w-[76px] h-[76px] sm:w-24 sm:h-24 lg:w-44 lg:h-44 flex items-center justify-center p-2 lg:p-4">
              {rightTeam.isUs ? (
                <img
                  src={logo}
                  alt="Real Lisiados F.C."
                  className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <span className="text-5xl lg:text-6xl drop-shadow-lg">⚽</span>
              )}
            </div>
            <h3 className="text-[11px] sm:text-sm lg:text-3xl font-black tracking-tighter text-center uppercase leading-tight lg:leading-none max-w-[110px] lg:max-w-none">{rightTeam.name}</h3>
            <p className="text-[8px] lg:text-[10px] font-black text-muted-foreground tracking-[0.12em] lg:tracking-[0.2em] mt-1 lg:mt-2 uppercase shadow-sm text-center">
              {rightTeam.isUs ? '#SOMOSLISIADOS' : 'Rival Confirmado'}
            </p>
          </div>

        </div>

        <div className="mt-6 lg:mt-12 w-full max-w-xs scale-hover">
          <button
            onClick={() => { if (nextMatch?.id) navigate(`/partidos/${nextMatch.id}`); }}
            className="w-full py-3 lg:py-4 bg-re-rojo text-white font-black rounded-2xl shadow-xl shadow-re-rojo/20 hover:bg-re-rojo/90 transition-all text-xs lg:text-sm tracking-widest uppercase"
          >
            MÁS INFORMACIÓN DEL ENCUENTRO
          </button>
        </div>

      </div>
    </section>
  );
}