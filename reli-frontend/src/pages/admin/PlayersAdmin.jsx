import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createPlayer, deletePlayer, getPlayers, updatePlayer } from '../../services/api';
import { POSITION_OPTIONS } from '../../constants/positions';

export default function PlayersAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const crud = useCrud({
    fetchPage: getPlayers,
    createItem: createPlayer,
    updateItem: updatePlayer,
    deleteItem: deletePlayer,
    sortBy: 'name',
    direction: 'asc',
  });

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'nickname', label: 'Apodo', type: 'text', placeholder: 'Opcional' },
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
  ];

  return (
    <div>
      <PageHeader
        title="Jugadores"
        subtitle="Plantilla del primer equipo: fichas, dorsales y altas/bajas."
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
        searchKeys={['name', 'nickname', 'position']}
        emptyMessage="La plantilla está vacía."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar jugador' : 'Nuevo jugador'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await crud.save({ ...values, jerseyNumber: Number(values.jerseyNumber) }, editing?.id);
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
        }}
      />
    </div>
  );
}
