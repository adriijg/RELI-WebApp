import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHomeMatches } from '../utils/matches';
import { getMatchOutcome, scoreBadgeClass, scoreTextClass } from '../utils/matchResult';
import logo from '../assets/reli-badge.png';
import AdminMatchEditButton from './admin/AdminMatchEditButton';

export default function LastMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const pollingRef = useRef(null);

  const loadMatches = useCallback(async () => {
    try {
      const list = await fetchHomeMatches();
      const finished = list
        .filter(m => m.status === 'FINISHED' && m.ourGoals != null && m.rivalGoals != null)
        .sort((a,b) => new Date(a.date) - new Date(b.date))
        .slice(-5);
      setMatches(finished);
    } catch {
      // Ignorar errores de carga
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMatches();
    pollingRef.current = setInterval(loadMatches, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadMatches]);

  if (matches.length === 0) return null;

  const last = matches[matches.length - 1];
  const restAsc = matches.slice(0, -1);
  // En móvil las pequeñas van de más reciente a más antigua
  const restDesc = [...restAsc].reverse();

  const renderBigCard = (match, extraClass = '') => {
    const d = match.date ? new Date(match.date) : null;
    const dateFull = d ? d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha TBD';
    const our = match.ourGoals; const rival = match.rivalGoals; const outcome = getMatchOutcome(our, rival); const isHome = match.home !== false;
    return (
      <button onClick={() => navigate(`/partidos/${match.id}`)} className={`snap-start shrink-0 w-[300px] sm:w-[340px] h-[168px] flex flex-col justify-between bg-gradient-to-br from-re-rojo/10 via-card-bg to-card-bg dark:from-re-rojo/20 dark:to-black/30 border-2 border-re-dorado/40 rounded-3xl p-5 text-left shadow-lg ${extraClass}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-re-rojo text-white">Último</span>
          <span className="flex items-center gap-1.5">
            <AdminMatchEditButton matchId={match.id} />
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${scoreBadgeClass(outcome)}`}>{outcome === 'win' ? 'Victoria' : outcome === 'loss' ? 'Derrota' : 'Empate'}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0"><img src={logo} alt="" className="w-8 h-8 object-contain shrink-0" /><span className="truncate font-black text-sm uppercase leading-none">{match.rival}</span></span>
          <span className={`shrink-0 font-black italic text-3xl tracking-tighter ${scoreTextClass(outcome)}`}>{our} - {rival}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground truncate">📍 {match.location || 'Sede por confirmar'} · {isHome ? 'Local' : 'Visitante'} {match.jornada ? `· J${match.jornada}` : ''}</p>
          <p className="text-[11px] font-black uppercase tracking-widest text-re-dorado">{dateFull}</p>
        </div>
      </button>
    );
  };

  const renderSmallCard = (m) => {
    const d = m.date ? new Date(m.date) : null;
    const dateShort = d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
    const our = m.ourGoals; const rival = m.rivalGoals; const outcome = getMatchOutcome(our, rival);
    return (
      <button key={m.id} onClick={() => navigate(`/partidos/${m.id}`)} className="snap-start shrink-0 w-[148px] sm:w-[168px] h-[168px] flex flex-col justify-between bg-muted/5 dark:bg-black/20 border border-card-border dark:border-white/10 rounded-3xl p-4 text-left">
        <span className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{dateShort}</span>
          <AdminMatchEditButton matchId={m.id} />
        </span>
        <span className={`font-black italic text-3xl tracking-tighter leading-none ${scoreTextClass(outcome)}`}>{our} - {rival}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{m.rival}</span>
      </button>
    );
  };

  return (
    <section className="rounded-[1.7rem] border border-card-border dark:border-re-dorado/30 bg-card-bg dark:bg-[#071018] p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-re-dorado">Histórico reciente</p>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Últimos 5 partidos</h2>
        </div>
        <button onClick={() => navigate('/competicion')} className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-re-rojo hover:underline">Ver clasificación →</button>
      </div>

      {/* Móvil: grande primero + pequeñas de más reciente a más antigua */}
      <div className="flex sm:hidden gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1">
        {last && renderBigCard(last)}
        {restDesc.map(renderSmallCard)}
      </div>

      {/* Escritorio: cronológico con el grande al final (como antes) */}
      <div className="hidden sm:flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1">
        {restAsc.map(renderSmallCard)}
        {last && renderBigCard(last)}
      </div>

      <button onClick={() => navigate('/competicion')} className="sm:hidden mt-3 w-full rounded-2xl border border-card-border py-3 text-[11px] font-black uppercase tracking-widest">Ver clasificación →</button>
    </section>
  );
}
