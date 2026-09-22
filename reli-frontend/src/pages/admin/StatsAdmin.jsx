import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { useCrud } from '../../hooks/useCrud';
import { createStat, deleteStat, getMatches, getPlayers, getStats, toPage, updateStat } from '../../services/api';

export default function StatsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  const crud = useCrud({
    fetchPage: getStats,
    createItem: createStat,
    updateItem: updateStat,
    deleteItem: deleteStat,
    sortBy: 'id',
    direction: 'desc',
  });

  useEffect(() => {
    Promise.all([getPlayers({ size: 100 }), getMatches({ size: 100 })])
      .then(([p, m]) => {
        setPlayers(toPage(p).content);
        setMatches(toPage(m).content);
      })
      .catch(() => {});
  }, []);

  const fields = [
    {
      name: 'playerId',
      label: 'Jugador',
      type: 'select',
      required: true,
      options: players.map((p) => ({ value: String(p.id), label: `#${p.jerseyNumber} ${p.name}` })),
    },
    {
      name: 'matchId',
      label: 'Partido',
      type: 'select',
      required: true,
      options: matches.map((m) => ({
        value: String(m.id),
        label: `${m.rival} (${m.date ? new Date(m.date).toLocaleDateString('es-ES') : 'sin fecha'})`,
      })),
    },
    { name: 'goals', label: 'Goles', type: 'number', required: true, default: 0, min: 0 },
    { name: 'assists', label: 'Asistencias', type: 'number', required: true, default: 0, min: 0 },
    { name: 'yellowCards', label: 'Amarillas', type: 'number', required: true, default: 0, min: 0 },
    { name: 'redCards', label: 'Rojas', type: 'number', required: true, default: 0, min: 0 },
    { name: 'mvp', label: 'MVP', type: 'checkbox', checkboxLabel: 'Fue MVP del partido', default: false },
    { name: 'attended', label: 'Asistencia', type: 'checkbox', checkboxLabel: 'Asistió al partido', default: true },
  ];

  const columns = [
    { key: 'playerName', label: 'Jugador' },
    { key: 'matchRival', label: 'Rival' },
    { key: 'goals', label: 'Goles' },
    { key: 'assists', label: 'Asist.' },
    { key: 'yellowCards', label: 'Amar.' },
    { key: 'redCards', label: 'Rojas' },
    {
      key: 'mvp',
      label: 'MVP',
      render: (v) =>
        v ? (
          <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-re-dorado/20 text-re-dorado">
            MVP
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'attended',
      label: 'Asistió',
      render: (v) => (v ? 'Sí' : 'No'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        subtitle="Registro de rendimiento por jugador y partido: goles, asistencias y distinciones."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 hover:-translate-y-0.5 transition-all"
          >
            + Nueva estadística
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
          setEditing({
            ...row,
            playerId: String(row.playerId ?? ''),
            matchId: String(row.matchId ?? ''),
          });
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        searchKeys={['playerName', 'matchRival']}
        emptyMessage="Sin estadísticas registradas."
      />

      <EntityFormModal
        open={modalOpen}
        title={editing ? 'Editar estadística' : 'Nueva estadística'}
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            playerId: Number(values.playerId),
            matchId: Number(values.matchId),
            goals: Number(values.goals),
            assists: Number(values.assists),
            yellowCards: Number(values.yellowCards),
            redCards: Number(values.redCards),
            mvp: Boolean(values.mvp),
            attended: Boolean(values.attended),
          };
          await crud.save(payload, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar estadística?"
        message={`Se eliminará el registro de ${deleteTarget?.playerName} contra ${deleteTarget?.matchRival}.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await crud.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
