// src/components/HeroMatch.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
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

  const kickoffLabel = isMatchLive(nextMatch)
    ? 'EN JUEGO'
    : nextMatch?.date
      ? `${new Date(nextMatch.date).toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase()}${nextMatch?.jornada != null ? ` · J${nextMatch.jornada}` : ''}`
      : 'FECHA TBD';

  return (
    <MotionConfig reducedMotion="user">
    <section className="gold-sweep relative w-full overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <div className="stadium-beam stadium-beam-left hidden dark:block" />
      <div className="stadium-beam stadium-beam-right hidden dark:block" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(226,29,44,0.12),transparent_46%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(226,29,44,0.34),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/[0.04] to-transparent dark:from-black/50" />

      <div className="relative px-4 py-6 text-foreground dark:text-white lg:px-10 lg:py-8">
        <div className="grid w-full items-center gap-x-3 gap-y-5 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [grid-template-areas:'left_vs_right''meta_meta_meta'] lg:grid-cols-[minmax(0,1fr)_18.5rem_minmax(0,1fr)] lg:gap-x-6 lg:[grid-template-areas:'left_meta_right']">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="[grid-area:left] flex min-w-0 flex-col items-center"
          >
            <TeamMark team={leftTeam} />
            <h3 className="mt-2 max-w-[9rem] text-center text-[11px] font-black uppercase leading-tight tracking-tighter sm:text-sm lg:max-w-[14rem] lg:text-xl">{leftTeam.name}</h3>
            <p className="mt-1 text-center text-[8px] font-black uppercase tracking-[0.16em] text-re-dorado lg:text-[10px]">
              {leftTeam.isUs ? '#SomosLisiados' : 'Rival'}
            </p>
          </motion.div>

          <div className="[grid-area:vs] flex h-[4.75rem] items-center justify-center sm:h-24 lg:hidden">
            <span className="select-none text-2xl font-black italic leading-none tracking-tighter text-re-rojo sm:text-3xl">VS</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="[grid-area:right] flex min-w-0 flex-col items-center"
          >
            <TeamMark team={rightTeam} />
            <h3 className="mt-2 max-w-[9rem] text-center text-[11px] font-black uppercase leading-tight tracking-tighter sm:text-sm lg:max-w-[14rem] lg:text-xl">{rightTeam.name}</h3>
            <p className="mt-1 text-center text-[8px] font-black uppercase tracking-[0.16em] text-re-dorado lg:text-[10px]">
              {rightTeam.isUs ? '#SomosLisiados' : 'Rival'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="[grid-area:meta] flex flex-col items-center"
          >
            <span className="mb-2 hidden select-none text-5xl font-black italic leading-none tracking-tighter text-re-rojo drop-shadow-[0_0_24px_rgba(226,29,44,0.45)] lg:block">VS</span>
            <div className="rounded-full bg-re-rojo px-4 py-1 text-white shadow-lg shadow-re-rojo/30">
              <p className="text-[10px] font-black uppercase tracking-widest lg:text-xs">{kickoffLabel}</p>
            </div>

            {isMatchLive(nextMatch) ? (
              <div className="mt-4 flex w-full max-w-[18.5rem] items-center gap-3 rounded-2xl border border-emerald-500/30 dark:border-blue-500/30 bg-emerald-500/10 dark:bg-blue-500/10 px-4 py-4 shadow-inner backdrop-blur-sm">
                <motion.span
                  animate={{ y: [0, -8, 0], rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-2xl lg:text-3xl shrink-0"
                  aria-hidden="true"
                >
                  ⚽
                </motion.span>
                <div className="text-left">
                  <p className="animate-pulse text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-blue-400 leading-none">Partido en curso</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 dark:text-white/60">Disputándose</p>
                </div>
                <span className="ml-auto relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-re-rojo opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-re-rojo" />
                </span>
              </div>
            ) : (
              <div className="mt-4 flex w-full max-w-[18.5rem] justify-center gap-2 rounded-2xl border border-card-border dark:border-re-dorado/25 bg-muted/10 dark:bg-black/35 px-3 py-3 shadow-inner backdrop-blur-sm lg:gap-4 lg:px-5">
                <CountUnit value={timeLeft.days} label="Días" tone="text-re-rojo" />
                <span className="pt-0.5 text-xl font-black leading-none text-foreground/20 dark:text-white/20 lg:text-3xl">:</span>
                <CountUnit value={timeLeft.hours} label="Hrs" />
                <CountUnit value={timeLeft.minutes} label="Min" />
                <CountUnit value={timeLeft.seconds} label="Seg" tone="text-re-dorado" tick />
              </div>
            )}

            <div className="mt-4 flex flex-col items-center text-center">
              <div className="mb-1 flex items-center gap-2 text-re-dorado">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] lg:text-[11px]">Sede oficial</span>
              </div>
              <p className="max-w-[16rem] text-sm font-black uppercase tracking-tight text-foreground/70 dark:text-white/80">{displayMatch.location || 'SEDE POR CONFIRMAR'}</p>
            </div>

            <button
              onClick={() => { if (nextMatch?.id) navigate(`/partidos/${nextMatch.id}`); }}
              className="mt-5 w-full max-w-xs rounded-full bg-re-rojo py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-re-rojo/30 transition hover:bg-re-rojo/90"
            >
              Más información del encuentro
            </button>
          </motion.div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}

function CountUnit({ value, label, tone = 'text-foreground dark:text-white', tick = false }) {
  return (
    <div className="min-w-[2.4rem] text-center">
      <motion.span
        key={tick ? value : 'static'}
        initial={tick ? { y: -8, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28 }}
        className={`block text-xl font-black leading-none lg:text-3xl ${tone}`}
      >
        {value}
      </motion.span>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-widest text-foreground/45 dark:text-white/45 lg:text-[9px]">{label}</span>
    </div>
  );
}

function TeamMark({ team }) {
  return (
    <div className={`squad-ring-wrap !h-[4.75rem] !w-[4.75rem] sm:!h-24 sm:!w-24 lg:!h-32 lg:!w-32 ${team.isUs ? '' : 'opacity-90'}`}>
      {team.isUs ? (
        <img src={logo} alt="Real Lisiados F.C." className="relative z-[1] h-[70%] w-[70%] object-contain" />
      ) : (
        <span className="relative z-[1] text-3xl lg:text-5xl">⚽</span>
      )}
    </div>
  );
}