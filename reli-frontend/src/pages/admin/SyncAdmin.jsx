import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import {
  applyFfmSync,
  getCompetitions,
  getFfmSyncRuns,
  previewFfmSync,
  toPage,
} from '../../services/api';

const ACTION_STYLES = {
  CREATED: 'bg-emerald-500/15 text-emerald-500',
  UPDATED: 'bg-blue-500/15 text-blue-500',
  UNCHANGED: 'bg-muted/10 text-muted-foreground',
  SKIP: 'bg-orange-500/15 text-orange-500',
};

const ACTION_LABELS = {
  CREATED: 'Crear',
  UPDATED: 'Actualizar',
  UNCHANGED: 'Igual',
  SKIP: 'Omitir',
};

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function SyncAdmin() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const loadRuns = useCallback(() => {
    getFfmSyncRuns()
      .then((data) => setRuns(Array.isArray(data) ? data : []))
      .catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    getCompetitions({ size: 100 })
      .then((data) => {
        const list = toPage(data).content;
        setCompetitions(list);
        const preferred = list.find((c) => c.ffmCompeticion) || list[0];
        if (preferred) setSelectedId(String(preferred.id));
      })
      .catch(() => setCompetitions([]));
    loadRuns();
  }, [loadRuns]);

  const selected = competitions.find((c) => String(c.id) === String(selectedId));
  const configured = Boolean(selected?.ffmCompeticion && selected?.ffmGrupo && selected?.ffmTemporada);

  const handlePreview = async () => {
    if (!selectedId) return;
    setLoadingPreview(true);
    setError('');
    try {
      setPreview(await previewFfmSync(selectedId));
    } catch (err) {
      setError(err.message || 'No se pudo previsualizar');
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!selectedId) return;
    setApplying(true);
    setError('');
    try {
      setPreview(await applyFfmSync(selectedId));
      loadRuns();
    } catch (err) {
      setError(err.message || 'No se pudo aplicar');
    } finally {
      setApplying(false);
    }
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
        <label htmlFor="sync-competition" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
          Competición
        </label>
        <select
          id="sync-competition"
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setPreview(null); }}
          className="w-full sm:max-w-md bg-muted/10 border border-card-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-re-rojo"
        >
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.ffmCompeticion ? '' : ' (sin FFM)'}
            </option>
          ))}
        </select>

        {!configured && selected && (
          <p className="mt-3 text-xs font-bold text-orange-500">
            Esta competición no tiene configurados los identificadores FFM (competición, grupo, temporada).
            Ponlos en Competiciones para poder sincronizar.
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
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          La programada (lunes y jueves 08:00) está apagada hasta tener hosting fijo.
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
                {preview.actions?.map((a, i) => (
                  <tr key={i} className="border-b border-card-border last:border-0">
                    <td className="text-center px-2 py-3 font-black">{a.jornada ?? '—'}</td>
                    <td className="px-3 py-3 font-bold uppercase text-xs">
                      {a.home ? '' : '@ '}{a.rival}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {[a.date ? a.date.slice(0, 16).replace('T', ' ') : '', a.venue].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ACTION_STYLES[a.action] || ACTION_STYLES.UNCHANGED}`}>
                        {ACTION_LABELS[a.action] || a.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">{a.detail || '—'}</td>
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
          <p className="px-6 py-10 text-center text-muted-foreground font-bold text-sm">
            Todavía no hay ejecuciones registradas.
          </p>
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
                      <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted/10 text-muted-foreground">
                        {run.triggeredBy === 'SCHEDULED' ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        run.status === 'OK' ? 'bg-emerald-500/15 text-emerald-500'
                          : run.status === 'PARTIAL' ? 'bg-orange-500/15 text-orange-500'
                            : 'bg-re-rojo/15 text-re-rojo'
                      }`}>
                        {run.status}
                      </span>
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
