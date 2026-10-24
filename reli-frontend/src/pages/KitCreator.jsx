import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo';
import badge from '../assets/reli-badge.png';
import { ShirtSvg, ShortsSvg } from '../components/kit/KitSvg';
import {
  DEFAULT_KIT,
  KIT_COLLARS,
  KIT_CREST_POSITIONS,
  KIT_NAME_STYLES,
  KIT_PANELS,
  KIT_PATTERNS,
  KIT_SLEEVES,
  KIT_SPONSOR_STYLES,
  composeKitSheet,
  downloadDataUrl,
  loadKitDesign,
  normalizeKitDesign,
  randomKitDesign,
  saveKitDesign,
} from '../utils/kit';

const KitPreview3D = lazy(() => import('../components/kit/KitPreview3D'));

const FIELD_CLASS = 'w-full rounded-xl border border-card-border bg-background/70 px-3 py-2.5 text-sm font-bold text-foreground outline-none transition focus:border-re-rojo focus:ring-2 focus:ring-re-rojo/20';
const LABEL_CLASS = 'text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground';
const PRIMARY_BUTTON = 'inline-flex items-center justify-center gap-2 rounded-xl bg-re-rojo px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-re-rojo/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';
const SECONDARY_BUTTON = 'inline-flex items-center justify-center gap-2 rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-foreground transition hover:border-re-rojo/40 hover:text-re-rojo active:scale-[0.98]';

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-background/60 px-3 py-2">
      <span className={LABEL_CLASS}>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase text-foreground/70">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
          aria-label={label}
        />
      </span>
    </label>
  );
}

function PreviewFrame({ label, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      {children}
    </div>
  );
}

export default function KitCreator() {
  const [design, setDesign] = useState(() => loadKitDesign());
  const [view, setView] = useState('3d');
  const [crestDataUrl, setCrestDataUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const shirtFrontRef = useRef(null);
  const shirtBackRef = useRef(null);
  const shortsFrontRef = useRef(null);
  const shortsBackRef = useRef(null);
  const capture3DRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || 256;
      canvas.height = image.naturalHeight || 256;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      setCrestDataUrl(canvas.toDataURL('image/png'));
    };
    image.src = badge;
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const update = (field, value) => {
    setDesign((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    const normalized = normalizeKitDesign(design);
    setDesign(normalized);
    setNotice(saveKitDesign(normalized) ? 'Diseño guardado en este navegador.' : 'No se pudo guardar en este navegador.');
  };

  const handleRandom = () => {
    setDesign(randomKitDesign());
    setNotice('Nuevo diseño generado.');
  };

  const handleReset = () => {
    setDesign(normalizeKitDesign(DEFAULT_KIT));
    setNotice('Diseño restablecido.');
  };

  const handleCaptureReady = useCallback((capture) => {
    capture3DRef.current = capture;
  }, []);

  const handleDownload2D = async () => {
    if (!shirtFrontRef.current || !shirtBackRef.current || !shortsFrontRef.current || !shortsBackRef.current) {
      setNotice('La vista todavía se está preparando.');
      return;
    }

    setExporting(true);
    try {
      const dataUrl = await composeKitSheet({
        shirtFront: shirtFrontRef.current,
        shirtBack: shirtBackRef.current,
        shortsFront: shortsFrontRef.current,
        shortsBack: shortsBackRef.current,
        subtitle: `${design.teamName} · ${design.season}`,
      });
      const safeSeason = design.season.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'temporada';
      downloadDataUrl(dataUrl, `reli-kit-${safeSeason}.png`);
      setNotice('Lámina PNG descargada.');
    } catch {
      setNotice('No se pudo generar el PNG. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload3D = () => {
    const dataUrl = capture3DRef.current?.();
    if (!dataUrl) {
      setNotice('La vista 3D aún se está preparando.');
      return;
    }
    downloadDataUrl(dataUrl, 'reli-kit-3d.png');
    setNotice('Vista 3D descargada.');
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Seo
        title="Creador de equipaciones"
        description="Diseña la equipación del Real Lisiados F.C. para la próxima temporada: colores, patrón, dorsal, escudo y vista previa 2D y 3D."
        path="/equipaciones"
      />

      <section className="relative overflow-hidden rounded-3xl border border-card-border bg-card-bg shadow-card dark:border-re-dorado/30 dark:bg-[#071018]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(226,29,44,0.2),transparent_46%),radial-gradient(circle_at_82%_100%,rgba(193,154,91,0.16),transparent_42%)]" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-re-rojo">
              <img src={badge} alt="" className="h-7 w-auto" />
              Nueva temporada · Diseña tu equipación
            </p>
            <h1 className="text-3xl font-black italic leading-none tracking-tighter text-foreground sm:text-5xl dark:text-white">
              Kit Creator
            </h1>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              Crea una equipación con los colores del club, elige patrón y cuello, añade dorsal y escudo.
              Guarda tu diseño en el navegador o descárgalo en PNG.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleRandom} className={SECONDARY_BUTTON}>
              Aleatorio
            </button>
            <button type="button" onClick={handleReset} className={SECONDARY_BUTTON}>
              Restablecer
            </button>
            <button type="button" onClick={handleSave} className={PRIMARY_BUTTON}>
              Guardar diseño
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <section className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#071018] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground dark:text-white">
                Identidad
              </h2>
              <span className="rounded-full bg-re-rojo/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-re-rojo">
                Local
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Nombre del equipo</span>
                <input
                  value={design.teamName}
                  onChange={(event) => update('teamName', event.target.value.slice(0, 28))}
                  maxLength={28}
                  className={FIELD_CLASS}
                  placeholder="REAL LISIADOS"
                />
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Temporada</span>
                <input
                  value={design.season}
                  onChange={(event) => update('season', event.target.value.slice(0, 12))}
                  maxLength={12}
                  className={FIELD_CLASS}
                  placeholder="2026/27"
                />
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Dorsal</span>
                <input
                  value={design.number}
                  onChange={(event) => update('number', event.target.value.replace(/\D/g, '').slice(0, 2))}
                  maxLength={2}
                  inputMode="numeric"
                  className={FIELD_CLASS}
                  placeholder="10"
                />
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Patrocinador</span>
                <input
                  value={design.sponsor}
                  onChange={(event) => update('sponsor', event.target.value.slice(0, 22))}
                  maxLength={22}
                  className={FIELD_CLASS}
                  placeholder="RELI"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#071018] sm:p-5">
            <h2 className="mb-4 text-lg font-black italic uppercase tracking-tighter text-foreground dark:text-white">
              Diseño
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Patrón</span>
                <select
                  value={design.pattern}
                  onChange={(event) => update('pattern', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_PATTERNS.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>{pattern.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Cuello</span>
                <select
                  value={design.collar}
                  onChange={(event) => update('collar', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_COLLARS.map((collar) => (
                    <option key={collar.id} value={collar.id}>{collar.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Manga</span>
                <select
                  value={design.sleeveStyle}
                  onChange={(event) => update('sleeveStyle', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_SLEEVES.map((sleeve) => (
                    <option key={sleeve.id} value={sleeve.id}>{sleeve.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Paneles</span>
                <select
                  value={design.panelStyle}
                  onChange={(event) => update('panelStyle', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_PANELS.map((panel) => (
                    <option key={panel.id} value={panel.id}>{panel.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Nombre dorsal</span>
                <select
                  value={design.nameStyle}
                  onChange={(event) => update('nameStyle', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_NAME_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>{style.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Escudo</span>
                <select
                  value={design.crestPosition}
                  onChange={(event) => update('crestPosition', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_CREST_POSITIONS.map((position) => (
                    <option key={position.id} value={position.id}>{position.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={LABEL_CLASS}>Patrocinador</span>
                <select
                  value={design.sponsorStyle}
                  onChange={(event) => update('sponsorStyle', event.target.value)}
                  className={FIELD_CLASS}
                >
                  {KIT_SPONSOR_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>{style.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#071018] sm:p-5">
            <h2 className="mb-4 text-lg font-black italic uppercase tracking-tighter text-foreground dark:text-white">
              Detalles
            </h2>
            <div className="grid gap-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-background/60 px-3 py-2.5">
                <span className={LABEL_CLASS}>Escudo del club</span>
                <input
                  type="checkbox"
                  checked={design.showCrest}
                  onChange={(event) => update('showCrest', event.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#E21D2C]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-background/60 px-3 py-2.5">
                <span className={LABEL_CLASS}>Contorno del dorsal</span>
                <input
                  type="checkbox"
                  checked={design.showNumberOutline}
                  onChange={(event) => update('showNumberOutline', event.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#E21D2C]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-background/60 px-3 py-2.5">
                <span className={LABEL_CLASS}>Dorsal en pantalón</span>
                <input
                  type="checkbox"
                  checked={design.shortsNumber}
                  onChange={(event) => update('shortsNumber', event.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#E21D2C]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#071018] sm:p-5">
            <h2 className="mb-4 text-lg font-black italic uppercase tracking-tighter text-foreground dark:text-white">
              Colores
            </h2>
            <div className="grid gap-2">
              <ColorField label="Principal" value={design.primary} onChange={(value) => update('primary', value)} />
              <ColorField label="Secundario" value={design.secondary} onChange={(value) => update('secondary', value)} />
              <ColorField label="Detalle" value={design.accent} onChange={(value) => update('accent', value)} />
              <ColorField label="Paneles" value={design.panelColor} onChange={(value) => update('panelColor', value)} />
              <ColorField label="Nombre" value={design.nameColor} onChange={(value) => update('nameColor', value)} />
              <ColorField label="Dorsal" value={design.numberColor} onChange={(value) => update('numberColor', value)} />
              <ColorField label="Texto" value={design.text} onChange={(value) => update('text', value)} />
              <ColorField label="Pantalón" value={design.shortsColor} onChange={(value) => update('shortsColor', value)} />
            </div>
          </section>

          <p className="px-1 text-[10px] font-medium leading-relaxed text-muted-foreground">
            Diseño propio de Real Lisiados F.C. No se utilizan escudos, marcas ni plantillas de terceros.
          </p>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-card-border bg-card-bg p-3 shadow-card dark:border-re-dorado/30 dark:bg-[#071018] sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl border border-card-border bg-background/60 p-1">
                <button
                  type="button"
                  onClick={() => setView('2d')}
                  aria-pressed={view === '2d'}
                  className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${view === '2d' ? 'bg-re-rojo text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Vista 2D
                </button>
                <button
                  type="button"
                  onClick={() => setView('3d')}
                  aria-pressed={view === '3d'}
                  className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${view === '3d' ? 'bg-re-rojo text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Vista 3D
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSave} className={SECONDARY_BUTTON}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={view === '3d' ? handleDownload3D : handleDownload2D}
                  disabled={exporting}
                  className={PRIMARY_BUTTON}
                >
                  {exporting ? 'Generando...' : view === '3d' ? 'Descargar 3D' : 'Descargar PNG'}
                </button>
              </div>
            </div>

            {view === '2d' ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#0b1a2b,#020617)] p-4 sm:p-6">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(96,165,250,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.16) 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(226,29,44,0.18),transparent_55%)]" />
                <span className="pointer-events-none absolute -bottom-8 -right-2 select-none text-8xl font-black italic tracking-tighter text-white/[0.04]">
                  RELI
                </span>
                <div className="relative">
                  <div className="mb-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">2D Kit Builder</p>
                    <p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-white/85">
                      {design.teamName} · {design.season}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PreviewFrame label="Camiseta · Delantera">
                      <ShirtSvg design={design} side="front" crestDataUrl={crestDataUrl} className="mx-auto block h-auto w-full max-w-[250px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" />
                    </PreviewFrame>
                    <PreviewFrame label="Camiseta · Trasera">
                      <ShirtSvg design={design} side="back" crestDataUrl={crestDataUrl} className="mx-auto block h-auto w-full max-w-[250px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" />
                    </PreviewFrame>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <PreviewFrame label="Pantalón · Delantero">
                      <ShortsSvg design={design} side="front" crestDataUrl={crestDataUrl} className="mx-auto block h-auto w-full max-w-[320px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" />
                    </PreviewFrame>
                    <PreviewFrame label="Pantalón · Trasero">
                      <ShortsSvg design={design} side="back" crestDataUrl={crestDataUrl} className="mx-auto block h-auto w-full max-w-[320px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" />
                    </PreviewFrame>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[560px] sm:h-[680px]">
                <Suspense
                  fallback={(
                    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#111827,#020617)]">
                      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-re-dorado border-t-transparent" />
                        Cargando visor 3D
                      </div>
                    </div>
                  )}
                >
                  <KitPreview3D
                    design={design}
                    crestDataUrl={crestDataUrl}
                    shirtFrontRef={shirtFrontRef}
                    shirtBackRef={shirtBackRef}
                    shortsFrontRef={shortsFrontRef}
                    shortsBackRef={shortsBackRef}
                    onCaptureReady={handleCaptureReady}
                    className="h-full"
                  />
                </Suspense>
              </div>
            )}

            {notice ? (
              <p className="mt-3 rounded-xl border border-re-rojo/20 bg-re-rojo/5 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-re-rojo" role="status">
                {notice}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Diseño propio', text: 'Patrones y modelo low-poly creados para el club.' },
              { title: 'Guardado local', text: 'Tu diseño queda en este navegador, sin subir datos.' },
              { title: 'Export PNG', text: 'Descarga la lámina 2D o una captura de la vista 3D.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#071018]">
                <h3 className="text-sm font-black italic uppercase tracking-tight text-re-rojo">{item.title}</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0"
      >
        <ShirtSvg ref={shirtFrontRef} design={design} side="front" crestDataUrl={crestDataUrl} />
        <ShirtSvg ref={shirtBackRef} design={design} side="back" crestDataUrl={crestDataUrl} />
        <ShortsSvg ref={shortsFrontRef} design={design} side="front" crestDataUrl={crestDataUrl} />
        <ShortsSvg ref={shortsBackRef} design={design} side="back" crestDataUrl={crestDataUrl} />
      </div>
    </main>
  );
}
