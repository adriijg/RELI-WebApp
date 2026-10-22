import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useSeasons } from '../../hooks/useSeasons';
import { getCompetitions, getNeutralMatches, saveNeutralMatch, updateNeutralMatch, deleteNeutralMatch, toPage } from '../../services/api';
import { MATCH_PHASE_LABELS, MATCH_PHASE_OPTIONS } from '../../constants/matchPhases';
import { STATUS_LABELS } from '../../constants/matchStatus';

const columns = [
  { key: 'jornada', label: 'J', className: 'w-12', render: (value) => value ?? '-' },
  {
    key: 'phase',
    label: 'Fase',
    className: 'w-32',
    render: (value) => (value ? <Badge variant="blue">{MATCH_PHASE_LABELS[value] || value}</Badge> : '-'),
  },
  { key: 'groupName', label: 'Grupo', className: 'w-20', render: (value) => value || '-' },
  { key: 'homeName', label: 'Local', className: 'min-w-[140px]' },
  {
    key: 'score',
    label: 'Resultado',
    className: 'w-24 text-center',
    render: (_, row) => (
      row.homeGoals != null && row.awayGoals != null
        ? <span className="font-black text-[16px]">{row.homeGoals}-{row.awayGoals}</span>
        : <span className="text-muted-foreground font-bold text-sm">-</span>
    ),
  },
  { key: 'awayName', label: 'Visitante', className: 'min-w-[140px]' },
  {
    key: 'status',
    label: 'Estado',
    className: 'w-28',
    render: (value) => (
      <Badge variant={value === 'FINISHED' ? 'green' : value === 'POSTPONED' ? 'yellow' : value === 'IN_PROGRESS' ? 'blue' : 'red'}>
        {STATUS_LABELS[value] || value}
      </Badge>
    ),
  },
];

const fields = [
  { name: 'jornada', label: 'Jornada', type: 'number', min: 1, required: true, default: 1 },
  {
    name: 'phase',
    label: 'Fase',
    type: 'select',
    default: 'LIGUILLA',
    options: MATCH_PHASE_OPTIONS,
  },
  { name: 'groupName', label: 'Grupo', type: 'text', placeholder: 'Ej. 6' },
  { name: 'homeName', label: 'Equipo local', type: 'text', required: true },
  { name: 'awayName', label: 'Equipo visitante', type: 'text', required: true },
  { name: 'date', label: 'Fecha', type: 'date' },
  { name: 'time', label: 'Hora', type: 'time' },
  { name: 'venue', label: 'Sede', type: 'text', placeholder: 'Ej. Polideportivo Municipal' },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    default: 'FINISHED',
    options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: 'homeGoals', label: 'Goles local', type: 'number', min: 0 },
  { name: 'awayGoals', label: 'Goles visitante', type: 'number', min: 0 },
];

export default function GroupMatchesAdmin() {
  const { seasons, currentSeason } = useSeasons();
  const [competitions, setCompetitions] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getCompetitions({ size: 200, sortBy: 'name', direction: 'asc' })
      .then((data) => setCompetitions(toPage(data).content))
      .catch((err) => setError(err?.message || 'No se pudieron cargar las competiciones'));
  }, []);

  useEffect(() => {
    if (!currentSeason) return;
    setSelectedSeasonId((prev) => prev || String(currentSeason.id));
  }, [currentSeason]);

  const seasonCompetitions = useMemo(
    () => competitions.filter((competition) => String(competition.seasonId) === String(selectedSeasonId)),
    [competitions, selectedSeasonId],
  );

  useEffect(() => {
    if (seasonCompetitions.length === 0) {
      setSelectedCompetitionId('');
      return;
    }
    setSelectedCompetitionId((prev) => (
      seasonCompetitions.some((competition) => String(competition.id) === prev)
        ? prev
        : String((seasonCompetitions.find((competition) => competition.type === 'COPA') || seasonCompetitions[0]).id)
    ));
  }, [seasonCompetitions]);

  const load = useCallback(async () => {
    if (!selectedCompetitionId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getNeutralMatches(selectedCompetitionId);
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        const jornadaA = a.jornada ?? Number.POSITIVE_INFINITY;
        const jornadaB = b.jornada ?? Number.POSITIVE_INFINITY;
        if (jornadaA !== jornadaB) return jornadaA - jornadaB;
        const timeA = a.date ? new Date(a.date).getTime() : NaN;
        const timeB = b.date ? new Date(b.date).getTime() : NaN;
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;
        return timeA - timeB;
      });
      setRows(sorted);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los partidos');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const [datePart = '', timePart = ''] = String(row.date ?? '').split('T');
    setEditing({
      ...row,
      phase: row.phase || '',
      groupName: row.groupName || '',
      date: datePart,
      time: timePart ? timePart.slice(0, 5) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    const payload = {
      id: editing?.id ?? null,
      competitionId: Number(selectedCompetitionId),
      jornada: Number(values.jornada),
      phase: values.phase || null,
      groupName: values.groupName?.trim() || null,
      homeName: values.homeName.trim(),
      awayName: values.awayName.trim(),
      date: values.date ? `${values.date}T${values.time || '00:00'}:00` : null,
      venue: values.venue?.trim() || null,
      status: values.status,
      homeGoals: values.homeGoals,
      awayGoals: values.awayGoals,
    };
    if (editing?.id) await updateNeutralMatch(editing.id, payload);
    else await saveNeutralMatch(payload);
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    await deleteNeutralMatch(deleteTarget.id);
    setDeleteTarget(null);
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Partidos de grupo"
        subtitle="Resultados de los demás rivales para completar la clasificación de la liguilla."
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="bg-card-bg border border-card-border rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
            <select
              value={selectedCompetitionId}
              onChange={(event) => setSelectedCompetitionId(event.target.value)}
              className="bg-card-bg border border-card-border rounded-xl px-3 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
            >
              {seasonCompetitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>
            <button
              onClick={openCreate}
              disabled={!selectedCompetitionId}
              className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              + Nuevo resultado
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={0}
        totalPages={1}
        totalElements={rows.length}
        onPageChange={() => {}}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        searchKeys={['homeName', 'awayName', 'groupName', 'phase', 'status']}
        groupBy="jornada"
        groupLabel={(jornada) => (jornada == null ? 'Sin jornada' : `Jornada ${jornada}`)}
        emptyMessage={selectedCompetitionId ? 'No hay resultados de otros rivales en esta competición.' : 'Selecciona una competición.'}
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar resultado' : 'Nuevo resultado'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editing?.id ? () => setDeleteTarget(editing) : undefined}
        deleteLabel="Borrar resultado"
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar resultado?"
        message={`Se eliminará el partido ${deleteTarget?.homeName} - ${deleteTarget?.awayName} de forma permanente.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
