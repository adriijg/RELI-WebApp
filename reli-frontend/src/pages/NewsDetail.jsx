import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getEvent, getEvents, toPage } from '../services/api';

const TYPE_BADGES = {
  INFO: 'Noticia',
  TRAINING: 'Entrenamiento',
  SOCIAL: 'Club',
  MEETING: 'Reunión',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEvent(id);
      setNews(data);
      try {
        const latest = await getEvents({ page: 0, size: 4, sortBy: 'date', direction: 'desc' });
        setRelated(toPage(latest).content.filter((item) => String(item.id) !== String(id)).slice(0, 3));
      } catch {
        setRelated([]);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la noticia');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="h-72 lg:h-96 rounded-[40px] bg-card-bg animate-pulse" />
        <div className="h-10 w-2/3 rounded-2xl bg-card-bg animate-pulse" />
        <div className="h-40 rounded-3xl bg-card-bg animate-pulse" />
      </main>
    );
  }

  if (error || !news) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="card-depth rounded-3xl p-10 text-center">
          <p className="text-5xl font-black italic text-re-rojo mb-4">404</p>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">
            {error || 'Noticia no encontrada'}
          </h1>
          <Link
            to="/"
            className="inline-block mt-4 bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Cabecera */}
      <section className="bg-card-bg border border-card-border rounded-[40px] shadow-2xl overflow-hidden">
        <div className="bg-re-rojo px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white font-black text-[11px] tracking-widest uppercase hover:text-white/80 transition-colors"
          >
            ← Volver
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
            {TYPE_BADGES[news.type] || news.type || 'Noticia'}
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden group">
            <img
              src={news.imageUrl || FALLBACK_IMAGE}
              alt={news.title}
              className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>

          <div className="p-6 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-card-border">
            <span className="bg-re-dorado text-re-azul-oscuro text-[9px] lg:text-[10px] font-black px-3 py-1 rounded mb-4 inline-block uppercase tracking-widest self-start">
              {TYPE_BADGES[news.type] || news.type}
            </span>
            <h1 className="text-2xl lg:text-4xl font-black leading-tight uppercase mb-4">
              {news.title}
            </h1>
            <p className="text-[10px] lg:text-xs text-muted-foreground font-black uppercase tracking-widest">
              {news.date
                ? new Date(news.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                : ''}
              {news.location ? ` • 📍 ${news.location}` : ''}
            </p>
            {news.description && (
              <p className="hidden lg:block mt-6 text-sm leading-relaxed text-foreground/90 whitespace-pre-line max-h-64 overflow-y-auto pr-2">
                {news.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Cuerpo (solo móvil: en PC va dentro del post) */}
      {news.description && (
        <section className="lg:hidden bg-card-bg border border-card-border rounded-3xl shadow-card p-6">
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {news.description}
          </p>
        </section>
      )}

      {/* Relacionadas */}
      {related.length > 0 && (
        <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-black italic tracking-tighter uppercase mb-6">
            Otras noticias
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/noticias/${item.id}`}
                className="group rounded-2xl overflow-hidden border border-card-border bg-muted/5 hover:bg-muted/10 transition-all"
              >
                <div className="h-32 overflow-hidden">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <span className="text-re-rojo text-[9px] font-black uppercase tracking-widest">
                    {TYPE_BADGES[item.type] || item.type}
                  </span>
                  <h4 className="text-xs font-black leading-tight uppercase mt-1 line-clamp-2 group-hover:text-re-rojo transition-colors">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
