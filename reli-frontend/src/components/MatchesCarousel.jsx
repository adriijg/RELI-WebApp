// src/components/MatchesCarousel.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import logo from '../assets/reli-badge.png';
import { STATUS_LABELS } from '../constants/matchStatus';
import { fetchHomeMatches, pickFeaturedMatch, selectCarouselMatches } from '../utils/matches';

const NAME_LIMIT = 14;

function TeamName({ name }) {
  const isLong = (name || '').length > NAME_LIMIT;
  if (!isLong) {
    return (
      <p className="text-[10px] lg:text-[11px] font-black truncate uppercase tracking-tighter transition-colors group-hover:text-re-rojo">
        {name}
      </p>
    );
  }
  return (
    <p className="w-full overflow-hidden text-left text-[10px] lg:text-[11px] font-black uppercase tracking-tighter transition-colors group-hover:text-re-rojo team-name-cell">
      <span className="team-name-ticker">{name}</span>
    </p>
  );
}

export default function MatchesCarousel() {
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(3);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef(null);
  const dragStartX = useRef(0);
  const suppressClick = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setVisible(mq.matches ? 3 : 1);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matches = await fetchHomeMatches();
        setAllMatches(matches);
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

  const featured = pickFeaturedMatch(allMatches);
  const upcoming = selectCarouselMatches(allMatches, featured);
  const GAP = 24;
  const maxSlide = Math.max(0, upcoming.length - visible);
  const index = Math.min(slide, maxSlide);
  const atStart = index === 0;
  const atEnd = index >= maxSlide;

  const arrowClass =
    'grid h-10 w-10 place-items-center rounded-full border border-re-dorado/40 text-re-dorado transition active:scale-90 ' +
    'hover:bg-re-rojo hover:text-white hover:border-re-rojo disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-re-dorado disabled:hover:border-re-dorado/40';

  const slideWidth = `calc((100% - ${(visible - 1) * GAP}px) / ${visible})`;

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse') return;
    dragStartX.current = event.clientX;
    suppressClick.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    const offset = event.clientX - dragStartX.current;
    if (Math.abs(offset) > 5) suppressClick.current = true;
    setDragOffset(offset);
  };

  const handlePointerUp = (event) => {
    if (!isDragging) return;
    const offset = event.clientX - dragStartX.current;
    const cardWidth = (carouselRef.current?.clientWidth || 320) / visible;
    const cardDistance = cardWidth + GAP;
    const threshold = Math.max(40, cardWidth * 0.2);
    const draggedCards = Math.max(1, Math.round(Math.abs(offset) / cardDistance));
    const nextSlide = offset < -threshold
      ? Math.min(maxSlide, index + draggedCards)
      : offset > threshold
        ? Math.max(0, index - draggedCards)
        : index;

    setSlide(nextSlide);
    setDragOffset(0);
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <MotionConfig reducedMotion="user">
    <section className="relative overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] px-5 py-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] lg:px-8">
      <div className="stadium-beam stadium-beam-left opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.22),transparent_42%)]" />
      <div className="relative mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Calendario</p>
          <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter lg:text-4xl">Próximos Partidos</h2>
        </div>
      <div className="hidden sm:flex gap-2">
          <button
            type="button"
            onClick={() => setSlide(Math.max(0, index - 1))}
            disabled={atStart}
            aria-label="Mover carrusel a la izquierda"
            className={arrowClass}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setSlide(Math.min(maxSlide, index + 1))}
            disabled={atEnd}
            aria-label="Mover carrusel a la derecha"
            className={arrowClass}
          >
            →
          </button>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-muted-foreground font-bold text-sm tracking-widest">
          No hay partidos programados en el horizonte.
        </div>
      ) : (
        <div
          ref={carouselRef}
          className="overflow-hidden p-4 -m-4 touch-pan-y select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className={`flex ${isDragging ? '' : 'transition-transform duration-500 ease-in-out motion-reduce:transition-none'}`}
            style={{
              gap: `${GAP}px`,
              transform: `translateX(calc(-${index} * (${slideWidth} + ${GAP}px) + ${dragOffset}px))`,
            }}
          >
            {upcoming.map((match) => {
              const matchIsHome = match.home !== false;
              const left = matchIsHome
                ? { name: 'Real Lisiados', isUs: true }
                : { name: match.rival, isUs: false };
              const right = matchIsHome
                ? { name: match.rival, isUs: false }
                : { name: 'Real Lisiados', isUs: true };
              const leftGoals = matchIsHome ? match.ourGoals : match.rivalGoals;
              const rightGoals = matchIsHome ? match.rivalGoals : match.ourGoals;
              return (
              <div key={match.id} style={{ flex: `0 0 ${slideWidth}` }}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => {
                    if (!suppressClick.current) navigate(`/partidos/${match.id}`);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/partidos/${match.id}`); }}
                  role="button"
                  tabIndex={0}
                  className="group h-full cursor-pointer rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-re-dorado/50 lg:p-7"
                >
                  <div className="flex justify-between items-start mb-8">
                    <span className="rounded bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/55 lg:text-[10px]">
                      {match.competitionName || "LIGA"}
                      {match.jornada != null ? ` • J${match.jornada}` : ""}
                    </span>
                    <span className={`text-[9px] lg:text-[10px] font-black px-3 py-1 rounded-full uppercase bg-re-dorado text-re-azul-oscuro shadow-[0_5px_15px_-5px_rgba(193,154,91,0.5)]`}>
                      {STATUS_LABELS[match.status] || match.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="text-center flex-1 min-w-0">
                      <div className="h-12 lg:h-16 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                        {left.isUs ? (
                          <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                        ) : (
                          <span className="text-4xl lg:text-5xl">⚽</span>
                        )}
                      </div>
                      <TeamName name={left.name} />
                    </div>

                    <div className="text-re-rojo font-black italic text-2xl lg:text-3xl tracking-tighter">
                      {match.status === 'FINISHED' && match.ourGoals != null && match.rivalGoals != null
                        ? `${leftGoals} - ${rightGoals}`
                        : 'VS'}
                    </div>

                    <div className="text-center flex-1 min-w-0">
                      <div className="text-4xl lg:text-5xl mb-4 group-hover:-rotate-12 transition-transform drop-shadow-xl h-12 lg:h-16 flex items-center justify-center text-slate-400">
                        {right.isUs ? (
                          <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                        ) : (
                          <span>⚽</span>
                        )}
                      </div>
                      <TeamName name={right.name} />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6 text-center">
                    <p className="text-re-rojo font-black text-xs lg:text-sm mb-1 uppercase tracking-widest">
                      {match.date ? new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase() : "FECHA TBD"}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-white/45 lg:text-[10px]">
                      📍 {match.location || "Sede por confirmar"}
                    </p>
                  </div>
                </motion.div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex sm:hidden justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setSlide(Math.max(0, index - 1))}
          disabled={atStart}
          aria-label="Mover carrusel a la izquierda"
          className={`${arrowClass} p-2 text-sm`}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setSlide(Math.min(maxSlide, index + 1))}
          disabled={atEnd}
          aria-label="Mover carrusel a la derecha"
          className={`${arrowClass} p-2 text-sm`}
        >
          →
        </button>
      </div>
    </section>
    </MotionConfig>
  );
}