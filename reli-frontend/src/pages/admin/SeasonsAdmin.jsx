import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { createSeason, deleteSeason, getSeasons, updateSeason } from '../../services/api';

const FIELDS = [
  { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. 2026/27' },
  {
    name: 'current',
    label: 'Temporada actual',
    type: 'checkbox',
    checkboxLabel: 'Marcar como temporada en curso',
    default: false,
  },
];

const COLUMNS = [
  { key: 'name', label: 'Temporada' },
  {
    key: 'current',
    label: 'Actual',
    render: (value) => (value ? <Badge variant="green">En curso</Badge> : <Badge>—</Badge>),
  },
];

export default function SeasonsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);

  const crud = useCrud({
    fetchPage: getSeasons,
    createItem: createSeason,
    updateItem: updateSeason,
    deleteItem: deleteSeason,
    sortBy: 'name',
    direction: 'desc',
    serverSearch: true,
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

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
        title="Temporadas"
        subtitle="Bloques anuales a los que se enganchan las competiciones."
        action={
          <button
            onClick={openCreate}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva temporada
          </button>
        }
      />

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
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onBulkDelete={setBulkTarget}
        emptyMessage="No hay temporadas creadas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar temporada' : 'Nueva temporada'}
        fields={FIELDS}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await crud.save(values, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget || bulkTarget)}
        title={bulkTarget ? '¿Borrar temporadas seleccionadas?' : '¿Borrar temporada?'}
        message={
          bulkTarget
            ? `Se eliminarán ${bulkTarget.length} temporadas. Las competiciones asociadas pueden verse afectadas.`
            : `Se eliminará "${deleteTarget?.name}". Las competiciones asociadas pueden verse afectadas.`
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
