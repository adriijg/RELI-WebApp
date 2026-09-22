import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createMatch, deleteMatch, getCompetitions, getMatches, toPage, updateMatch } from '../../services/api';
import { STATUS_LABELS } from '../../constants/matchStatus';

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let mins = 7 * 60; mins <= 22 * 60; mins += 30) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
  }
  return opts;
})();

const normalizeTime = (time) => {
  if (!time || !time.trim()) return '';
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error('La hora debe tener el formato HH:MM (ej. 19:30)');
  }
  const hh = match[1].padStart(2, '0');
  if (Number(hh) > 23 || Number(match[2]) > 59) {
    throw new Error('La hora introducida no es válida');
  }
  return `${hh}:${match[2]}`;
};

export default function MatchesAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [competitions, setCompetitions] = useState([]);

  const crud = useCrud({
    fetchPage: getMatches,
    createItem: createMatch,
    updateItem: updateMatch,
    deleteItem: deleteMatch,
    pageSize: 1000,
    sortBy: 'date',
    direction: 'desc',
  });

  useEffect(() => {
    getCompetitions({ size: 100 })
      .then((data) => setCompetitions(toPage(data).content))
      .catch(() => setCompetitions([]));
  }, []);

  const fields = [
    { name: 'rival', label: 'Rival', type: 'text', required: true, placeholder: 'Ej. C.D. Rivales' },
    {
      name: 'home',
      label: 'Jugamos como',
      type: 'select',
      required: true,
      default: 'true',
      options: [
        { value: 'true', label: 'Local' },
        { value: 'false', label: 'Visitante' },
      ],
    },
    { name: 'date', label: 'Fecha', type: 'date' },
    {
      name: 'time',
      label: 'Hora',
      type: 'combobox',
      placeholder: 'Ej. 19:30',
      options: TIME_OPTIONS,
    },
    { name: 'location', label: 'Sede', type: 'text', placeholder: 'Ej. Polideportivo Municipal' },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      default: 'SCHEDULED',
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'competitionId',
      label: 'Competición',
      type: 'select',
      required: true,
      options: competitions.map((c) => ({ value: String(c.id), label: c.name })),
    },
    { name: 'ourGoals', label: 'Nuestros goles', type: 'number', min: 0 },
    { name: 'rivalGoals', label: 'Goles del rival', type: 'number', min: 0 },
    { name: 'jornada', label: 'Jornada', type: 'number', min: 1, placeholder: 'Solo ligas' },
  ];

  const columns = [
    {
      key: 'homeLabel',
      label: 'Campo',
      render: (_, row) => (
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${row.home ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
          {row.home ? 'L' : 'V'}
        </span>
      ),
    },
    { key: 'rival', label: 'Rival' },
    { key: 'date', label: 'Fecha' },
    {
      key: 'status',
      label: 'Estado',
      className: 'hidden sm:table-cell',
      render: (v) => (
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
          v === 'FINISHED'
            ? 'bg-emerald-500/15 text-emerald-500'
            : v === 'POSTPONED'
            ? 'bg-orange-500/15 text-orange-500'
            : v === 'IN_PROGRESS'
            ? 'bg-blue-500/15 text-blue-500'
            : 'bg-re-rojo/15 text-re-rojo'
        }`}>
          {STATUS_LABELS[v] || v}
        </span>
      ),
    },
    {
      key: 'score',
      label: 'Resultado',
      render: (_, row) =>
        row.status === 'FINISHED' && row.ourGoals != null && row.rivalGoals != null ? (
          <span className="font-black text-re-dorado">{row.ourGoals}-{row.rivalGoals}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'competitionName',
      label: 'Competición',
      className: 'hidden md:table-cell',
    },
    {
      key: 'jornada',
      label: 'J.',
      className: 'hidden lg:table-cell',
      render: (v) => v ? <span className="font-bold">{v}</span> : <span className="text-muted-foreground">—</span>,
    },
  ];

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (row) => {
    const [datePart = '', timePart = ''] = String(row.date ?? '').split('T');
    setEditing({
      ...row,
      competitionId: String(row.competitionId ?? ''),
      home: String(row.home ?? true),
      date: datePart,
      time: timePart ? timePart.slice(0, 5) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    const time = normalizeTime(values.time);
    const { time: _ignored, ...rest } = values;
    const payload = {
      ...rest,
      home: values.home === true || values.home === 'true',
      location: values.location?.trim() ? values.location.trim() : null,
      date: values.date ? `${values.date}T${time || '00:00'}:00` : null,
      competitionId: Number(values.competitionId),
      jornada: values.jornada ? Number(values.jornada) : null,
    };
    await crud.save(payload, editing?.id);
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Partidos"
        subtitle="Crea, edita resultados y organiza el calendario del primer equipo."
        action={
          <button
            onClick={handleOpenCreate}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nuevo partido
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
        onEdit={handleOpenEdit}
        onDelete={setDeleteTarget}
        searchKeys={['rival', 'location', 'competitionName', 'status', 'homeLabel']}
        emptyMessage="Todavía no hay partidos. ¡Crea el primero!"
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar partido' : 'Nuevo partido'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar partido?"
        message={`Se eliminará el partido contra "${deleteTarget?.rival}" de forma permanente.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
