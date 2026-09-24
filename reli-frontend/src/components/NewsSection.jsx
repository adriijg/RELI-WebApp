// src/components/NewsSection.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { getEvents, toPage } from '../services/api';

const TYPE_BADGES = {
  INFO: 'Noticia',
  TRAINING: 'Entrenamiento',
  SOCIAL: 'Club',
  MEETING: 'Reunión',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop';

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents({ page: 0, size: 3, sortBy: 'date', direction: 'desc' })
      .then((data) => setNews(toPage(data).content))
      .catch((err) => {
        console.error('Error cargando noticias:', err);
        setNews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [main, ...rest] = news;

  return (
    <MotionConfig reducedMotion="user">
    <section className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        className="mb-6 flex items-end justify-between gap-4 border-b border-card-border dark:border-re-dorado/25 pb-4"
      >
        <div className="max-w-xl">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Vestuario</p>
          <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-foreground dark:text-white lg:text-5xl">
            Últimas Noticias
          </h2>
          <p className="mt-3 text-xs font-medium text-muted-foreground lg:text-sm">
            Toda la actualidad del primer equipo y la cantera directamente desde el vestuario.
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="min-h-[480px] rounded-3xl bg-card-bg animate-pulse" />
          <div className="flex flex-col gap-6">
            <div className="flex-1 min-h-[180px] rounded-3xl bg-card-bg animate-pulse" />
            <div className="flex-1 min-h-[180px] rounded-3xl bg-card-bg animate-pulse" />
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-center text-muted-foreground font-bold text-sm tracking-widest">
          Todavía no hay noticias publicadas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="h-full">
          <Link
            to={`/noticias/${main.id}`}
            className="group relative flex h-full min-h-[480px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] shadow-card dark:shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
          >
            <img
              src={main.imageUrl || FALLBACK_IMAGE}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105"
              alt={main.title}
            />
            <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition duration-700 group-hover:left-[120%] group-hover:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071018]/90 via-[#071018]/20 to-transparent dark:from-[#071018] dark:via-[#071018]/20" />
            <div className="absolute bottom-0 p-6 lg:p-8">
              <span className="bg-re-dorado text-re-azul-oscuro text-[9px] lg:text-[10px] font-black px-3 py-1 rounded mb-4 inline-block uppercase tracking-widest">
                {TYPE_BADGES[main.type] || main.type}
              </span>
              <h3 className="text-2xl lg:text-4xl font-black leading-tight mb-4 text-white group-hover:text-re-dorado transition-colors uppercase">
                {main.title}
              </h3>
              {main.description && (
                <p className="text-white/80 text-xs lg:text-sm line-clamp-2 max-w-md">{main.description}</p>
              )}
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-3">
                {main.date
                  ? new Date(main.date).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : ''}
              </p>
            </div>
          </Link>
          </motion.div>

          <div className="flex flex-col gap-6 h-full">
            {rest.slice(0, 2).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 * index }}
                className="flex-1 flex"
              >
              <Link
                to={`/noticias/${item.id}`}
                className="group flex flex-1 cursor-pointer overflow-hidden rounded-3xl border border-card-border dark:border-re-dorado/25 bg-card-bg dark:bg-[#071018] text-foreground dark:text-white shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-re-dorado/40 dark:hover:border-re-dorado/60"
              >
                <div className="w-1/3 overflow-hidden min-h-[160px] bg-muted/10 dark:bg-re-azul-oscuro">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 lg:p-8 flex flex-col justify-center w-2/3">
                  <span className="text-re-rojo text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2">
                    {TYPE_BADGES[item.type] || item.type}
                  </span>
                  <h4 className="text-sm lg:text-xl font-black leading-tight uppercase transition-colors group-hover:text-re-rojo">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-[9px] font-bold tracking-widest text-muted-foreground dark:text-white/50 lg:text-xs">
                    {item.date
                      ? `🕒 ${new Date(item.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).toUpperCase()}`
                      : ''}
                    {item.location ? ` • ${item.location}` : ''}
                  </p>
                </div>
              </Link>
              </motion.div>
            ))}

            {rest.length === 0 && (
              <div className="bg-re-rojo rounded-3xl p-6 lg:p-10 flex flex-col justify-center relative overflow-hidden group shadow-xl">
                <span className="absolute -right-6 lg:-right-10 -bottom-6 lg:-bottom-10 text-8xl lg:text-[180px] opacity-10 font-black italic select-none text-white">
                  RELI
                </span>
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2 text-white/80">
                  Club
                </span>
                <h4 className="text-xl lg:text-3xl font-black text-white leading-none mb-4 uppercase">
                  MÁS NOTICIAS EN CAMINO
                </h4>
                <p className="text-white/80 text-xs font-bold">Vuelve pronto para conocer las novedades.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
    </MotionConfig>
  );
}
