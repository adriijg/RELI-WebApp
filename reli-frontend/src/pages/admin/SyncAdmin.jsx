import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import AdminSelect from '../../components/admin/AdminSelect';
import Badge from '../../components/admin/Badge';
import EmptyState from '../../components/admin/EmptyState';
import { applyFfmSync, getCompetitions, getFfmSyncRuns, previewFfmSync, syncJornadaResults, toPage } from '../../services/api';
import { formatDateTime } from '../../utils/format';

const ACTION_VARIANTS = {
  CREATED: 'green',
  UPDATED: 'blue',
  UNCHANGED: 'slate',
  SKIP: 'yellow',
};

const ACTION_LABELS = {
  CREATED: 'Crear',
  UPDATED: 'Actualizar',
  UNCHANGED: 'Igual',
  SKIP: 'Omitir',
};

const RUN_STATUS_VARIANTS = {
  OK: 'green',
  PARTIAL: 'yellow',
};

export default function SyncAdmin() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [jornada, setJornada] = useState('');
  const [syncingJornada, setSyncingJornada] = useState(false);
  const [jornadaMsg, setJornadaMsg] = useState('');
  const [error, setError] = useState('');

  const loadRuns = useCallback(() => {
    getFfmSyncRuns()
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    getCompetitions({ size: 200 })
      .then((data) => {
        const list = toPage(data).content;
        setCompetitions(list);
        const preferred = list.find((competition) => competition.ffmCompeticion) || list[0];
        if (preferred) setSelectedId(String(preferred.id));
      })
      .catch(() => setCompetitions([]));
    loadRuns();
  }, [loadRuns]);

  const selected = competitions.find((competition) => String(competition.id) === String(selectedId));
  const configured = Boolean(selected?.ffmCompeticion && selected?.ffmGrupo && selected?.ffmTemporada);

  const runAction = async (action, errorFallback) => {
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message || errorFallback);
    }
  };

  const handlePreview = async () => {
    if (!selectedId) return;
    setLoadingPreview(true);
    await runAction(async () => setPreview(await previewFfmSync(selectedId)), 'No se pudo previsualizar');
    setLoadingPreview(false);
  };

  const handleApply = async () => {
    if (!selectedId) return;
    setApplying(true);
    await runAction(async () => {
      setPreview(await applyFfmSync(selectedId));
      loadRuns();
    }, 'No se pudo aplicar');
    setApplying(false);
  };

  const handleSyncJornada = async () => {
    if (!selectedId || !jornada) return;
    setSyncingJornada(true);
    setJornadaMsg('');
    await runAction(async () => {
      const res = await syncJornadaResults(selectedId, Number(jornada));
      setJornadaMsg(res?.message || 'Jornada sincronizada');
      loadRuns();
    }, 'No se pudo sincronizar la jornada');
    setSyncingJornada(false);
  };

  return (
    <div>
      <PageHeader
        title="Sincronización FFM"
        subtitle="Vista previa y aplicación manual de calendario y resultados desde la federación."
      />

      {error && (
        <div className="mb-6 bg-re-rojo/10 border border-re-rojo/30 rounded-2xl px-5 py-4 text-sm font-bold text-re-rojo">
          {error}
        </div>
      )}

      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card p-6 lg:p-8 mb-6">
        <AdminSelect
          label="Competición"
          value={selectedId}
          onChange={(value) => {
            setSelectedId(value);
            setPreview(null);
          }}
          options={competitions.map((competition) => ({
            value: String(competition.id),
            label: `${competition.name}${competition.ffmCompeticion ? '' : ' (sin FFM)'}`,
          }))}
          className="sm:max-w-md"
        />

        {!configured && selected && (
          <p className="mt-3 text-xs font-bold text-orange-500">
            Esta competición no tiene configurados los identificadores FFM (competición, grupo, temporada). Ponlos en
            Competiciones para poder sincronizar.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handlePreview}
            disabled={!selectedId || !configured || loadingPreview}
            className="bg-muted/10 border border-card-border font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-muted/20 transition-all disabled:opacity-40"
          >
            {loadingPreview ? 'Leyendo federación…' : 'Vista previa'}
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedId || !configured || applying || !preview}
            className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 transition-all disabled:opacity-40"
          >
            {applying ? 'Aplicando…' : 'Aplicar cambios'}
          </button>
        </div>

        <div className="mt-4 border-t border-card-border pt-4">
          <label htmlFor="sync-jornada" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
            Sincronizar una jornada concreta
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="sync-jornada"
              type="number"
              min="1"
              value={jornada}
              onChange={(event) => setJornada(event.target.value)}
              placeholder="Nº jornada"
              className="w-32 bg-muted/30 border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40"
            />
            <button
              onClick={handleSyncJornada}
              disabled={!selectedId || !configured || !jornada || syncingJornada}
              className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-re-rojo/20 hover:bg-re-rojo/90 transition-all disabled:opacity-40"
            >
              {syncingJornada ? 'Sincronizando…' : '⟳ Sincronizar jornada'}
            </button>
          </div>
          {jornadaMsg && <p className="mt-2 text-xs font-bold text-emerald-500">{jornadaMsg}</p>}
        </div>

        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          La programada (lunes y jueves 08:00) está activa.
        </p>
      </section>

      {preview && (
        <section className="bg-card-bg border border-card-border rounded-3xl shadow-card overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-card-border flex flex-wrap gap-2 items-center">
            <h2 className="text-lg font-black uppercase tracking-tight flex-1 min-w-[200px]">
              {preview.runId ? 'Resultado aplicado' : 'Vista previa'} · {preview.competitionName}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {preview.created} nuevos · {preview.updated} cambios · {preview.unchanged} igual
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-card-border">
                  <th className="text-center px-2 py-3 w-12">Jor.</th>
                  <th className="text-left px-3 py-3">Rival</th>
                  <th className="text-left px-3 py-3 hidden sm:table-cell">Fecha/Sede</th>
                  <th className="text-center px-3 py-3">Acción</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {preview.actions?.map((action, index) => (
                  <tr key={index} className="border-b border-card-border last:border-0">
                    <td className="text-center px-2 py-3 font-black">{action.jornada ?? '—'}</td>
                    <td className="px-3 py-3 font-bold uppercase text-xs">
                      {action.home ? '' : '@ '}
                      {action.rival}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {[action.date ? action.date.slice(0, 16).replace('T', ' ') : '', action.venue].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="text-center px-3 py-3">
                      <Badge variant={ACTION_VARIANTS[action.action] || 'slate'}>
                        {ACTION_LABELS[action.action] || action.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">{action.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="bg-card-bg border border-card-border rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-card-border">
          <h2 className="text-lg font-black uppercase tracking-tight">Últimas sincronizaciones</h2>
        </div>
        {runs.length === 0 ? (
          <EmptyState title="Sin ejecuciones" message="Todavía no hay sincronizaciones registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-card-border">
                  <th className="text-left px-3 py-3">Inicio</th>
                  <th className="text-left px-3 py-3">Competición</th>
                  <th className="text-center px-3 py-3">Origen</th>
                  <th className="text-center px-3 py-3">Estado</th>
                  <th className="text-center px-2 py-3">Nuevos</th>
                  <th className="text-center px-2 py-3">Cambios</th>
                  <th className="text-center px-2 py-3">Igual</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-card-border last:border-0">
                    <td className="px-3 py-3 text-xs font-bold whitespace-nowrap">{formatDateTime(run.startedAt)}</td>
                    <td className="px-3 py-3 text-xs font-bold uppercase">{run.competitionName || run.competitionId}</td>
                    <td className="text-center px-3 py-3">
                      <Badge variant="slate">{run.triggeredBy === 'SCHEDULED' ? 'Auto' : 'Manual'}</Badge>
                    </td>
                    <td className="text-center px-3 py-3">
                      <Badge variant={RUN_STATUS_VARIANTS[run.status] || 'red'}>{run.status}</Badge>
                    </td>
                    <td className="text-center px-2 py-3 font-black">{run.created}</td>
                    <td className="text-center px-2 py-3 font-black">{run.updated}</td>
                    <td className="text-center px-2 py-3 font-black">{run.unchanged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
