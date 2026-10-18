import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { useSeasons } from '../../hooks/useSeasons';
import {
  createStat,
  deleteStat,
  getStats,
  updateStat,
  getCompetitions,
  getMatchesByCompetition,
  getPlayerSeasonStats,
  toPage,
} from '../../services/api';

const STAT_FIELDS = [
  { name: 'goals', label: 'Goles', type: 'number', required: true, default: 0, min: 0 },
  { name: 'assists', label: 'Asistencias', type: 'number', required: true, default: 0, min: 0 },
  { name: 'yellowCards', label: 'Amarillas', type: 'number', required: true, default: 0, min: 0 },
  { name: 'redCards', label: 'Rojas', type: 'number', required: true, default: 0, min: 0 },
  { name: 'mvp', label: 'MVP', type: 'checkbox', checkboxLabel: 'Fue MVP del partido', default: false },
  { name: 'attended', label: 'Asistencia', type: 'checkbox', checkboxLabel: 'Asistió al partido', default: true },
];

const COLUMNS = [
  { key: 'playerName', label: 'Jugador' },
  { key: 'matchRival', label: 'Rival' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asist.' },
  { key: 'yellowCards', label: 'Amar.' },
  { key: 'redCards', label: 'Rojas' },
  { key: 'mvp', label: 'MVP', render: (value) => (value ? <Badge variant="gold">MVP</Badge> : '—') },
  { key: 'attended', label: 'Asistió', render: (value) => (value ? 'Sí' : 'No') },
];

export default function StatsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);
  const [seasonId, setSeasonId] = useState('');
  const [playerOptions, setPlayerOptions] = useState([]);
  const [matchOptions, setMatchOptions] = useState([]);

  const { seasons, currentSeason } = useSeasons();
  const selectedSeasonId = seasonId || (currentSeason ? String(currentSeason.id) : '');
  const selectedSeason = seasons.find((season) => String(season.id) === selectedSeasonId);

  const fetchStats = useCallback(
    (params) => getStats({ ...params, seasonId: selectedSeasonId || undefined }),
    [selectedSeasonId],
  );

  const crud = useCrud({
    fetchPage: fetchStats,
    createItem: createStat,
    updateItem: updateStat,
    deleteItem: deleteStat,
    pageSize: 20,
    sortBy: 'id',
    direction: 'desc',
    serverSearch: true,
    autoLoad: Boolean(selectedSeasonId),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedSeasonId) {
        setPlayerOptions([]);
        setMatchOptions([]);
        return;
      }
      try {
        const [statsPlayers, competitions] = await Promise.all([
          getPlayerSeasonStats({ seasonId: selectedSeasonId }),
          getCompetitions({ size: 200 }),
        ]);
        const seasonCompetitions = toPage(competitions).content.filter(
          (competition) => String(competition.seasonId) === String(selectedSeasonId),
        );
        const matchLists = await Promise.all(
          seasonCompetitions.map((competition) => getMatchesByCompetition(competition.id)),
        );
        const matches = matchLists.flat().filter(Boolean);
        matches.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        if (cancelled) return;
        setPlayerOptions(
          statsPlayers.map((player) => ({
            value: String(player.playerId),
            label: `#${player.jerseyNumber} ${player.name}`,
          })),
        );
        setMatchOptions(
          matches.map((match) => ({
            value: String(match.id),
            label: `${match.rival}${match.jornada ? ` · J${match.jornada}` : ''}${
              match.date ? ` (${new Date(match.date).toLocaleDateString('es-ES')})` : ''
            }`,
          })),
        );
      } catch {
        if (!cancelled) {
          setPlayerOptions([]);
          setMatchOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSeasonId]);

  const fields = useMemo(
    () => [
      { name: 'playerId', label: 'Jugador', type: 'select', required: true, options: playerOptions },
      { name: 'matchId', label: 'Partido', type: 'select', required: true, options: matchOptions },
      ...STAT_FIELDS,
    ],
    [playerOptions, matchOptions],
  );

  const confirmDelete = async () => {
    if (bulkTarget) {
      await crud.bulkRemove(bulkTarget.map((row) => row.id));
      setBulkTarget(null);
    } else {
      await crud.remove(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        subtitle="Registro de rendimiento por jugador y partido. Se rellena importando el acta de cada partido."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            disabled={!selectedSeasonId}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            + Nueva estadística
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 bg-card-bg border border-card-border rounded-2xl px-4 py-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-re-dorado">Temporada</label>
        <select
          value={selectedSeasonId}
          onChange={(event) => setSeasonId(event.target.value)}
          className="rounded-xl border border-card-border bg-muted/30 px-4 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-re-rojo/40 hover:border-re-rojo/40 transition-all cursor-pointer"
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
              {season.current ? ' · actual' : ''}
            </option>
          ))}
        </select>
        <span className="text-[11px] font-bold text-muted-foreground">{selectedSeason?.name || ''}</span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={crud.rows}
        loading={crud.loading}
        error={crud.error}
        page={crud.page}
        totalPages={crud.totalPages}
        totalElements={crud.totalElements}
        onPageChange={crud.load}
        serverSearch
        searchValue={crud.search}
        onSearchChange={crud.setSearch}
        onEdit={(row) => {
          setEditing({ ...row, playerId: String(row.playerId ?? ''), matchId: String(row.matchId ?? '') });
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        onBulkDelete={setBulkTarget}
        emptyMessage={selectedSeasonId ? 'Sin estadísticas para esta temporada.' : 'Selecciona una temporada.'}
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar estadística' : 'Nueva estadística'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            playerId: Number(values.playerId),
            matchId: Number(values.matchId),
            goals: Number(values.goals),
            assists: Number(values.assists),
            yellowCards: Number(values.yellowCards),
            redCards: Number(values.redCards),
            mvp: Boolean(values.mvp),
            attended: Boolean(values.attended),
          };
          await crud.save(payload, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget || bulkTarget)}
        title={bulkTarget ? '¿Borrar estadísticas seleccionadas?' : '¿Borrar estadística?'}
        message={
          bulkTarget
            ? `Se eliminarán ${bulkTarget.length} registros de forma permanente.`
            : `Se eliminará el registro de ${deleteTarget?.playerName} contra ${deleteTarget?.matchRival}.`
        }
        onClose={() => {
          setDeleteTarget(null);
          setBulkTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
