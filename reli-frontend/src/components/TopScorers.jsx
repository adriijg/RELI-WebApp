// src/components/TopScorers.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { getPlayerSeasonStats, getSeasons, toPage } from '../services/api';

const FALLBACK_PHOTO = 'https://pjefzhrnoftaovlvnjaz.supabase.co/storage/v1/object/public/images/default-player.png';

export default function TopScorers() {
  const [top, setTop] = useState([]);
  const [seasonName, setSeasonName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const seasonsData = await getSeasons({ size: 100, sortBy: 'name', direction: 'desc' });
        const seasons = toPage(seasonsData).content;
        const current = seasons.find((s) => s.current) || seasons[0];
        if (!current) { setLoading(false); return; }
        setSeasonName(current.name);
        const stats = await getPlayerSeasonStats({ seasonId: current.id });
        const list = Array.isArray(stats) ? stats : [];
        const sorted = [...list].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0)).slice(0, 5);
        setTop(sorted);
      } catch (e) {
        console.error('Error cargando goleadores', e);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="rounded-[1.7rem] border border-card-border bg-card-bg p-6 shadow-card">
        <div className="h-6 w-40 animate-pulse rounded bg-muted/10" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted/10" />
          ))}
        </div>
      </section>
    );
  }

  if (!top.length) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section className="overflow-hidden rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-card-border dark:border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Goleadores</p>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground dark:text-white">Top 5 · {seasonName}</h2>
          </div>
          <Link to="/jugadores" className="hidden sm:inline-flex rounded-full border border-card-border dark:border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/70 dark:text-white/70 hover:border-re-dorado/40">Ver plantilla</Link>
        </div>
        <ol className="divide-y divide-card-border dark:divide-white/5">
          {top.map((p, index) => (
            <motion.li
              key={p.playerId}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-muted/5 dark:hover:bg-white/[0.04] transition"
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 ${index === 0 ? 'bg-re-dorado text-re-azul-oscuro' : index < 3 ? 'bg-re-dorado/80 text-re-azul-oscuro' : 'bg-muted/10 dark:bg-white/10 text-muted-foreground dark:text-white/60'}`}>{index + 1}</span>
              <img src={p.photoUrl || FALLBACK_PHOTO} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-card-border dark:ring-white/10 shrink-0" onError={(e) => { e.target.src = FALLBACK_PHOTO; }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black uppercase leading-none tracking-tight text-foreground dark:text-white">{p.nickname || p.name}</p>
                <p className="truncate text-[11px] font-bold text-muted-foreground dark:text-white/60">{[p.name, p.surnames].filter(Boolean).join(' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black leading-none text-re-rojo">{p.goals ?? 0}<span className="text-[10px] font-bold text-muted-foreground dark:text-white/50"> G</span></p>
                <p className="text-[10px] font-bold text-muted-foreground dark:text-white/50">{p.appearances ?? 0} PJ</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </MotionConfig>
  );
}
