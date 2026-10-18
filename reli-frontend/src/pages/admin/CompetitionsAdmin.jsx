import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { useSeasons } from '../../hooks/useSeasons';
import { createCompetition, deleteCompetition, getCompetitions, updateCompetition } from '../../services/api';
import { COMPETITION_TYPE_LABELS, COMPETITION_TYPE_OPTIONS } from '../../constants/competitionTypes';

const FFM_SECTION = 'Integración con la FFM (sincronización)';

const COLUMNS = [
  { key: 'name', label: 'Competición' },
  {
    key: 'type',
    label: 'Tipo',
    render: (value) => <Badge variant="blue">{COMPETITION_TYPE_LABELS[value] || value}</Badge>,
  },
  { key: 'seasonName', label: 'Temporada' },
  {
    key: 'ffmCompeticion',
    label: 'FFM',
    render: (value) => (
      <Badge variant={value ? 'green' : 'slate'}>{value ? 'Sincroniza' : 'Sin configurar'}</Badge>
    ),
  },
];

export default function CompetitionsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);
  const { seasons } = useSeasons();

  const crud = useCrud({
    fetchPage: getCompetitions,
    createItem: createCompetition,
    updateItem: updateCompetition,
    deleteItem: deleteCompetition,
    sortBy: 'name',
    direction: 'asc',
    serverSearch: true,
  });

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. Liga Nacional' },
    { name: 'type', label: 'Tipo', type: 'select', required: true, options: COMPETITION_TYPE_OPTIONS },
    {
      name: 'seasonId',
      label: 'Temporada',
      type: 'select',
      required: true,
      options: seasons.map((season) => ({ value: String(season.id), label: season.name })),
    },
    { name: 'ffmCompeticion', label: 'FFM Competición', type: 'text', section: FFM_SECTION, placeholder: 'Ej. 324545' },
    { name: 'ffmGrupo', label: 'FFM Grupo', type: 'text', placeholder: 'Ej. 324568' },
    { name: 'ffmTemporada', label: 'FFM Temporada', type: 'text', placeholder: 'Ej. 22' },
    { name: 'ffmOurCode', label: 'FFM Código equipo', type: 'text', placeholder: 'Ej. 320143' },
  ];

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing({ ...row, seasonId: String(row.seasonId ?? '') });
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
        title="Competiciones"
        subtitle="Ligas y torneos donde compite el equipo, ligados a cada temporada."
        action={
          <button
            onClick={openCreate}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva competición
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
        emptyMessage="No hay competiciones creadas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar competición' : 'Nueva competición'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await crud.save({ ...values, seasonId: Number(values.seasonId) }, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget || bulkTarget)}
        title={bulkTarget ? '¿Borrar competiciones seleccionadas?' : '¿Borrar competición?'}
        message={
          bulkTarget
            ? `Se eliminarán ${bulkTarget.length} competiciones de forma permanente.`
            : `Se eliminará "${deleteTarget?.name}" de forma permanente.`
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
