import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import AdminSelect from '../../components/admin/AdminSelect';
import Badge from '../../components/admin/Badge';
import LoadingState from '../../components/admin/LoadingState';
import { useCrud } from '../../hooks/useCrud';
import {
  createMatch,
  deleteMatch,
  getCompetitions,
  getMatches,
  getSeasons,
  toPage,
  updateMatch,
  getMatchDetail,
  getAllPlayers,
  getPlayerSeasonStats,
  createStat,
  updateStat,
  scrapeMatchActa,
} from '../../services/api';
import { STATUS_LABELS } from '../../constants/matchStatus';
import { MATCH_PHASE_LABELS, MATCH_PHASE_OPTIONS } from '../../constants/matchPhases';
import { POSITION_LABELS } from '../../constants/positions';
import { rememberAdminMatch } from '../../utils/adminRecentMatches';
import { getMatchOutcome, scoreTextClass } from '../../utils/matchResult';
import { formatDate } from '../../utils/format';

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let mins = 7 * 60; mins <= 22 * 60; mins += 30) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
  }
  return opts;
})();

const CARD_OPTIONS = [0, 1, 2].map((value) => ({ value, label: String(value) }));

const normalizeTime = (time) => {
  if (!time || !time.trim()) return '';
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error('La hora debe tener el formato HH:MM (ej. 19:30)');
  const hh = match[1].padStart(2, '0');
  if (Number(hh) > 23 || Number(match[2]) > 59) throw new Error('La hora introducida no es válida');
  return `${hh}:${match[2]}`;
};

const playerLabel = (player) =>
  `#${player.jerseyNumber} ${player.nickname || player.name}${player.position ? ` — ${POSITION_LABELS[player.position] || player.position}` : ''}`;

function replaceStat(setDetail, playerId, saved) {
  setDetail((prev) => {
    if (!prev) return prev;
    const others = (prev.stats || []).filter((stat) => String(stat.playerId) !== String(playerId));
    return { ...prev, stats: [...others, saved] };
  });
}

function useMatchActa(matchId, refreshKey) {
  const [detail, setDetail] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(Boolean(matchId));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMatchDetail(matchId);
      setDetail(data);

      let roster = [];
      const all = await getAllPlayers().catch(() => []);
      try {
        const competitionId = data?.match?.competitionId;
        if (competitionId) {
          const competitions = await getCompetitions({ size: 200 });
          const competition = toPage(competitions).content.find(
            (item) => String(item.id) === String(competitionId),
          );
          if (competition?.seasonId) {
            const stats = await getPlayerSeasonStats({ seasonId: competition.seasonId });
            if (Array.isArray(stats) && stats.length) {
              roster = stats.map((stat) => ({
                id: stat.playerId,
                name: stat.name,
                nickname: stat.nickname,
                jerseyNumber: stat.jerseyNumber,
                position: stat.position,
              }));
            }
          }
        }
      } catch {
        roster = [];
      }
      setPlayers(roster.length ? roster : Array.isArray(all) ? all : []);
    } catch (err) {
      setDetail(null);
      setError(err.message || 'No se pudo cargar el acta');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { detail, setDetail, players, loading, error, reload: load };
}

function GoleadoresSection({ matchId, stats, players, setDetail, loading }) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [goals, setGoals] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scorers = stats.filter((stat) => (stat.goals || 0) > 0);

  const upsertStat = async (playerId, patch) => {
    const existing = stats.find((stat) => String(stat.playerId) === String(playerId));
    const payload = {
      playerId: Number(playerId),
      matchId,
      goals: patch.goals ?? existing?.goals ?? 0,
      assists: patch.assists ?? existing?.assists ?? 0,
      yellowCards: patch.yellowCards ?? existing?.yellowCards ?? 0,
      redCards: patch.redCards ?? existing?.redCards ?? 0,
      mvp: patch.mvp ?? existing?.mvp ?? false,
      attended: patch.attended ?? existing?.attended ?? true,
    };
    const saved = existing ? await updateStat(existing.id, payload) : await createStat(payload);
    replaceStat(setDetail, playerId, saved);
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!selectedPlayer) return;
    const amount = Number(goals);
    if (!amount || amount < 1) {
      setError('Introduce al menos 1 gol');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const existing = stats.find((stat) => String(stat.playerId) === String(selectedPlayer));
      await upsertStat(selectedPlayer, { goals: (existing?.goals || 0) + amount });
      setSelectedPlayer('');
      setGoals(1);
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (playerId) => {
    try {
      await upsertStat(playerId, { goals: 0 });
    } catch (err) {
      setError(err.message || 'Error al quitar el gol');
    }
  };

  if (loading) return <LoadingState label="Cargando goleadores…" />;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-muted/5 p-4">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-re-dorado mb-3">Nuestros goleadores</h4>
        {scorers.length === 0 ? (
          <p className="text-[11px] font-bold text-muted-foreground py-2">Aún no hay goleadores.</p>
        ) : (
          <ul className="space-y-2">
            {scorers.map((stat) => (
              <li key={stat.playerId} className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-3 py-2">
                <span className="w-9 h-9 rounded-lg bg-re-rojo text-white font-black text-sm flex items-center justify-center shrink-0">
                  {stat.goals}
                </span>
                <span className="flex-1 min-w-0 font-black text-sm truncate">{stat.playerName}</span>
                <button onClick={() => handleRemove(stat.playerId)} className="text-re-rojo text-[10px] font-black uppercase">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 items-end bg-card-bg border border-card-border rounded-2xl p-4">
        <AdminSelect
          label="Jugador"
          value={selectedPlayer}
          onChange={setSelectedPlayer}
          placeholder="Selecciona…"
          options={players.map((player) => ({ value: String(player.id), label: playerLabel(player) }))}
          className="flex-1"
        />
        <div className="w-28">
          <label htmlFor="goal-amount" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-muted-foreground">
            Goles
          </label>
          <input
            id="goal-amount"
            type="number"
            min="1"
            max="20"
            value={goals}
            onChange={(event) => setGoals(event.target.value)}
            className="w-full bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !selectedPlayer}
          className="bg-re-rojo text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50"
        >
          Añadir gol
        </button>
      </form>
      {error && <p className="text-xs font-bold text-re-rojo">{error}</p>}
    </div>
  );
}

function ConvocadosSection({ matchId, stats, players, setDetail, loading }) {
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const convocados = stats.filter((stat) => stat.attended);
  const convocadoIds = new Set(convocados.map((stat) => String(stat.playerId)));

  const toggle = async (player) => {
    const existing = stats.find((stat) => String(stat.playerId) === String(player.id));
    const isIn = convocadoIds.has(String(player.id));
    const payload = {
      playerId: Number(player.id),
      matchId,
      goals: existing?.goals || 0,
      assists: existing?.assists || 0,
      yellowCards: existing?.yellowCards || 0,
      redCards: existing?.redCards || 0,
      mvp: existing?.mvp || false,
      attended: !isIn,
    };
    setSavingId(String(player.id));
    setError('');
    try {
      const saved = existing ? await updateStat(existing.id, payload) : await createStat(payload);
      replaceStat(setDetail, player.id, saved);
    } catch (err) {
      setError(err.message || 'Error al actualizar la convocatoria');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingState label="Cargando convocados…" />;
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-muted-foreground">Toca al jugador para convocar / desconvocar.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map((player) => {
          const isIn = convocadoIds.has(String(player.id));
          const saving = savingId === String(player.id);
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => toggle(player)}
              disabled={saving}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                isIn ? 'bg-re-rojo border-re-rojo text-white shadow-md' : 'bg-card-bg border-card-border text-foreground hover:border-re-rojo/30'
              } ${saving ? 'opacity-60' : ''}`}
            >
              <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isIn ? 'bg-white text-re-rojo' : 'bg-re-azul-oscuro text-white'}`}>
                #{player.jerseyNumber}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black leading-none">{player.nickname || player.name}</span>
                <span className={`block text-[10px] uppercase tracking-widest ${isIn ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {POSITION_LABELS[player.position] || player.position}
                </span>
              </span>
              {isIn && <span className="shrink-0 text-[10px] font-black">✓</span>}
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] font-bold text-muted-foreground">{convocados.length} convocados</p>
      {error && <p className="text-center text-xs font-bold text-re-rojo">{error}</p>}
    </div>
  );
}

function TarjetasSection({ matchId, stats, players, setDetail, loading }) {
  const [selected, setSelected] = useState('');
  const [yellow, setYellow] = useState(0);
  const [red, setRed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const carded = stats.filter((stat) => (stat.yellowCards || 0) > 0 || (stat.redCards || 0) > 0);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selected) return;
    const existing = stats.find((stat) => String(stat.playerId) === String(selected));
    const payload = {
      playerId: Number(selected),
      matchId,
      goals: existing?.goals || 0,
      assists: existing?.assists || 0,
      yellowCards: Number(yellow),
      redCards: Number(red),
      mvp: !!existing?.mvp,
      attended: existing?.attended ?? true,
    };
    setSaving(true);
    setError('');
    try {
      const saved = existing ? await updateStat(existing.id, payload) : await createStat(payload);
      replaceStat(setDetail, selected, saved);
      setSelected('');
      setYellow(0);
      setRed(0);
    } catch (err) {
      setError(err.message || 'Error al guardar las tarjetas');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async (stat) => {
    setError('');
    try {
      const saved = await updateStat(stat.id, {
        playerId: stat.playerId,
        matchId,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        yellowCards: 0,
        redCards: 0,
        mvp: !!stat.mvp,
        attended: stat.attended,
      });
      replaceStat(setDetail, stat.playerId, saved);
    } catch (err) {
      setError(err.message || 'Error al quitar las tarjetas');
    }
  };

  if (loading) return <LoadingState label="Cargando tarjetas…" />;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-muted/5 p-4">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-re-dorado mb-3">Tarjetas ({carded.length})</h4>
        {carded.length === 0 ? (
          <p className="text-[11px] font-bold text-muted-foreground py-2">Sin tarjetas.</p>
        ) : (
          <ul className="space-y-2">
            {carded.map((stat) => (
              <li key={stat.id} className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-3 py-2">
                <span className="flex-1 min-w-0 font-black text-sm">{stat.playerName}</span>
                <Badge variant="yellow">{stat.yellowCards} amarilla{stat.yellowCards !== 1 ? 's' : ''}</Badge>
                <Badge variant="red">{stat.redCards} roja{stat.redCards !== 1 ? 's' : ''}</Badge>
                <button onClick={() => handleClear(stat)} className="text-re-rojo text-[10px] font-black uppercase">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSave} className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest">Añadir / editar tarjeta</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <AdminSelect
            label="Jugador"
            value={selected}
            onChange={setSelected}
            placeholder="Selecciona…"
            options={players.map((player) => ({ value: String(player.id), label: playerLabel(player) }))}
            className="flex-1"
          />
          <AdminSelect label="Amarillas" value={yellow} onChange={(value) => setYellow(Number(value))} placeholder="0" options={CARD_OPTIONS} className="w-28" />
          <AdminSelect label="Rojas" value={red} onChange={(value) => setRed(Number(value))} placeholder="0" options={CARD_OPTIONS.slice(0, 2)} className="w-28" />
        </div>
        <button type="submit" disabled={saving || !selected} className="w-full bg-re-rojo text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50">
          Guardar tarjetas
        </button>
      </form>
      {error && <p className="text-xs font-bold text-re-rojo">{error}</p>}
    </div>
  );
}

function ActaExtra({ matchId }) {
  const [tab, setTab] = useState('goles');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const { detail, setDetail, players, loading, error, reload } = useMatchActa(matchId, tab);
  const stats = detail?.stats || [];

  const handleScrape = async () => {
    if (!window.confirm('¿Scrapear acta FFM de este partido? Se importarán convocados, goles y tarjetas desde la federación.')) return;
    setScrapeLoading(true);
    setScrapeMsg('');
    setScrapeError('');
    try {
      const res = await scrapeMatchActa(matchId);
      setScrapeMsg(`Acta importada: ${res.actasProcessed} acta, ${res.callupsCreated} convocados, ${res.goalsCreated} goles`);
      await reload();
    } catch (err) {
      setScrapeError(err.message || 'Error al scrapear el acta');
    } finally {
      setScrapeLoading(false);
    }
  };

  const TABS = [
    { id: 'convocados', label: 'Convocados' },
    { id: 'goles', label: 'Goleadores' },
    { id: 'tarjetas', label: 'Tarjetas' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-re-dorado/30 bg-re-dorado/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-re-dorado">Acta FFM</p>
          <button
            onClick={handleScrape}
            disabled={scrapeLoading}
            className="rounded-xl border border-re-dorado/40 bg-re-dorado/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-re-dorado hover:bg-re-dorado hover:text-white disabled:opacity-50 transition-all"
          >
            {scrapeLoading ? 'Scrapeando acta…' : 'Scrapear acta de este partido'}
          </button>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground">
          Importa convocados, goles y tarjetas desde la federación para este partido.
        </p>
        {scrapeMsg && (
          <p className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            {scrapeMsg}
          </p>
        )}
        {scrapeError && <p className="text-[11px] font-bold text-re-rojo">{scrapeError}</p>}
      </div>

      <div className="flex gap-2 border-b border-card-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-2 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === item.id ? 'border-re-rojo text-re-rojo' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(loading || error) && (
        <div>{loading ? <LoadingState label="Cargando acta…" /> : <p className="text-xs font-bold text-re-rojo">{error}</p>}</div>
      )}

      {!loading && !error && (
        <>
          {tab === 'goles' && (
            <GoleadoresSection matchId={matchId} stats={stats} players={players} setDetail={setDetail} loading={loading} />
          )}
          {tab === 'convocados' && (
            <ConvocadosSection matchId={matchId} stats={stats} players={players} setDetail={setDetail} loading={loading} />
          )}
          {tab === 'tarjetas' && (
            <TarjetasSection matchId={matchId} stats={stats} players={players} setDetail={setDetail} loading={loading} />
          )}
        </>
      )}
    </div>
  );
}

export default function MatchesAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const crud = useCrud({
    fetchPage: getMatches,
    createItem: createMatch,
    updateItem: updateMatch,
    deleteItem: deleteMatch,
    pageSize: 1000,
    sortBy: 'date',
    direction: 'desc',
  });

  useEffect(() => {
    Promise.all([getCompetitions({ size: 200 }), getSeasons({ size: 100, sortBy: 'name', direction: 'desc' })])
      .then(([competitionData, seasonData]) => {
        setCompetitions(toPage(competitionData).content);
        const seasonList = toPage(seasonData).content;
        setSeasons(seasonList);
        const current = seasonList.find((season) => season.current) || seasonList[0];
        if (current) setSelectedSeasonId(String(current.id));
      })
      .catch(() => {
        setCompetitions([]);
        setSeasons([]);
      });
  }, []);

  const fields = [
    { name: 'rival', label: 'Rival', type: 'text', required: true, placeholder: 'Ej. C.D. Rivales' },
    {
      name: 'home',
      label: 'Jugamos como',
      type: 'select',
      required: true,
      default: 'true',
      options: [
        { value: 'true', label: 'Local' },
        { value: 'false', label: 'Visitante' },
      ],
    },
    { name: 'date', label: 'Fecha', type: 'date' },
    { name: 'time', label: 'Hora', type: 'combobox', placeholder: 'Ej. 19:30', options: TIME_OPTIONS },
    { name: 'location', label: 'Sede', type: 'text', placeholder: 'Ej. Polideportivo Municipal' },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      default: 'SCHEDULED',
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'competitionId',
      label: 'Competición',
      type: 'select',
      required: true,
      options: competitions.map((competition) => ({
        value: String(competition.id),
        label: `${competition.name}${competition.seasonName ? ` — ${competition.seasonName}` : ''}`,
      })),
    },
    { name: 'ourGoals', label: 'Nuestros goles', type: 'number', min: 0 },
    { name: 'rivalGoals', label: 'Goles del rival', type: 'number', min: 0 },
    { name: 'jornada', label: 'Jornada', type: 'number', min: 1, placeholder: 'Solo ligas' },
    {
      name: 'phase',
      label: 'Fase',
      type: 'select',
      section: 'Copa (grupo y eliminatorias)',
      options: [{ value: '', label: 'Liga / sin fase' }, ...MATCH_PHASE_OPTIONS],
    },
    { name: 'groupName', label: 'Grupo', type: 'text', section: 'Copa (grupo y eliminatorias)', placeholder: 'Ej. Grupo 3' },
  ];

  const competitionSeasonById = new Map(
    competitions.map((competition) => [String(competition.id), String(competition.seasonId ?? '')]),
  );
  const seasonRows = (selectedSeasonId
    ? crud.rows.filter(
        (row) => String(row.seasonId ?? competitionSeasonById.get(String(row.competitionId)) ?? '') === selectedSeasonId,
      )
    : crud.rows
  ).slice().sort((a, b) => {
    const competitionA = a.competitionName || '';
    const competitionB = b.competitionName || '';
    if (competitionA !== competitionB) return competitionA.localeCompare(competitionB, 'es');
    const jornadaA = a.jornada ?? Number.POSITIVE_INFINITY;
    const jornadaB = b.jornada ?? Number.POSITIVE_INFINITY;
    if (jornadaA !== jornadaB) return jornadaA - jornadaB;
    const timeA = a.date ? new Date(a.date).getTime() : NaN;
    const timeB = b.date ? new Date(b.date).getTime() : NaN;
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
    if (Number.isNaN(timeA)) return 1;
    if (Number.isNaN(timeB)) return -1;
    return timeA - timeB;
  });

  const columns = [
    { key: 'rival', label: 'Rival', className: 'min-w-[160px]', render: (value) => (
      <span className="font-black text-[15px] leading-none tracking-tight">{value}</span>
    ) },
    { key: 'homeLabel', label: 'Campo', className: 'w-14', render: (_, row) => (
      <span className={`inline-flex w-9 h-9 items-center justify-center rounded-xl text-[11px] font-black text-white ${row.home ? 'bg-emerald-500' : 'bg-blue-500'}`}>
        {row.home ? 'L' : 'V'}
      </span>
    ) },
    { key: 'date', label: 'Fecha', className: 'w-28', render: (value) => (
      value
        ? <span className="text-[13px] font-bold text-foreground">{formatDate(value)}</span>
        : <span className="text-muted-foreground">—</span>
    ) },
    { key: 'jornada', label: 'J', className: 'w-12', render: (value) => (
      value != null ? value : <span className="text-muted-foreground">—</span>
    ) },
    { key: 'phase', label: 'Fase', className: 'w-32', render: (value) => (
      value
        ? <Badge variant="blue">{MATCH_PHASE_LABELS[value] || value}</Badge>
        : <span className="text-muted-foreground">—</span>
    ) },
    { key: 'status', label: 'Estado', className: 'w-28', render: (value) => (
      <Badge variant={value === 'FINISHED' ? 'green' : value === 'POSTPONED' ? 'yellow' : value === 'IN_PROGRESS' ? 'blue' : 'red'}>
        {STATUS_LABELS[value] || value}
      </Badge>
    ) },
    { key: 'score', label: 'Resultado', className: 'w-24 text-center', render: (_, row) => (
      row.status === 'FINISHED' && row.ourGoals != null && row.rivalGoals != null
        ? <span className={`font-black text-[18px] leading-none ${scoreTextClass(getMatchOutcome(row.ourGoals, row.rivalGoals))}`}>{row.ourGoals}-{row.rivalGoals}</span>
        : <span className="text-muted-foreground font-bold text-sm">—</span>
    ) },
  ];

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = useCallback((row) => {
    rememberAdminMatch(row);
    const [datePart = '', timePart = ''] = String(row.date ?? '').split('T');
    setEditing({
      ...row,
      competitionId: String(row.competitionId ?? ''),
      home: String(row.home ?? true),
      date: datePart,
      time: timePart ? timePart.slice(0, 5) : '',
    });
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || crud.loading || modalOpen) return;
    const row = crud.rows.find((item) => String(item.id) === String(editId));
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleOpenEdit(row);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, crud.loading, crud.rows, modalOpen, setSearchParams, handleOpenEdit]);

  const handleSubmit = async (values) => {
    const time = normalizeTime(values.time);
    const { time: _ignored, ...rest } = values;
    const payload = {
      ...rest,
      home: values.home === true || values.home === 'true',
      location: values.location?.trim() ? values.location.trim() : null,
      date: values.date ? `${values.date}T${time || '00:00'}:00` : null,
      competitionId: Number(values.competitionId),
      jornada: values.jornada ? Number(values.jornada) : null,
      phase: values.phase || null,
      groupName: values.groupName?.trim() ? values.groupName.trim() : null,
    };
    await crud.save(payload, editing?.id);
    setModalOpen(false);
  };

  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} partidos seleccionados? También se eliminarán sus datos asociados.`)) return;
    try {
      await crud.bulkRemove(selected.map((row) => row.id));
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todos los partidos');
      await crud.load(crud.page);
    }
  };

  return (
    <div>
      <PageHeader
        title="Partidos"
        subtitle="Gestiona el calendario, el acta y los goleadores."
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label className="sr-only" htmlFor="matches-season-filter">Temporada</label>
            <select
              id="matches-season-filter"
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="bg-card-bg border border-card-border rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
            <button
              onClick={handleOpenCreate}
              className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
            >
              + Nuevo partido
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={seasonRows}
        loading={crud.loading}
        error={crud.error}
        page={crud.page}
        totalPages={crud.totalPages}
        totalElements={seasonRows.length}
        onPageChange={crud.load}
        onRowClick={handleOpenEdit}
        onEdit={handleOpenEdit}
        onDelete={setDeleteTarget}
        onBulkDelete={handleBulkDelete}
        searchKeys={['rival', 'location', 'competitionName', 'status']}
        groupBy="competitionName"
        groupLabel={(competitionName) => competitionName || 'Sin competición'}
        emptyMessage="Todavía no hay partidos en esta temporada."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar partido' : 'Nuevo partido'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        extra={editing?.id ? <ActaExtra matchId={editing.id} /> : null}
        onDelete={editing?.id ? () => setDeleteTarget(editing) : undefined}
        deleteLabel="Borrar partido y todos sus datos"
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar partido?"
        message={`Se eliminará el partido contra "${deleteTarget?.rival}" de forma permanente, incluyendo goles, convocados y estadísticas.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
