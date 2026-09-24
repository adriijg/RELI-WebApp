import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { createStat, deleteStat, getMatches, getPlayers, getSeasons, getStats, toPage, updateStat, scrapeStats } from '../../services/api';

export default function StatsAdmin() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsResult, setStatsResult] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadStats = useCallback(async (targetPage = 0) => {
    if (!selectedSeasonId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getStats({ page: targetPage, size: 20, sortBy: 'id', direction: 'desc', seasonId: selectedSeasonId, search: debouncedSearch || undefined });
      const paged = toPage(data);
      setRows(paged.content);
      setTotalPages(Math.max(paged.totalPages, 1));
      setTotalElements(paged.totalElements);
      setPage(targetPage);
    } catch (err) {
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [selectedSeasonId, debouncedSearch]);

  useEffect(() => { loadStats(0); }, [loadStats]);
  // CRUD helpers sin useCrud para respetar season/search
  const handleSave = async (payload, id) => {
    if (id) await updateStat(id, payload);
    else await createStat(payload);
    await loadStats(page);
  };
  const handleDelete = async (id) => {
    await deleteStat(id);
    const nextPage = rows.length === 1 && page > 0 ? page - 1 : page;
    await loadStats(nextPage);
  };
  const handleBulkDelete = async (selected) => {
    if (!window.confirm(`¿Borrar ${selected.length} estadísticas seleccionadas? Esta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(selected.map((row) => deleteStat(row.id)));
      await loadStats(0);
    } catch (err) {
      alert(err.message || 'No se pudieron borrar todas las estadísticas');
      await loadStats(0);
    }
  };

  useEffect(() => {
    Promise.all([getPlayers({ size: 100 }), getMatches({ size: 100 })])
      .then(([p, m]) => {
        setPlayers(toPage(p).content);
        setMatches(toPage(m).content);
      })
      .catch(() => {});
  }, []);

  const loadSeasons = useCallback(async () => {
    try {
      const data = await getSeasons({ size: 100, sortBy: 'name', direction: 'desc' });
      const list = toPage(data).content;
      setSeasons(list);
      const current = list.find((s) => s.current) || list[0];
      if (current) setSelectedSeasonId(String(current.id));
    } catch { setSeasons([]); }
  }, []);
  useEffect(() => { loadSeasons(); }, [loadSeasons]);

  const handleScrapeStats = async () => {
    if (!selectedSeasonId) return;
    if (!confirm('¿Scrapear stats de todas las actas de la temporada? Puede tardar 1-2 minutos y sobreescribirá callups/goles/stats desde FFM.')) return;
    setStatsLoading(true);
    setStatsResult(null);
    try {
      const res = await scrapeStats(selectedSeasonId);
      setStatsResult(res);
      alert(`Stats: ${res.actasProcessed} actas, ${res.callupsCreated} convocatorias, ${res.goalsCreated} goles, ${res.statsCreated} stats nuevos / ${res.statsUpdated} actualizados`);
      await loadStats(0);
    } catch (err) {
      alert(err.message || 'Error al scrapear stats');
    } finally {
      setStatsLoading(false);
    }
  };

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

  const selectedSeason = seasons.find((s) => String(s.id) === String(selectedSeasonId));
  return (
    <div>
      <PageHeader
        title="Estadísticas"
        subtitle="Registro de rendimiento por jugador y partido: goles, asistencias y distinciones. Scrapea desde actas FFM."
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

      <div className="mb-4 flex flex-wrap items-center gap-3 bg-card-bg border border-card-border rounded-2xl px-4 py-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-re-dorado">Temporada</label>
        <select value={selectedSeasonId} onChange={(e) => setSelectedSeasonId(e.target.value)} className="rounded-xl border border-re-dorado/25 bg-black/30 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.name}{s.current ? ' · actual' : ''}</option>))}
        </select>
        <span className="text-[11px] font-bold text-muted-foreground">{selectedSeason ? selectedSeason.name : ''}</span>
        <button type="button" onClick={handleScrapeStats} disabled={!selectedSeasonId || statsLoading} className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-50">
          {statsLoading ? 'Scrapeando… 1-2 min' : 'Scrapear stats de actas'}
        </button>
      </div>
      {statsResult && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[11px] font-bold text-emerald-700">
          Último scrape: {statsResult.actasProcessed} actas · {statsResult.callupsCreated} convocatorias · {statsResult.goalsCreated} goles · {statsResult.statsCreated} stats nuevos · {statsResult.statsUpdated} actualizados
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={loadStats}
        onEdit={(row) => {
          setEditing({
            ...row,
            playerId: String(row.playerId ?? ''),
            matchId: String(row.matchId ?? ''),
          });
          setModalOpen(true);
        }}
        onDelete={setDeleteTarget}
        onBulkDelete={handleBulkDelete}
        emptyMessage={selectedSeasonId ? 'Sin estadísticas para esta temporada.' : 'Selecciona una temporada.'}
        serverSearch
        searchValue={search}
        onSearchChange={setSearch}
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
          await handleSave(payload, editing?.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar estadística?"
        message={`Se eliminará el registro de ${deleteTarget?.playerName} contra ${deleteTarget?.matchRival}.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
