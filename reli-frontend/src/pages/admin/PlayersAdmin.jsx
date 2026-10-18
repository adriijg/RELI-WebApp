import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { useSeasons } from '../../hooks/useSeasons';
import {
  createPlayer,
  deletePlayer,
  getPlayers,
  updatePlayer,
  getRosterBySeason,
  assignPlayerToSeason,
  unassignPlayerFromSeason,
} from '../../services/api';
import { POSITION_OPTIONS, POSITION_LABELS } from '../../constants/positions';

const FIELDS = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'nickname', label: 'Apodo', type: 'text', placeholder: 'Opcional' },
  { name: 'surnames', label: 'Apellidos', type: 'text', placeholder: 'Opcional', fullWidth: true },
  { name: 'jerseyNumber', label: 'Dorsal (1-99)', type: 'number', required: true, min: 1, max: 99 },
  { name: 'position', label: 'Posición', type: 'select', required: true, options: POSITION_OPTIONS },
  { name: 'photoUrl', label: 'Foto', type: 'image', required: true, fullWidth: true, placeholder: 'https://...' },
];

export default function PlayersAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);
  const [seasonId, setSeasonId] = useState('');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');

  const { seasons, currentSeason } = useSeasons();
  const selectedSeasonId = seasonId || (currentSeason ? String(currentSeason.id) : '');
  const selectedSeason = seasons.find((season) => String(season.id) === selectedSeasonId);

  const crud = useCrud({
    fetchPage: getPlayers,
    createItem: createPlayer,
    updateItem: updatePlayer,
    deleteItem: deletePlayer,
    sortBy: 'name',
    direction: 'asc',
    serverSearch: true,
  });

  const loadRoster = useCallback(async (sid) => {
    if (!sid) {
      setRoster([]);
      return;
    }
    setRosterLoading(true);
    setRosterError('');
    try {
      const data = await getRosterBySeason(sid);
      setRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      setRosterError(err.message || 'No se pudo cargar la plantilla');
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoster(selectedSeasonId);
  }, [selectedSeasonId, loadRoster]);

  const rosterIds = new Set(roster.map((item) => String(item.playerId)));

  const toggleRoster = async (row) => {
    if (!selectedSeasonId) return;
    try {
      if (rosterIds.has(String(row.id))) {
        await unassignPlayerFromSeason(selectedSeasonId, row.id);
      } else {
        await assignPlayerToSeason({
          seasonId: Number(selectedSeasonId),
          playerId: row.id,
          jerseyNumber: row.jerseyNumber,
        });
      }
      await loadRoster(selectedSeasonId);
    } catch (err) {
      alert(err.message || 'Error al actualizar la plantilla');
    }
  };

  const confirmDelete = async () => {
    if (bulkTarget) {
      await crud.bulkRemove(bulkTarget.map((row) => row.id));
      setBulkTarget(null);
    } else {
      await crud.remove(deleteTarget.id);
      setDeleteTarget(null);
    }
    if (selectedSeasonId) loadRoster(selectedSeasonId);
  };

  const columns = [
    {
      key: 'jerseyNumber',
      label: 'Dorsal',
      render: (value) => (
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-re-rojo text-white font-black text-sm">
          {value}
        </span>
      ),
    },
    { key: 'name', label: 'Nombre' },
    { key: 'surnames', label: 'Apellidos' },
    { key: 'nickname', label: 'Apodo' },
    {
      key: 'position',
      label: 'Posición',
      render: (value) => <Badge>{POSITION_LABELS[value] || value}</Badge>,
    },
    {
      key: 'active',
      label: 'Estado',
      render: (value) => (
        <Badge variant={value ? 'green' : 'slate'}>{value ? 'Activo' : 'Baja'}</Badge>
      ),
    },
    {
      key: '__roster',
      label: 'Plantilla',
      render: (_, row) => {
        const inRoster = rosterIds.has(String(row.id));
        return (
          <button
            type="button"
            onClick={() => toggleRoster(row)}
            disabled={rosterLoading || !selectedSeasonId}
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${
              inRoster
                ? 'bg-re-rojo text-white border-re-rojo'
                : 'bg-card-bg text-foreground/60 border-card-border hover:border-re-rojo/50'
            }`}
          >
            {inRoster ? 'En plantilla ✓' : '+ Asignar'}
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Jugadores"
        subtitle="Plantilla del primer equipo: fichas, dorsales y altas/bajas por temporada."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nuevo jugador
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
        <span className="text-[11px] font-bold text-muted-foreground">
          {rosterLoading ? 'Cargando...' : `${roster.length} en plantilla`}
          {selectedSeason ? ` · ${selectedSeason.name}` : ''}
        </span>
        {rosterError && <span className="text-[11px] font-bold text-re-rojo">{rosterError}</span>}
      </div>

      <DataTable
        columns={columns}
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
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        onBulkDelete={setBulkTarget}
        emptyMessage="La plantilla está vacía."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar jugador' : 'Nuevo jugador'}
        fields={FIELDS}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const payload = { ...values, jerseyNumber: Number(values.jerseyNumber) };
          await crud.save(payload, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget || bulkTarget)}
        title={bulkTarget ? '¿Dar de baja a los seleccionados?' : '¿Dar de baja?'}
        message={
          bulkTarget
            ? `${bulkTarget.length} jugadores dejarán de aparecer en la plantilla (baja lógica).`
            : `${deleteTarget?.name} dejará de aparecer en la plantilla (baja lógica).`
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
