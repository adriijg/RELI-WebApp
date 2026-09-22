import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import {
  createCompetition,
  deleteCompetition,
  getCompetitions,
  getSeasons,
  toPage,
  updateCompetition,
} from '../../services/api';

export default function CompetitionsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [seasons, setSeasons] = useState([]);

  const crud = useCrud({
    fetchPage: getCompetitions,
    createItem: createCompetition,
    updateItem: updateCompetition,
    deleteItem: deleteCompetition,
    sortBy: 'name',
    direction: 'asc',
  });

  useEffect(() => {
    getSeasons({ size: 100 })
      .then((data) => setSeasons(toPage(data).content))
      .catch(() => setSeasons([]));
  }, []);

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. Liga Nacional' },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'LIGA', label: 'Liga' },
        { value: 'COPA', label: 'Copa' },
      ],
    },
    {
      name: 'seasonId',
      label: 'Temporada',
      type: 'select',
      required: true,
      options: seasons.map((s) => ({ value: String(s.id), label: s.name })),
    },
    { name: 'ffmCompeticion', label: 'FFM Competición', type: 'text', placeholder: 'Ej. 324545' },
    { name: 'ffmGrupo', label: 'FFM Grupo', type: 'text', placeholder: 'Ej. 324568' },
    { name: 'ffmTemporada', label: 'FFM Temporada', type: 'text', placeholder: 'Ej. 22' },
    { name: 'ffmOurCode', label: 'FFM Código equipo', type: 'text', placeholder: 'Ej. 320143' },
  ];

  const columns = [
    { key: 'name', label: 'Competición' },
    { key: 'type', label: 'Tipo' },
    { key: 'seasonName', label: 'Temporada' },
    {
      key: 'ffmCompeticion',
      label: 'FFM',
      render: (v) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted/10 text-muted-foreground'}`}>
          {v ? 'Sincroniza' : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Competiciones"
        subtitle="Ligas y torneos donde compite el equipo, ligados a cada temporada."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva competición
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
          setEditing({ ...row, seasonId: String(row.seasonId ?? '') });
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        searchKeys={['name', 'type', 'seasonName']}
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
        open={Boolean(deleteTarget)}
        title="¿Borrar competición?"
        message={`Se eliminará "${deleteTarget?.name}" de forma permanente.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
