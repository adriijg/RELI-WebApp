import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import { getAllPlayers, getCompetitions, getMatches, getSeasons, toPage } from '../services/api';

export default function HistoryPage() {
  const [stats, setStats] = useState({ seasons: 0, competitions: 0, matches: 0, players: 0 });
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getSeasons({ size: 100, sortBy: 'name', direction: 'asc' }),
      getCompetitions({ size: 100 }),
      getMatches({ size: 1 }),
      getAllPlayers(),
    ]).then(([seasonsRes, competitionsRes, matchesRes, playersRes]) => {
      const seasonList = seasonsRes.status === 'fulfilled' ? toPage(seasonsRes.value).content : [];
      setSeasons(seasonList);
      setStats({
        seasons: seasonList.length,
        competitions:
          competitionsRes.status === 'fulfilled' ? toPage(competitionsRes.value).totalElements : 0,
        matches: matchesRes.status === 'fulfilled' ? toPage(matchesRes.value).totalElements : 0,
        players: playersRes.status === 'fulfilled' ? toPage(playersRes.value).content.length : 0,
      });
      setLoading(false);
    });
  }, []);

  const values = [
    {
      title: 'Pasión',
      text: 'Vivimos cada partido como si fuera el último, con el escudo por delante.',
    },
    {
      title: 'Esfuerzo',
      text: 'Nadie regala nada en la pista: trabajo y superación en cada encuentro.',
    },
    {
      title: 'Familia',
      text: 'Mucho más que un club de fútbol: una familia unida dentro y fuera de la pista.',
    },
  ];

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-card-bg border border-card-border shadow-card">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-card-bg via-card-bg/80 to-transparent" />
        <div className="relative px-5 py-7 sm:py-8 flex flex-col items-center text-center">
          <img src={logo} alt="Real Lisiados F.C." className="h-12 sm:h-14 w-auto drop-shadow-md mb-3" />
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-re-rojo mb-1">
            Real Lisiados F.C. • #SOMOSLISIADOS
          </p>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">
            Nuestra historia
          </h1>
          <p className="mt-2 max-w-lg text-[11px] sm:text-xs font-medium text-muted-foreground">
            Mucho más que un club de fútbol sala. Una familia unida por la pasión,
            el esfuerzo y la superación en cada encuentro.
          </p>
        </div>
      </section>

      {/* Cifras */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { value: stats.seasons, label: 'Temporadas' },
          { value: stats.competitions, label: 'Competiciones' },
          { value: stats.matches, label: 'Partidos' },
          { value: stats.players, label: 'Jugadores' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card-bg border border-card-border rounded-2xl shadow-card px-3 py-3 text-center"
          >
            <p className="text-xl sm:text-2xl font-black italic text-re-rojo leading-none">
              {loading ? '—' : item.value}
            </p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* El club */}
      <section className="bg-card-bg border border-card-border rounded-2xl shadow-card p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-black italic tracking-tighter uppercase mb-2">
          El club
        </h2>
        <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-foreground/90">
          <p>
            El <strong>Real Lisiados F.C.</strong> es un equipo de fútbol sala que compite
            jornada a jornada con una idea clara: dejarse todo en la pista y disfrutar
            del camino juntos.
          </p>
          <p>
            Cada temporada escribimos un nuevo capítulo con nuestros jugadores, nuestro
            cuerpo técnico y una afición que nunca falla. Esto es solo el principio:
            la historia la seguimos escribiendo entre todos.
          </p>
        </div>
      </section>

      {/* Temporadas */}
      <section className="bg-card-bg border border-card-border rounded-2xl shadow-card p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-black italic tracking-tighter uppercase mb-3">
          Temporada a temporada
        </h2>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 rounded-xl bg-muted/10 animate-pulse" />
            <div className="h-8 rounded-xl bg-muted/10 animate-pulse" />
          </div>
        ) : seasons.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs py-5 bg-muted/5 rounded-xl border border-dashed border-card-border">
            Todavía no hay temporadas registradas.
          </p>
        ) : (
          <ol className="relative ml-1 border-l-2 border-re-rojo/30 pl-5 space-y-3">
            {seasons.map((season) => (
              <li key={season.id} className="relative">
                <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-re-rojo" />
                <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2 flex-wrap">
                  Temporada {season.name}
                  {season.current && (
                    <span className="text-[8px] font-black uppercase tracking-widest bg-re-dorado text-re-azul-oscuro px-2 py-0.5 rounded-full">
                      Actual
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Valores */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {values.map((item) => (
          <div
            key={item.title}
            className="bg-card-bg border border-card-border rounded-2xl shadow-card p-4 text-center"
          >
            <h3 className="text-sm font-black italic tracking-tighter uppercase text-re-rojo mb-1">
              {item.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-re-rojo rounded-2xl px-4 py-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
        <span className="absolute -right-4 -bottom-6 text-7xl opacity-10 font-black italic select-none text-white">
          RELI
        </span>
        <div className="relative text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-black text-white uppercase leading-none mb-1">
            Vive la historia en directo
          </h3>
          <p className="text-white/80 text-[11px] font-bold">Consulta el equipo y la clasificación actual.</p>
        </div>
        <div className="relative flex gap-2 flex-wrap justify-center">
          <Link
            to="/jugadores"
            className="bg-white text-re-rojo font-black px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase"
          >
            Jugadores
          </Link>
          <Link
            to="/competicion"
            className="bg-black/20 text-white border border-white/20 font-black px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase"
          >
            Clasificación
          </Link>
        </div>
      </section>
    </main>
  );
}
