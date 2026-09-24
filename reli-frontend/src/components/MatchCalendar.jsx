import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { fetchHomeMatches, isMatchLive } from '../utils/matches';
import { STATUS_LABELS } from '../constants/matchStatus';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function buildWeeks(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  return Array.from({ length: 6 }, (_, week) => (
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + week * 7 + day);
      return date;
    })
  ));
}

function eventTone(match) {
  if (isMatchLive(match) || match.status === 'IN_PROGRESS') {
    return 'bg-sky-600 text-white';
  }
  if (match.status === 'FINISHED') return 'bg-slate-500 text-white';
  if (match.status === 'POSTPONED') return 'bg-amber-500 text-white';
  return 'bg-re-rojo text-white';
}

function formatMonth(date) {
  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function CalendarMatch({ match, navigate }) {
  const date = new Date(match.date);
  const isHome = match.home !== false;
  const live = isMatchLive(match);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/partidos/${match.id}`)}
      className="group grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-left text-white hover:border-re-dorado/50 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-5 sm:p-4"
    >
      <div className="border-r border-re-dorado/30 pr-3 text-center sm:pr-5">
        <p className="text-2xl font-black leading-none text-re-rojo sm:text-3xl">{date.getDate()}</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-re-dorado sm:text-[10px]">
          {date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/45">
            {formatTime(date)}
          </span>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            live ? 'bg-sky-500/10 text-sky-500' : 'bg-re-dorado/15 text-re-dorado'
          }`}>
            {live ? 'En vivo' : STATUS_LABELS[match.status] || match.status}
          </span>
        </div>
        <p className="font-black uppercase tracking-tight truncate group-hover:text-re-rojo transition-colors">
          {isHome ? 'Real Lisiados' : match.rival}
          <span className="mx-2 italic text-re-rojo">vs</span>
          {isHome ? match.rival : 'Real Lisiados'}
        </p>
        <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-tight text-white/40 sm:text-[10px]">
          {isHome ? 'Local' : 'Visitante'}{match.location ? ` · ${match.location}` : ''}
        </p>
      </div>

      <span className="text-lg text-re-dorado transition-colors group-hover:text-re-rojo" aria-hidden="true">→</span>
    </motion.button>
  );
}

export default function MatchCalendar() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchHomeMatches()
      .then((data) => setMatches(data.filter((match) => match.date)))
      .catch((error) => console.error('Error cargando el calendario:', error))
      .finally(() => setLoading(false));
  }, []);

  const today = useMemo(() => new Date(), []);
  const weeks = useMemo(() => buildWeeks(cursor), [cursor]);

  const matchesByDay = useMemo(() => {
    const map = new Map();
    for (const match of matches) {
      const key = dayKey(new Date(match.date));
      const list = map.get(key) || [];
      list.push(match);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return map;
  }, [matches]);

  const monthMatches = useMemo(() => (
    matches
      .filter((match) => {
        const date = new Date(match.date);
        return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  ), [matches, cursor]);

  const visibleMatches = selectedDay
    ? monthMatches.filter((match) => sameDay(new Date(match.date), selectedDay))
    : monthMatches;

  const shiftMonth = (amount) => {
    setSelectedDay(null);
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const goToday = () => {
    setSelectedDay(null);
    setCursor(new Date());
  };

  const agendaTitle = selectedDay
    ? selectedDay.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : formatMonth(cursor);

  return (
    <MotionConfig reducedMotion="user">
    <section className="gold-sweep relative overflow-hidden rounded-[1.7rem] border border-re-dorado/30 bg-[#071018] px-3 py-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-5 sm:py-6">
      <div className="stadium-beam stadium-beam-right opacity-50" />
      <div className="relative mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-re-dorado">Agenda del equipo</p>
          <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter">Calendario</h2>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-black tracking-tight">{formatMonth(cursor)}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="mr-1 rounded-full border border-re-dorado/40 px-3 py-1.5 text-[11px] font-bold text-re-dorado transition-colors hover:bg-re-rojo hover:text-white"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-re-dorado/50 hover:text-re-dorado"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-re-dorado/50 hover:text-re-dorado"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-re-rojo font-black uppercase tracking-widest text-xs animate-pulse">Cargando calendario...</div>
      ) : (
        <>
          <AnimatePresence mode="wait">
          <motion.div
            key={`${cursor.getFullYear()}-${cursor.getMonth()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden rounded-2xl border border-re-dorado/25"
          >
            <div className="grid grid-cols-7 border-b border-re-dorado/20 bg-black/30">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-bold text-re-dorado">
                  {day}
                </div>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={dayKey(week[0])} className="grid grid-cols-7 border-b border-white/5 last:border-b-0">
                {week.map((date) => {
                  const inMonth = date.getMonth() === cursor.getMonth();
                  const isToday = sameDay(date, today);
                  const isSelected = selectedDay && sameDay(date, selectedDay);
                  const dayMatches = matchesByDay.get(dayKey(date)) || [];
                  const visible = dayMatches.slice(0, 2);
                  const extra = dayMatches.length - visible.length;

                  return (
                    <div
                      key={dayKey(date)}
                      className={`min-h-[2.75rem] border-r border-white/5 p-1 text-left align-top transition-colors last:border-r-0 sm:min-h-[3.4rem] ${
                        isSelected ? 'bg-re-rojo/15' : dayMatches.length ? 'bg-re-dorado/5' : ''
                      } ${inMonth ? '' : 'bg-black/20'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDay(isSelected ? null : date)}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                          isToday
                            ? 'bg-re-rojo text-white shadow-[0_0_14px_rgba(226,29,44,0.65)]'
                            : inMonth ? 'text-white hover:bg-white/10' : 'text-white/30'
                        }`}
                        aria-label={`Ver partidos del ${date.toLocaleDateString('es-ES')}`}
                        aria-pressed={isSelected}
                      >
                        {date.getDate()}
                      </button>
                      <div className="mt-1 space-y-0.5">
                        {visible.map((match) => (
                          <button
                            key={match.id}
                            type="button"
                            onClick={() => navigate(`/partidos/${match.id}`)}
                            className={`block w-full truncate rounded px-1 py-0.5 text-left text-[8px] sm:text-[10px] font-semibold leading-tight ${eventTone(match)}`}
                            title={match.rival}
                          >
                            {match.rival}
                          </button>
                        ))}
                        {extra > 0 && (
                          <span className="block px-1 text-[9px] font-bold text-foreground/45">+{extra}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
          </AnimatePresence>

          <div className="relative mt-8">
            <div className="mb-2 flex items-end justify-between gap-3 border-b border-re-dorado/20 pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-re-dorado capitalize">
                {agendaTitle}
              </h3>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] font-bold uppercase tracking-widest text-re-rojo"
                >
                  Ver el mes
                </button>
              )}
            </div>
            {visibleMatches.length === 0 ? (
              <p className="py-8 text-center text-sm font-bold text-white/45">
                No hay partidos en {selectedDay ? 'este día' : 'este mes'}.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleMatches.map((match) => (
                  <CalendarMatch key={match.id} match={match} navigate={navigate} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
    </MotionConfig>
  );
}
