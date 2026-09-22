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

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    getEvents({ page, size: 9, sortBy: 'date', direction: 'desc' })
      .then((data) => {
        if (cancelled) return;
        const p = toPage(data);
        setNews(p.content);
        setTotalPages(p.totalPages);
      })
      .catch(() => {
        if (!cancelled) setNews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">
      {/* Cabecera */}
      <div className="mb-8 sm:mb-10 border-b border-card-border pb-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
          Noticias
        </h1>
        <p className="text-muted-foreground mt-3 font-medium text-xs sm:text-sm">
          Toda la actualidad del primer equipo y la cantera.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 sm:h-72 rounded-3xl bg-card-bg animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="py-20 bg-muted/5 rounded-3xl border border-dashed border-card-border text-center text-muted-foreground font-bold text-sm tracking-widest">
          Todavía no hay noticias publicadas.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/noticias/${item.id}`}
                className="group bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:bg-muted/5"
              >
                <div className="h-44 sm:h-48 overflow-hidden">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-re-rojo text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      {TYPE_BADGES[item.type] || item.type}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black leading-tight uppercase group-hover:text-re-rojo transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.location && (
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-2 tracking-widest uppercase">
                      📍 {item.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-muted/10 border border-card-border hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-widest px-3">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-muted/10 border border-card-border hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
