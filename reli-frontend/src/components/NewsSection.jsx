// src/components/NewsSection.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    getEvents({ page: 0, size: 6, sortBy: 'date', direction: 'desc' })
      .then((data) => setNews(toPage(data).content))
      .catch((err) => {
        console.error('Error cargando noticias:', err);
        setNews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [main, ...rest] = news;

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-card-border pb-4 gap-4 transition-all">
        <div className="max-w-xl">
          <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
            Últimas Noticias
          </h2>
          <p className="text-muted-foreground mt-3 font-medium text-xs lg:text-sm">
            Toda la actualidad del primer equipo y la cantera directamente desde el vestuario.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="min-h-[400px] rounded-3xl bg-card-bg animate-pulse" />
          <div className="flex flex-col gap-6">
            <div className="h-48 rounded-3xl bg-card-bg animate-pulse" />
            <div className="h-48 rounded-3xl bg-card-bg animate-pulse" />
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-center text-muted-foreground font-bold text-sm tracking-widest">
          Todavía no hay noticias publicadas.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link
            to={`/noticias/${main.id}`}
            className="relative group cursor-pointer overflow-hidden rounded-3xl bg-slate-900 aspect-[4/5] lg:aspect-auto card-depth min-h-[400px] block"
          >
            <img
              src={main.imageUrl || FALLBACK_IMAGE}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
              alt={main.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-re-azul-oscuro via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6 lg:p-10">
              <span className="bg-re-dorado text-re-azul-oscuro text-[9px] lg:text-[10px] font-black px-3 py-1 rounded mb-4 inline-block uppercase tracking-widest">
                {TYPE_BADGES[main.type] || main.type}
              </span>
              <h3 className="text-2xl lg:text-4xl font-black leading-tight mb-4 group-hover:text-re-dorado transition-colors uppercase">
                {main.title}
              </h3>
              {main.description && (
                <p className="text-gray-300 text-xs lg:text-sm line-clamp-2 max-w-md">{main.description}</p>
              )}
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-3">
                {main.date
                  ? new Date(main.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                  : ''}
              </p>
            </div>
          </Link>

          <div className="flex flex-col gap-6">
            {rest.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                to={`/noticias/${item.id}`}
                className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex h-auto lg:h-1/2 group cursor-pointer transition-all hover:bg-muted/5 shadow-lg"
              >
                <div className="w-1/3 overflow-hidden min-h-[150px] bg-re-azul-oscuro">
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
                  <p className="text-[9px] lg:text-xs text-muted-foreground mt-2 font-bold tracking-widest">
                    {item.date
                      ? `🕒 ${new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}`
                      : ''}
                    {item.location ? ` • ${item.location}` : ''}
                  </p>
                </div>
              </Link>
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
  );
}
