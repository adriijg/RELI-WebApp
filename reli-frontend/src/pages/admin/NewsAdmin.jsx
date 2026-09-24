import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../services/api';

const TYPE_LABELS = {
  INFO: 'Info',
  TRAINING: 'Entrenamiento',
  SOCIAL: 'Social',
  MEETING: 'Reunión',
};

export default function NewsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const crud = useCrud({
    fetchPage: getEvents,
    createItem: createEvent,
    updateItem: updateEvent,
    deleteItem: deleteEvent,
    sortBy: 'date',
    direction: 'desc',
  });
  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} noticias seleccionadas? Esta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(selected.map((row) => deleteEvent(row.id)));
      await crud.load(crud.page);
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todas las noticias');
      await crud.load(crud.page);
    }
  };

  const fields = [
    { name: 'title', label: 'Título', type: 'text', required: true, fullWidth: true, placeholder: 'Titular de la noticia' },
    { name: 'date', label: 'Fecha de publicación', type: 'datetime-local', required: true },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      default: 'INFO',
      options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'location', label: 'Ubicación (opcional)', type: 'text', placeholder: 'Ej. Campo Municipal' },
    { name: 'imageUrl', label: 'Imagen', type: 'image', fullWidth: true, placeholder: 'https://...' },
    {
      name: 'description',
      label: 'Contenido',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Cuerpo de la noticia...',
    },
  ];

  const columns = [
    { key: 'title', label: 'Título' },
    { key: 'date', label: 'Fecha' },
    {
      key: 'type',
      label: 'Tipo',
      render: (v) => (
        <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-re-dorado/15 text-re-dorado">
          {TYPE_LABELS[v] || v}
        </span>
      ),
    },
    { key: 'location', label: 'Ubicación' },
    { key: 'createdByUsername', label: 'Autor' },
  ];

  return (
    <div>
      <PageHeader
        title="Noticias"
        subtitle="Publica y administra las novedades que aparecen en la portada de la web."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva noticia
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
        searchKeys={['title', 'description', 'location', 'type']}
        emptyMessage="No hay noticias publicadas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar noticia' : 'Nueva noticia'}
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
        title="¿Borrar noticia?"
        message={`Se eliminará "${deleteTarget?.title}" de forma permanente.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
