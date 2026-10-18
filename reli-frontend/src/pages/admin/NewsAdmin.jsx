import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../services/api';
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS } from '../../constants/eventTypes';

const FIELDS = [
  { name: 'title', label: 'Título', type: 'text', required: true, fullWidth: true, placeholder: 'Titular de la noticia' },
  { name: 'date', label: 'Fecha de publicación', type: 'datetime-local', required: true },
  { name: 'type', label: 'Tipo', type: 'select', required: true, default: 'INFO', options: EVENT_TYPE_OPTIONS },
  { name: 'location', label: 'Ubicación (opcional)', type: 'text', placeholder: 'Ej. Pabellón Municipal' },
  { name: 'imageUrl', label: 'Imagen', type: 'image', fullWidth: true, placeholder: 'https://...' },
  { name: 'description', label: 'Contenido', type: 'textarea', fullWidth: true, placeholder: 'Cuerpo de la noticia...' },
];

const COLUMNS = [
  { key: 'title', label: 'Título' },
  { key: 'date', label: 'Fecha' },
  {
    key: 'type',
    label: 'Tipo',
    render: (value) => <Badge variant="gold">{EVENT_TYPE_LABELS[value] || value}</Badge>,
  },
  { key: 'location', label: 'Ubicación' },
  { key: 'createdByUsername', label: 'Autor' },
];

export default function NewsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);

  const crud = useCrud({
    fetchPage: getEvents,
    createItem: createEvent,
    updateItem: updateEvent,
    deleteItem: deleteEvent,
    sortBy: 'date',
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
        title="Noticias"
        subtitle="Publica y administra las novedades que aparecen en la portada de la web."
        action={
          <button
            onClick={openCreate}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva noticia
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
        emptyMessage="No hay noticias publicadas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar noticia' : 'Nueva noticia'}
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
        title={bulkTarget ? '¿Borrar noticias seleccionadas?' : '¿Borrar noticia?'}
        message={
          bulkTarget
            ? `Se eliminarán ${bulkTarget.length} noticias de forma permanente.`
            : `Se eliminará "${deleteTarget?.title}" de forma permanente.`
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
