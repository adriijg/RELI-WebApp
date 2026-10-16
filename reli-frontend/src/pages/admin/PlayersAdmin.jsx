import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createPlayer, deletePlayer, getPlayers, updatePlayer, getSeasons, getRosterBySeason, assignPlayerToSeason, unassignPlayerFromSeason, toPage } from '../../services/api';
import { POSITION_OPTIONS } from '../../constants/positions';

export default function PlayersAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');

  const crud = useCrud({
    fetchPage: getPlayers,
    createItem: createPlayer,
    updateItem: updatePlayer,
    deleteItem: deletePlayer,
    sortBy: 'name',
    direction: 'asc',
  });
  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} jugadores seleccionados? Esta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(selected.map((row) => deletePlayer(row.id)));
      await crud.load(crud.page);
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todos los jugadores');
      await crud.load(crud.page);
    }
  };

  const loadSeasons = useCallback(async () => {
    try {
      const data = await getSeasons({ size: 100, sortBy: 'name', direction: 'desc' });
      const list = toPage(data).content;
      setSeasons(list);
      const current = list.find((s) => s.current) || list[0];
      if (current) setSelectedSeasonId(String(current.id));
    } catch {
      setSeasons([]);
    }
  }, []);

  const loadRoster = useCallback(async (seasonId) => {
    if (!seasonId) { setRoster([]); return; }
    setRosterLoading(true);
    setRosterError('');
    try {
      const data = await getRosterBySeason(seasonId);
      setRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      setRosterError(err.message || 'No se pudo cargar el roster');
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => { loadSeasons(); }, [loadSeasons]);
  useEffect(() => { if (selectedSeasonId) loadRoster(selectedSeasonId); }, [selectedSeasonId, loadRoster]);

  const rosterIds = new Set(roster.map((r) => String(r.playerId)));

  const toggleRoster = async (row) => {
    if (!selectedSeasonId) return;
    const inRoster = rosterIds.has(String(row.id));
    try {
      if (inRoster) {
        await unassignPlayerFromSeason(selectedSeasonId, row.id);
      } else {
        await assignPlayerToSeason({ seasonId: Number(selectedSeasonId), playerId: row.id, jerseyNumber: row.jerseyNumber });
      }
      await loadRoster(selectedSeasonId);
      // refrescar stats no necesario aquí
    } catch (err) {
      alert(err.message || 'Error al actualizar roster');
    }
  };

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'nickname', label: 'Apodo', type: 'text', placeholder: 'Opcional' },
    { name: 'surnames', label: 'Apellidos', type: 'text', placeholder: 'Opcional', fullWidth: true },
    { name: 'jerseyNumber', label: 'Dorsal (1-99)', type: 'number', required: true, min: 1, max: 99 },
    {
      name: 'position',
      label: 'Posición',
      type: 'select',
      required: true,
      options: POSITION_OPTIONS,
    },
    { name: 'photoUrl', label: 'Foto', type: 'image', required: true, fullWidth: true, placeholder: 'https://...' },
  ];

  const columns = [
    {
      key: 'jerseyNumber',
      label: 'Dorsal',
      render: (v) => (
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-re-rojo text-white font-black text-sm">
          {v}
        </span>
      ),
    },
    { key: 'name', label: 'Nombre' },
    { key: 'surnames', label: 'Apellidos' },
    { key: 'nickname', label: 'Apodo' },
    {
      key: 'position',
      label: 'Posición',
      render: (v) => (
        <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted/20 text-muted-foreground">
          {POSITION_OPTIONS.find((p) => p.value === v)?.label || v}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Estado',
      render: (v) =>
        v ? (
          <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Activo</span>
        ) : (
          <span className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Baja</span>
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
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${inRoster ? 'bg-re-rojo text-white border-re-rojo' : 'bg-card-bg text-foreground/60 border-card-border hover:border-re-rojo/50'}`}
          >
            {inRoster ? 'En plantilla ✓' : '+ Asignar'}
          </button>
        );
      },
    },
  ];

  const selectedSeason = seasons.find((s) => String(s.id) === String(selectedSeasonId));

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
        <select value={selectedSeasonId} onChange={(e) => setSelectedSeasonId(e.target.value)} className="rounded-xl border border-re-dorado/25 bg-black/30 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-re-dorado">
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.current ? ' · actual' : ''}</option>
          ))}
        </select>
        <span className="text-[11px] font-bold text-muted-foreground">{rosterLoading ? 'Cargando...' : `${roster.length} en plantilla`}{selectedSeason ? ` · ${selectedSeason.name}` : ''}</span>
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
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        onBulkDelete={handleBulkDelete}
        searchKeys={['name', 'surnames', 'nickname', 'position']}
        emptyMessage="La plantilla está vacía."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar jugador' : 'Nuevo jugador'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const payload = { ...values, jerseyNumber: Number(values.jerseyNumber) };
          await crud.save(payload, editing?.id);
          if (!editing && selectedSeasonId) {
            // intentar auto-asignar: buscar el jugador recién creado por nombre/dorsal y asignar
            // si falla, el admin puede pulsar "Asignar" en la tabla
            await loadRoster(selectedSeasonId);
          }
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Dar de baja?"
        message={`${deleteTarget?.name} dejará de aparecer en la plantilla (baja lógica).`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
          if (selectedSeasonId) loadRoster(selectedSeasonId);
        }}
      />
    </div>
  );
}
