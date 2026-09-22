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
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[40px] bg-card-bg border border-card-border shadow-2xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-card-bg via-card-bg/80 to-transparent" />
        <div className="relative px-6 py-14 lg:p-16 flex flex-col items-center text-center">
          <img src={logo} alt="Real Lisiados F.C." className="h-20 lg:h-28 w-auto drop-shadow-xl mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-re-rojo mb-2">
            Real Lisiados F.C. • #SOMOSLISIADOS
          </p>
          <h1 className="text-3xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
            Nuestra historia
          </h1>
          <p className="mt-4 max-w-2xl text-xs lg:text-sm font-medium text-muted-foreground">
            Mucho más que un club de fútbol sala. Una familia unida por la pasión,
            el esfuerzo y la superación en cada encuentro.
          </p>
        </div>
      </section>

      {/* Cifras */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { value: stats.seasons, label: 'Temporadas' },
          { value: stats.competitions, label: 'Competiciones' },
          { value: stats.matches, label: 'Partidos' },
          { value: stats.players, label: 'Jugadores' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 text-center"
          >
            <p className="text-3xl lg:text-4xl font-black italic text-re-rojo leading-none">
              {loading ? '—' : item.value}
            </p>
            <p className="mt-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* El club */}
      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-10">
        <h2 className="text-xl lg:text-2xl font-black italic tracking-tighter uppercase mb-4">
          El club
        </h2>
        <div className="space-y-4 text-sm lg:text-base leading-relaxed text-foreground/90">
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
      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-10">
        <h2 className="text-xl lg:text-2xl font-black italic tracking-tighter uppercase mb-6">
          Temporada a temporada
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-2xl bg-muted/10 animate-pulse" />
            <div className="h-16 rounded-2xl bg-muted/10 animate-pulse" />
          </div>
        ) : seasons.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-sm py-8 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            Todavía no hay temporadas registradas.
          </p>
        ) : (
          <ol className="relative ml-2 border-l-2 border-re-rojo/30 pl-6 space-y-6">
            {seasons.map((season) => (
              <li key={season.id} className="relative">
                <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-re-rojo shadow-[0_0_10px_rgba(226,29,44,0.6)]" />
                <p className="font-black text-base lg:text-lg uppercase tracking-tight flex items-center gap-3 flex-wrap">
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {values.map((item) => (
          <div
            key={item.title}
            className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8 text-center hover:-translate-y-1 transition-transform"
          >
            <h3 className="text-lg font-black italic tracking-tighter uppercase text-re-rojo mb-2">
              {item.title}
            </h3>
            <p className="text-xs lg:text-sm text-muted-foreground font-medium leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-re-rojo rounded-3xl p-6 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <span className="absolute -right-6 -bottom-8 text-8xl lg:text-[160px] opacity-10 font-black italic select-none text-white">
          RELI
        </span>
        <div className="relative">
          <h3 className="text-xl lg:text-2xl font-black text-white uppercase leading-none mb-2">
            Vive la historia en directo
          </h3>
          <p className="text-white/80 text-xs font-bold">Consulta el equipo y la clasificación actual.</p>
        </div>
        <div className="relative flex gap-3 flex-wrap justify-center">
          <Link
            to="/jugadores"
            className="bg-white text-re-rojo font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase hover:scale-105 transition-transform"
          >
            Jugadores
          </Link>
          <Link
            to="/competicion"
            className="bg-black/20 text-white border border-white/20 font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase hover:scale-105 transition-transform"
          >
            Clasificación
          </Link>
        </div>
      </section>
    </main>
  );
}
