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
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero */}
      <section className="gold-sweep relative overflow-hidden rounded-3xl bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="stadium-beam stadium-beam-left hidden dark:block" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(226,29,44,0.22),transparent_55%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.06] dark:opacity-[0.12]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col items-center text-center">
          <img src={logo} alt="Real Lisiados F.C." className="h-16 sm:h-20 w-auto drop-shadow-md mb-4" />
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-re-rojo mb-2">
            Real Lisiados F.C. • #SOMOSLISIADOS
          </p>
          <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground dark:text-white">
            Nuestra historia
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-muted-foreground dark:text-white/60">
            Mucho más que un club de fútbol sala. Una familia unida por la pasión,
            el esfuerzo y la superación en cada encuentro.
          </p>
        </div>
      </section>

      {/* Cifras */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: stats.seasons, label: 'Temporadas' },
          { value: stats.competitions, label: 'Competiciones' },
          { value: stats.matches, label: 'Partidos' },
          { value: stats.players, label: 'Jugadores' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-2xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] px-4 py-4 text-center"
          >
            <p className="text-2xl sm:text-4xl font-black italic text-re-rojo leading-none">
              {loading ? '—' : item.value}
            </p>
            <p className="mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* El club */}
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-2xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase mb-3 text-foreground dark:text-white">
          El club
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/90 dark:text-white/80">
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
      <section className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-2xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase mb-4 text-foreground dark:text-white">
          Temporada a temporada
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-muted/10 animate-pulse" />
            <div className="h-10 rounded-xl bg-muted/10 animate-pulse" />
          </div>
        ) : seasons.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-sm py-6 bg-muted/5 rounded-xl border border-dashed border-card-border">
            Todavía no hay temporadas registradas.
          </p>
        ) : (
          <ol className="relative ml-1 border-l-2 border-re-rojo/30 pl-6 space-y-4">
            {seasons.map((season) => (
              <li key={season.id} className="relative">
                <span className="absolute -left-[25px] top-2 w-3 h-3 rounded-full bg-re-rojo" />
                <p className="font-black text-base sm:text-lg uppercase tracking-tight flex items-center gap-2 flex-wrap">
                  Temporada {season.name}
                  {season.current && (
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-re-dorado text-re-azul-oscuro px-2.5 py-1 rounded-full">
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {values.map((item) => (
          <div
            key={item.title}
            className="bg-card-bg dark:bg-[#071018] border border-card-border dark:border-re-dorado/30 rounded-2xl shadow-card dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-5 text-center"
          >
            <h3 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase text-re-rojo mb-2">
              {item.title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-re-rojo rounded-2xl px-5 py-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <span className="absolute -right-4 -bottom-6 text-7xl opacity-10 font-black italic select-none text-white">
          RELI
        </span>
        <div className="relative text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-none mb-2">
            Vive la historia en directo
          </h3>
          <p className="text-white/80 text-sm font-bold">Consulta el equipo y la clasificación actual.</p>
        </div>
        <div className="relative flex gap-2 flex-wrap justify-center">
          <Link
            to="/jugadores"
            className="bg-white text-re-rojo font-black px-5 py-3 rounded-lg text-[11px] tracking-widest uppercase"
          >
            Jugadores
          </Link>
          <Link
            to="/competicion"
            className="bg-black/20 text-white border border-white/20 font-black px-5 py-3 rounded-lg text-[11px] tracking-widest uppercase"
          >
            Clasificación
          </Link>
        </div>
      </section>
    </main>
  );
}
