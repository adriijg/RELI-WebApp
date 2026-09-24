import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import { getMatchDetail, getMatches, getStats } from '../services/api';
import { STATUS_LABELS } from '../constants/matchStatus';
import { jerseyForCompetition } from '../constants/jerseys';
import { POSITION_LABELS } from '../constants/positions';
import { isMatchLive } from '../utils/matches';

function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupGoals(goals) {
  const map = new Map();
  for (const goal of goals) {
    const existing = map.get(goal.playerId);
    if (existing) {
      existing.minutes.push(goal.minute);
    } else {
      map.set(goal.playerId, {
        playerId: goal.playerId,
        playerName: goal.playerName,
        jerseyNumber: goal.jerseyNumber,
        minutes: [goal.minute],
      });
    }
  }
  return Array.from(map.values());
}

function getMatchList(data) {
  return Array.isArray(data) ? data : data?.content ?? [];
}

function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(fs|f s|futsal)\s+/, '');
}

function isPlayed(match) {
  const timestamp = match?.date ? new Date(match.date).getTime() : NaN;
  if (!Number.isNaN(timestamp) && timestamp > Date.now()) return false;
  return match?.status === 'FINISHED' || (match?.ourGoals != null && match?.rivalGoals != null);
}

function sortNewestFirst(matches) {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });
}

function getResultGoals(match) {
  return {
    ourGoals: match.ourGoals,
    rivalGoals: match.rivalGoals,
  };
}

async function getFfmMatches(competitionIds) {
  const results = await Promise.allSettled(
    competitionIds.map(async (competitionId) => {
      const indexResponse = await fetch(`/ffm/${competitionId}/index.json`);
      if (!indexResponse.ok) return [];
      const index = await indexResponse.json();
      const rounds = await Promise.all(
        (index.rounds || []).map(async (round) => {
          const response = await fetch(`/ffm/${competitionId}/jornada-${round}.json`);
          if (!response.ok) return [];
          const games = await response.json();
          return games.map((game) => ({ ...game, competitionId, jornada: round }));
        }),
      );
      return rounds.flat();
    }),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

function mapTeamMatches(ffmMatches, rivalName) {
  const rivalKey = normalizeName(rivalName);
  const rivalCodes = new Set(
    ffmMatches.flatMap((game) => {
      if (normalizeName(game.home) === rivalKey) return [game.homeCode];
      if (normalizeName(game.away) === rivalKey) return [game.awayCode];
      return [];
    }),
  );
  const teamCode = [...rivalCodes][0];
  if (!teamCode) return [];

  return ffmMatches
    .filter((game) => String(game.homeCode) === String(teamCode) || String(game.awayCode) === String(teamCode))
    .map((game) => {
      const isHome = String(game.homeCode) === String(teamCode);
      return {
        id: `ffm-${game.competitionId}-${game.jornada}-${game.homeCode}-${game.awayCode}`,
        rival: isHome ? game.away : game.home,
        home: isHome,
        date: game.date,
        status: game.homeGoals != null && game.awayGoals != null ? 'FINISHED' : 'SCHEDULED',
        ourGoals: game.homeGoals,
        rivalGoals: game.awayGoals,
        jornada: game.jornada,
        competitionId: game.competitionId,
      };
    });
}

function buildRivalInfo(detail, allMatches, teamMatches) {
  const match = detail.match;
  const currentRival = detail.rivalInfo?.rivalName || match.rival;
  const rivalKey = normalizeName(currentRival);
  const sourceMatches = allMatches.filter((candidate) => normalizeName(candidate.rival) === rivalKey);
  const fallbackInfo = detail.rivalInfo || {};

  if (!sourceMatches.length) {
    return {
      ...fallbackInfo,
      rivalName: currentRival,
      recentMatches: sortNewestFirst((teamMatches.length ? teamMatches : fallbackInfo.recentMatches || []).filter(isPlayed)).slice(0, 5),
      headToHead: sortNewestFirst((fallbackInfo.headToHead || []).filter(isPlayed)),
    };
  }

  const pastMatches = sourceMatches.filter(isPlayed);
  const recentMatches = sortNewestFirst(
    (teamMatches.length ? teamMatches : pastMatches).filter((candidate) => String(candidate.id) !== String(match.id) && isPlayed(candidate)),
  ).slice(0, 5);
  const headToHead = sortNewestFirst(pastMatches);
  const results = headToHead.map(getResultGoals);
  const ourWins = results.filter(({ ourGoals, rivalGoals }) => ourGoals > rivalGoals).length;
  const rivalWins = results.filter(({ ourGoals, rivalGoals }) => ourGoals < rivalGoals).length;

  return {
    ...fallbackInfo,
    rivalName: currentRival,
    recentMatches,
    headToHead,
    ourWins,
    draws: headToHead.length - ourWins - rivalWins,
    rivalWins,
  };
}

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detailResult, matchesResult, statsResult] = await Promise.allSettled([
        getMatchDetail(id),
        getMatches({ page: 0, size: 1000, sortBy: 'date', direction: 'desc' }),
        getStats({ matchId: id, size: 200 }),
      ]);
      if (detailResult.status === 'rejected') throw detailResult.reason;
      const data = detailResult.value;
      const statsValue = statsResult.status === 'fulfilled' ? statsResult.value : [];
      const matchStats = Array.isArray(statsValue) ? statsValue : statsValue?.content ?? [];
      const allMatches = matchesResult.status === 'fulfilled' ? getMatchList(matchesResult.value) : [];
      const competitionIds = [...new Set(
        allMatches
          .filter((candidate) => normalizeName(candidate.rival) === normalizeName(data.rivalInfo?.rivalName || data.match.rival))
          .map((candidate) => candidate.competitionId)
          .filter((competitionId) => competitionId != null),
      )];
      if (data.match.competitionId != null) competitionIds.push(data.match.competitionId);
      const ffmMatches = await getFfmMatches([...new Set(competitionIds)]);
      const teamMatches = mapTeamMatches(ffmMatches, data.rivalInfo?.rivalName || data.match.rival);
      setDetail({ ...data, stats: matchStats, rivalInfo: buildRivalInfo(data, allMatches, teamMatches) });
    } catch (err) {
      setError(err.message || 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-64 sm:h-72 rounded-[40px] bg-card-bg animate-pulse" />
        <div className="h-40 rounded-3xl bg-card-bg animate-pulse" />
        <div className="h-40 rounded-3xl bg-card-bg animate-pulse" />
      </main>
    );
  }

  if (error || !detail?.match) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="card-depth rounded-3xl p-8 sm:p-10 text-center">
          <p className="text-4xl sm:text-5xl font-black italic text-re-rojo mb-4">404</p>
          <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase mb-2">
            {error || 'Partido no encontrado'}
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

  const { match, goals, callups, rivalInfo, stats = [] } = detail;
  const isHome = match.home !== false;
  const left = isHome
    ? { name: 'REAL LISIADOS', isUs: true }
    : { name: match.rival, isUs: false };
  const right = isHome
    ? { name: match.rival, isUs: false }
    : { name: 'REAL LISIADOS', isUs: true };
  const leftGoals = isHome ? match.ourGoals : match.rivalGoals;
  const rightGoals = isHome ? match.rivalGoals : match.ourGoals;
  const historicalJersey = (playerId, jerseyNumber) =>
    jerseyForCompetition(playerId, match.competitionId, jerseyNumber);
  const scorers = groupGoals(goals).map((scorer) => ({
    ...scorer,
    jerseyNumber: historicalJersey(scorer.playerId, scorer.jerseyNumber),
  }));
  const jerseyByPlayer = new Map();
  for (const g of goals) {
    if (g?.playerId != null && g?.jerseyNumber != null && !jerseyByPlayer.has(g.playerId)) {
      jerseyByPlayer.set(g.playerId, historicalJersey(g.playerId, g.jerseyNumber));
    }
  }
  for (const c of callups) {
    if (c?.playerId != null && c?.jerseyNumber != null && !jerseyByPlayer.has(c.playerId)) {
      jerseyByPlayer.set(c.playerId, historicalJersey(c.playerId, c.jerseyNumber));
    }
  }
  const carded = stats.filter((s) => (s?.yellowCards ?? 0) > 0 || (s?.redCards ?? 0) > 0);
  const formattedDate = formatDateTime(match.date);
  const finished = match.status === 'FINISHED' && match.ourGoals != null && match.rivalGoals != null;

  return (
    <main className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Cabecera */}
      <section className="bg-card-bg border border-card-border rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden">
        <div className="bg-re-rojo px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 text-white font-black text-[10px] sm:text-[11px] tracking-widest uppercase hover:text-white/80 transition-colors"
          >
            ← Volver
          </button>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/80 truncate max-w-[50%] text-right">
            {match.competitionName || 'Competición'}
            {match.jornada != null ? ` • J${match.jornada}` : ''}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-muted/10 text-muted-foreground border border-card-border">
              {STATUS_LABELS[match.status] || match.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
            <div className="text-center flex-1 min-w-0">
              <div className="h-10 sm:h-14 flex items-center justify-center mb-2">
                {left.isUs ? (
                  <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                ) : (
                  <span className="text-3xl sm:text-5xl lg:text-6xl">⚽</span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg lg:text-2xl font-black tracking-tighter uppercase break-words leading-tight">
                {left.name}
              </h2>
            </div>

            <div className="shrink-0 text-center px-1 sm:px-2">
              {finished ? (
                <span className="text-re-rojo font-black italic text-3xl sm:text-4xl lg:text-5xl tracking-tighter block leading-none">
                  {leftGoals} - {rightGoals}
                </span>
              ) : (
                <span className="text-re-rojo font-black italic text-3xl sm:text-4xl lg:text-5xl tracking-tighter block leading-none">
                  VS
                </span>
              )}
              <p className="hidden sm:block mt-2 sm:mt-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-muted-foreground leading-tight">
                {formattedDate || 'Fecha TBD'}
              </p>
            </div>

            <div className="text-center flex-1 min-w-0">
              <div className="h-10 sm:h-14 flex items-center justify-center mb-2">
                {right.isUs ? (
                  <img src={logo} alt="Real Lisiados F.C." className="h-full w-auto drop-shadow-lg" />
                ) : (
                  <span className="text-3xl sm:text-5xl lg:text-6xl">⚽</span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg lg:text-2xl font-black tracking-tighter uppercase break-words leading-tight">
                {right.name}
              </h2>
            </div>
          </div>

          <p className="sm:hidden mt-4 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-tight">
            {formattedDate || 'Fecha TBD'}
          </p>

          <div className="mt-4 pt-4 border-t border-card-border text-center">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-re-rojo mb-1">📍 Sede</p>
            <p className="font-black text-xs sm:text-sm uppercase text-foreground/80">
              {match.location || 'Sede por confirmar'}
            </p>
            {finished && (
              <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-foreground/70">
                {callups.length} convocados
                {carded.length > 0 ? ` · ${carded.length} ${carded.length === 1 ? 'tarjeta' : 'tarjetas'}` : ''}
                {goals.length > 0 ? ` · ${goals.length} ${goals.length === 1 ? 'gol' : 'goles'}` : ' · sin goles nuestros'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Goleadores */}
      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Goleadores</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {goals.length} {goals.length === 1 ? 'gol' : 'goles'}
          </span>
        </div>

        {scorers.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-4 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            {finished && (match.ourGoals ?? 0) === 0
              ? 'El Real Lisiados no marcó en este partido.'
              : 'Todavía no hay goles registrados para este partido.'}
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {scorers.map((scorer) => (
              <li
                key={scorer.playerId}
                className="flex items-center gap-2 sm:gap-4 bg-muted/5 border border-card-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-rojo text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {scorer.jerseyNumber}
                </span>
                <span className="font-black text-xs sm:text-sm flex-1 min-w-0 truncate">{scorer.playerName}</span>
                <span className="text-re-rojo font-black text-[10px] sm:text-xs tracking-widest uppercase shrink-0">
                  ⚽ {scorer.minutes.filter((m) => m != null).map((m) => `${m}'`).join(', ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tarjetas */}
      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Tarjetas</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {carded.length} {carded.length === 1 ? 'jugador' : 'jugadores'}
          </span>
        </div>

        {carded.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 sm:py-8 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            Sin tarjetas en este partido.
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {carded.map((s) => (
              <li
                key={s.playerId}
                className="flex items-center gap-2 sm:gap-4 bg-muted/5 border border-card-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-azul-oscuro text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {jerseyByPlayer.get(s.playerId) ?? '—'}
                </span>
                <span className="font-black text-xs sm:text-sm flex-1 min-w-0 truncate">{s.playerName}</span>
                <span className="shrink-0 flex items-center gap-2 text-[10px] sm:text-xs font-black tracking-widest uppercase">
                  {(s.yellowCards ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-4 rounded-[3px] bg-yellow-400 border border-yellow-600" />
                      {s.yellowCards > 1 ? `x${s.yellowCards}` : ''}
                    </span>
                  )}
                  {(s.redCards ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-4 rounded-[3px] bg-red-600 border border-red-800" />
                      {s.redCards > 1 ? `x${s.redCards}` : ''}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Convocados */}
      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">Convocados</h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {callups.length} {callups.length === 1 ? 'jugador' : 'jugadores'}
          </span>
        </div>

        {callups.length === 0 ? (
          <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 sm:py-8 bg-muted/5 rounded-2xl border border-dashed border-card-border">
            Aún no hay convocados para este partido.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {callups.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 sm:gap-3 bg-muted/5 border border-card-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
              >
                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-re-azul-oscuro text-white font-black text-xs sm:text-sm flex items-center justify-center">
                  {historicalJersey(player.playerId, player.jerseyNumber)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs sm:text-sm truncate">{player.playerName}</p>
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {POSITION_LABELS[player.position] || player.position}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Últimos partidos del rival */}
      {rivalInfo && (
        <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase mb-4 sm:mb-6">
            Últimos partidos de {rivalInfo.rivalName}
          </h3>
          {rivalInfo.recentMatches?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {rivalInfo.recentMatches.map((m) => {
              const mIsHome = m.home !== false;
              const mOurGoals = mIsHome ? m.ourGoals : m.rivalGoals;
              const mRivalGoals = mIsHome ? m.rivalGoals : m.ourGoals;
              const mDate = m.date ? new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={m.id} className="flex items-center gap-2 sm:gap-3 bg-muted/5 border border-card-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest shrink-0 w-20 text-center">{mDate}</span>
                  <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${mIsHome ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
                    {mIsHome ? 'Local' : 'Visitante'}
                  </span>
                  <span className="flex-1 min-w-0 text-xs sm:text-sm font-black uppercase truncate">{m.rival}</span>
                  <span className="font-black text-sm sm:text-base shrink-0">
                    {mOurGoals != null && mRivalGoals != null ? (
                      <span className={mOurGoals > mRivalGoals ? 'text-emerald-500' : mOurGoals < mRivalGoals ? 'text-re-rojo' : 'text-muted-foreground'}>
                        {mOurGoals} - {mRivalGoals}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 bg-muted/5 rounded-2xl border border-dashed border-card-border">
              Todavía no hay partidos jugados registrados.
            </p>
          )}
        </section>
      )}

      {/* Histórico contra ellos */}
      {rivalInfo && (
        <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tighter uppercase">
              Histórico vs {rivalInfo.rivalName}
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500">{rivalInfo.ourWins ?? 0}V</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rivalInfo.draws ?? 0}E</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-re-rojo">{rivalInfo.rivalWins ?? 0}D</span>
            </div>
          </div>
          {rivalInfo.headToHead?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {rivalInfo.headToHead.map((m) => {
              const mIsHome = m.home !== false;
              const mOurGoals = mIsHome ? m.ourGoals : m.rivalGoals;
              const mRivalGoals = mIsHome ? m.rivalGoals : m.ourGoals;
              const resultGoals = getResultGoals(m);
              const mDate = m.date ? new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={m.id} className="flex items-center gap-2 sm:gap-3 bg-muted/5 border border-card-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest shrink-0 w-20 text-center">{mDate}</span>
                  <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${mIsHome ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
                    {mIsHome ? 'Local' : 'Visitante'}
                  </span>
                  <span className="flex-1 min-w-0 text-xs sm:text-sm font-black uppercase truncate">{m.rival}</span>
                  <span className="font-black text-sm sm:text-base shrink-0">
                    {mOurGoals != null && mRivalGoals != null ? (
                      <span className={resultGoals.ourGoals > resultGoals.rivalGoals ? 'text-emerald-500' : resultGoals.ourGoals < resultGoals.rivalGoals ? 'text-re-rojo' : 'text-muted-foreground'}>
                        {mOurGoals} - {mRivalGoals}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-bold text-xs sm:text-sm py-6 bg-muted/5 rounded-2xl border border-dashed border-card-border">
              Todavía no hay enfrentamientos registrados.
            </p>
          )}
          <p className="px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-t border-card-border mt-4">
            {(rivalInfo.ourWins ?? 0) + (rivalInfo.draws ?? 0) + (rivalInfo.rivalWins ?? 0)} partidos · {rivalInfo.ourWins ?? 0} victorias · {rivalInfo.draws ?? 0} empates · {rivalInfo.rivalWins ?? 0} derrotas
          </p>
        </section>
      )}

      {/* Estado en vivo */}
      {isMatchLive(match) && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl py-3 sm:py-4 text-center">
          <p className="font-black text-xs sm:text-sm tracking-widest uppercase text-blue-500 animate-pulse">
            ⚡ Partido en juego
          </p>
        </div>
      )}
    </main>
  );
}
