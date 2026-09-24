import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { POSITION_LABELS } from '../../constants/positions';

const FALLBACK_PHOTO = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png';
const POSITION_ORDER = ['PIVOT', 'ALA', 'CIERRE', 'PORTERO'];
const CYCLE_MS = 4800;

const LANE = {
  PIVOT: { y: 16, x0: 32, x1: 68 },
  ALA: { y: 40, x0: 14, x1: 86 },
  CIERRE: { y: 66, x0: 32, x1: 68 },
  PORTERO: { y: 82, x0: 40, x1: 60 },
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function spread(count, y, x0, x1) {
  if (count <= 0) return [];
  if (count === 1) return [{ x: (x0 + x1) / 2, y }];
  return Array.from({ length: count }, (_, index) => ({
    x: x0 + ((x1 - x0) * index) / (count - 1),
    y,
  }));
}

function formationSlots(grouped, line, narrow) {
  const slots = new Map();
  const place = (position, points) => {
    (grouped.get(position) || []).forEach((player, index) => {
      if (points[index]) slots.set(player.playerId, points[index]);
    });
  };

  if (line !== 'ALL') {
    const list = grouped.get(line) || [];
    if (narrow && list.length > 4) {
      const mid = Math.ceil(list.length / 2);
      spread(mid, 38, 12, 88).forEach((point, index) => slots.set(list[index].playerId, point));
      spread(list.length - mid, 62, 18, 82).forEach((point, index) => slots.set(list[mid + index].playerId, point));
    } else {
      spread(list.length, 48, 10, 90).forEach((point, index) => slots.set(list[index].playerId, point));
    }
    return slots;
  }

  for (const position of POSITION_ORDER) {
    const lane = LANE[position];
    const list = grouped.get(position) || [];
    if (narrow && position === 'ALA' && list.length > 4) {
      const mid = Math.ceil(list.length / 2);
      spread(mid, 32, 8, 92).forEach((point, index) => slots.set(list[index].playerId, point));
      spread(list.length - mid, 48, 14, 86).forEach((point, index) => slots.set(list[mid + index].playerId, point));
    } else {
      place(position, spread(list.length, lane.y, lane.x0, lane.x1));
    }
  }
  return slots;
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return narrow;
}

function PitchMarkings() {
  return (
    <svg className="pointer-events-none absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]" viewBox="0 0 300 180" fill="none" aria-hidden="true">
      <rect className="pitch-draw" x="1.5" y="1.5" width="297" height="177" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <line className="pitch-draw" x1="1.5" y1="90" x2="298.5" y2="90" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <circle className="pitch-draw" cx="150" cy="90" r="24" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <circle cx="150" cy="90" r="1.6" fill="rgba(255,255,255,0.7)" />
      <rect className="pitch-draw" x="110" y="1.5" width="80" height="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <rect className="pitch-draw" x="110" y="146.5" width="80" height="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  );
}

function StatMeter({ label, value, max, tone }) {
  const width = Math.max(value > 0 ? 8 : 0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[9px] font-black uppercase tracking-widest text-white/45">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="w-6 text-right text-[11px] font-black tabular-nums text-white">{value}</span>
    </div>
  );
}

function FeaturedPlayer({ player, seasonName, maxes, onOpen, paused, compact }) {
  if (!player) {
    return <div className={compact ? 'h-16' : 'min-h-40'} />;
  }
  const label = player.nickname || player.name;
  const legal = [player.name, player.surnames].filter(Boolean).join(' ');
  const showLegal = player.nickname && legal && legal !== label;
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-3">
        <img
          src={player.photoUrl || FALLBACK_PHOTO}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-re-dorado"
          onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-re-dorado">
            {POSITION_LABELS[player.position] || player.position}
          </p>
          <h2 className="truncate text-lg font-black italic uppercase leading-none text-white">{label}</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
            {player.appearances} PJ · {player.goals} goles
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpen(player)}
          className="shrink-0 rounded-full border border-re-dorado/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-re-dorado"
        >
          Ficha
        </button>
      </div>
    );
  }
  return (
    <div className="relative flex h-full flex-col justify-between px-4 py-4 sm:px-5 sm:py-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={player.playerId}
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <p className="pointer-events-none absolute -top-3 right-0 font-black italic leading-none tracking-tighter text-white/[0.07] text-7xl">
            {player.jerseyNumber}
          </p>
          <div>
            <div className="squad-ring-wrap">
              <img
                src={player.photoUrl || FALLBACK_PHOTO}
                alt=""
                className="relative z-[1] h-20 w-20 rounded-full object-cover"
                onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
              />
            </div>
            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-re-dorado">
              {POSITION_LABELS[player.position] || player.position}
            </p>
            <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-white">{label}</h2>
            {showLegal && <p className="mt-1 text-[11px] leading-snug text-white/55">{legal}</p>}
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Dorsal {player.jerseyNumber} · {seasonName || 'Temporada'}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <StatMeter label="PJ" value={player.appearances} max={maxes.appearances} tone="bg-white" />
            <StatMeter label="GOL" value={player.goals} max={maxes.goals} tone="bg-re-rojo" />
            <StatMeter label="AST" value={player.assists} max={maxes.assists} tone="bg-re-dorado" />
          </div>
          <button
            type="button"
            onClick={() => onOpen(player)}
            className="mt-4 rounded-full border border-re-dorado/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-re-dorado transition hover:bg-re-dorado hover:text-[#071018]"
          >
            Abrir ficha
          </button>
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 h-px overflow-hidden bg-white/10">
        <div key={`${player.playerId}-${paused ? 'p' : 'r'}`} className={`squad-cycle-bar h-full bg-re-dorado ${paused ? 'is-paused' : ''}`} />
      </div>
    </div>
  );
}

function statCaption(player, sortBy) {
  const value = player[sortBy] ?? 0;
  if (sortBy === 'goals') return `${value} gol${value === 1 ? '' : 'es'}`;
  if (sortBy === 'appearances') return `${value} PJ`;
  if (sortBy === 'assists') return `${value} asist.`;
  if (sortBy === 'yellowCards') return `${value} amar.`;
  if (sortBy === 'redCards') return `${value} roja${value === 1 ? '' : 's'}`;
  if (sortBy === 'cleanSheets') return `${value} porterías`;
  return '';
}

function PlayerToken({ player, active, dimmed, compact, sortBy, onOpen, onFocus, onBlur }) {
  const label = player.nickname || player.name;
  const caption = statCaption(player, sortBy);
  return (
    <button
      type="button"
      data-player={player.playerId}
      onClick={() => onOpen(player)}
      onMouseEnter={() => onFocus(player)}
      onFocus={() => onFocus(player)}
      onMouseLeave={onBlur}
      onBlur={onBlur}
      className={`player-float overflow-hidden text-center ${compact ? 'w-14' : 'w-[4.6rem]'} ${dimmed ? 'opacity-40' : 'opacity-100'}`}
      style={{ animationDelay: `${(player.jerseyNumber % 5) * 0.35}s` }}
      aria-label={`Ver ficha de ${label}`}
    >
      <span className="relative mx-auto block w-fit">
        <span className={`absolute -inset-2 rounded-full blur-md transition ${active ? 'bg-re-dorado/50' : 'bg-black/0'}`} />
        <img
          src={player.photoUrl || FALLBACK_PHOTO}
          alt=""
          className={`relative rounded-full object-cover shadow-lg ${compact ? 'h-10 w-10' : 'h-12 w-12'} ${active ? 'ring-2 ring-re-dorado' : 'ring-2 ring-white/75'}`}
          onError={(event) => { event.target.src = FALLBACK_PHOTO; }}
        />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-re-rojo text-[10px] font-black text-white shadow">
          {player.jerseyNumber}
        </span>
      </span>
      <span className="mt-1.5 block truncate text-[10px] font-black uppercase tracking-tight text-white">
        {label}
      </span>
      {caption && (
        <span className="block max-w-full truncate text-[9px] font-bold uppercase tracking-widest text-re-dorado-light/80">
          {caption}
        </span>
      )}
    </button>
  );
}

export default function StadiumSquad({ grouped, players, line, seasonName, sortBy, onOpen, modalOpen }) {
  const narrow = useNarrow();
  const pitchRef = useRef(null);
  const glowRef = useRef(null);
  const tokenRefs = useRef(new Map());
  const seen = useRef(new Set());
  const pausedRef = useRef(false);
  const [spotlightId, setSpotlightId] = useState(null);
  const [hovering, setHovering] = useState(false);

  const visible = useMemo(
    () => players.filter((player) => line === 'ALL' || player.position === line),
    [players, line],
  );

  const slots = useMemo(() => {
    const home = formationSlots(grouped, 'ALL', narrow);
    if (line === 'ALL') return home;
    const focused = formationSlots(grouped, line, narrow);
    const merged = new Map(home);
    for (const [id, point] of focused) merged.set(id, point);
    return merged;
  }, [grouped, line, narrow]);

  const maxes = useMemo(() => ({
    appearances: Math.max(1, ...players.map((player) => player.appearances)),
    goals: Math.max(1, ...players.map((player) => player.goals)),
    assists: Math.max(1, ...players.map((player) => player.assists)),
  }), [players]);

  useEffect(() => {
    if (!visible.length) return;
    setSpotlightId((current) => (
      visible.some((player) => player.playerId === current) ? current : visible[0].playerId
    ));
  }, [visible]);

  useEffect(() => {
    pausedRef.current = hovering || modalOpen;
    if (hovering || modalOpen || visible.length < 2) return undefined;
    if (prefersReducedMotion()) return undefined;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setSpotlightId((current) => {
        const index = visible.findIndex((player) => player.playerId === current);
        return visible[(index + 1) % visible.length].playerId;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [visible, hovering, modalOpen]);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    players.forEach((player, index) => {
      const node = tokenRefs.current.get(player.playerId);
      const slot = slots.get(player.playerId);
      if (!node || !slot) return;
      const hidden = line !== 'ALL' && player.position !== line;
      node.style.pointerEvents = hidden ? 'none' : 'auto';
      node.style.zIndex = player.playerId === spotlightId ? '30' : '10';
      const vars = {
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        xPercent: -50,
        yPercent: -50,
        opacity: hidden ? 0 : 1,
        scale: hidden ? 0.72 : 1,
        duration: reduce ? 0 : 0.85,
        ease: 'power3.inOut',
        overwrite: 'auto',
      };
      if (!seen.current.has(player.playerId)) {
        seen.current.add(player.playerId);
        gsap.fromTo(node, { opacity: 0, top: `${slot.y + 8}%`, left: `${slot.x}%`, xPercent: -50, yPercent: -50 }, { ...vars, delay: reduce ? 0 : index * 0.045 });
      } else {
        gsap.to(node, vars);
      }
    });
  }, [players, slots, line, spotlightId]);

  useEffect(() => {
    const pitch = pitchRef.current;
    const glow = glowRef.current;
    if (!pitch || !glow || prefersReducedMotion()) return undefined;
    const xTo = gsap.quickTo(glow, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(glow, 'y', { duration: 0.7, ease: 'power3.out' });
    const onMove = (event) => {
      const rect = pitch.getBoundingClientRect();
      xTo(event.clientX - rect.left);
      yTo(event.clientY - rect.top);
    };
    pitch.addEventListener('mousemove', onMove);
    return () => pitch.removeEventListener('mousemove', onMove);
  }, []);

  const spotlight = players.find((player) => player.playerId === spotlightId) || null;

  const focusPlayer = (player) => {
    setHovering(true);
    setSpotlightId(player.playerId);
  };

  return (
    <section className="relative overflow-hidden rounded-[1.7rem] bg-[#071018] shadow-card">
      <div className="stadium-beam stadium-beam-left" />
      <div className="stadium-beam stadium-beam-right" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.22),transparent_42%)]" />
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={index}
          className="stadium-dust"
          style={{ left: `${8 + index * 13}%`, animationDelay: `${index * 0.8}s`, animationDuration: `${6 + (index % 3)}s` }}
        />
      ))}

      <div className="relative grid md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 md:border-b-0 md:border-r">
          <FeaturedPlayer
            player={spotlight}
            seasonName={seasonName}
            maxes={maxes}
            onOpen={onOpen}
            paused={hovering || modalOpen}
            compact={narrow}
          />
        </aside>

        <div
          ref={pitchRef}
          className={`stadium-grass relative ${narrow ? '' : 'min-h-[520px]'}`}
          onMouseLeave={() => setHovering(false)}
        >
          <div
            ref={glowRef}
            className="pointer-events-none absolute left-0 top-0 z-[1] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-re-dorado/20 blur-3xl"
          />
          {!narrow && <PitchMarkings />}
          {!narrow && (
            <div className="squad-radar pointer-events-none absolute left-1/2 top-1/2 z-[1] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" />
          )}
          <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />

          {narrow && (
            <div className="relative z-10 space-y-4 px-2 py-4">
              {POSITION_ORDER.filter((position) => line === 'ALL' || position === line).map((position) => {
                const linePlayers = grouped.get(position) || [];
                if (!linePlayers.length) return null;
                return (
                  <div key={position} className="flex flex-wrap justify-center gap-x-2 gap-y-3">
                    {linePlayers.map((player) => (
                      <PlayerToken
                        key={player.playerId}
                        player={player}
                        compact
                        sortBy={sortBy}
                        active={player.playerId === spotlightId}
                        dimmed={hovering && player.playerId !== spotlightId}
                        onOpen={onOpen}
                        onFocus={focusPlayer}
                        onBlur={() => setHovering(false)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {!narrow && players.map((player) => (
            <div
              key={player.playerId}
              ref={(node) => {
                if (node) tokenRefs.current.set(player.playerId, node);
                else tokenRefs.current.delete(player.playerId);
              }}
              className="absolute z-10"
              style={{ left: '50%', top: '46%' }}
            >
              <PlayerToken
                player={player}
                sortBy={sortBy}
                active={player.playerId === spotlightId}
                dimmed={hovering && player.playerId !== spotlightId}
                onOpen={onOpen}
                onFocus={focusPlayer}
                onBlur={() => setHovering(false)}
              />
            </div>
          ))}

          <div className={`z-20 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-white/70 ${narrow ? 'relative px-3 pb-3' : 'absolute bottom-3 left-3 right-3'}`}>
            <span className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-re-rojo opacity-70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-re-rojo" />
              </span>
              Noche de partido
            </span>
            <span>{seasonName || 'Temporada'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
