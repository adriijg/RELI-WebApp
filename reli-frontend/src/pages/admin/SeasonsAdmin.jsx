import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createSeason, deleteSeason, getSeasons, updateSeason } from '../../services/api';

export default function SeasonsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const crud = useCrud({
    fetchPage: getSeasons,
    createItem: createSeason,
    updateItem: updateSeason,
    deleteItem: deleteSeason,
    sortBy: 'name',
    direction: 'desc',
  });
  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} temporadas seleccionadas? Esta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(selected.map((row) => deleteSeason(row.id)));
      await crud.load(crud.page);
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todas las temporadas');
      await crud.load(crud.page);
    }
  };

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. 2026/27' },
    {
      name: 'current',
      label: 'Temporada actual',
      type: 'checkbox',
      checkboxLabel: 'Marcar como temporada en curso',
      default: false,
    },
  ];

  const columns = [
    { key: 'name', label: 'Temporada' },
    {
      key: 'current',
      label: 'Actual',
      render: (v) =>
        v ? (
          <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-500">
            En curso
          </span>
        ) : (
          <span className="text-muted-foreground text-[10px] font-bold uppercase">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Temporadas"
        subtitle="Bloques anuales a los que se enganchan las competiciones."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva temporada
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
        onBulkDelete={handleBulkDelete}
        searchKeys={['name']}
        emptyMessage="No hay temporadas creadas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar temporada' : 'Nueva temporada'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await crud.save(values, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar temporada?"
        message={`Se eliminará "${deleteTarget?.name}". Las competiciones asociadas pueden verse afectadas.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
