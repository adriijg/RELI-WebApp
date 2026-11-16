import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo';
import badge from '../assets/reli-badge.png';
import { ShirtSvg, ShortsSvg, SocksSvg } from '../components/kit/KitSvg';
import {
  DEFAULT_KIT,
  KIT_CHEST_BANDS,
  KIT_COLLARS,
  KIT_CREST_POSITIONS,
  KIT_CREST_STYLES,
  KIT_CUFF_STYLES,
  KIT_FONTS,
  KIT_MANUFACTURERS,
  KIT_NAME_STYLES,
  KIT_PANELS,
  KIT_PATTERNS,
  KIT_PRESETS,
  KIT_SHOULDER_STRIPES,
  KIT_SLEEVE_BADGES,
  KIT_SLEEVES,
  KIT_SPONSOR_STYLES,
  composeKitSheet,
  deleteKitFromCollection,
  downloadDataUrl,
  loadKitDesign,
  loadSavedKitCollection,
  normalizeKitDesign,
  randomKitDesign,
  saveKitDesign,
  saveKitToCollection,
} from '../utils/kit';

const KitPreview3D = lazy(() => import('../components/kit/KitPreview3D'));

const FIELD_CLASS =
  'w-full rounded-xl border border-card-border bg-background/80 px-3 py-2 text-xs font-bold text-foreground outline-none transition focus:border-re-rojo focus:ring-2 focus:ring-re-rojo/20';
const LABEL_CLASS = 'text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground';
const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-re-rojo px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-re-rojo/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';
const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-card-border bg-card-bg px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-foreground transition hover:border-re-rojo/40 hover:text-re-rojo active:scale-[0.98]';

const SIDEBAR_TABS = [
  { id: 'pattern', label: 'Patrones', icon: '🎨' },
  { id: 'template', label: 'Corte & Cuello', icon: '👕' },
  { id: 'logos', label: 'Logos & Parches', icon: '🛡️' },
  { id: 'typography', label: 'Dorsal & Texto', icon: '🔢' },
  { id: 'bottoms', label: 'Short & Medias', icon: '🩳' },
  { id: 'colors', label: 'Colores & Mis Kits', icon: '💾' },
];

const QUICK_SWATCHES = [
  '#D91929',
  '#990F1B',
  '#FFFFFF',
  '#0D1117',
  '#1E293B',
  '#C9A259',
  '#FACC15',
  '#1E3A8A',
  '#0284C7',
  '#047857',
  '#10B981',
  '#6D28D9',
];

function ColorField({ label, value, onChange }) {
  return (
    <div className="rounded-xl border border-card-border bg-background/60 p-2.5 transition hover:border-re-rojo/30">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL_CLASS}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-foreground/75">{value}</span>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label={label}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            className={`h-4 w-4 rounded-full border transition hover:scale-110 ${
              value?.toLowerCase() === swatch.toLowerCase()
                ? 'border-re-rojo ring-2 ring-re-rojo/40'
                : 'border-black/25 dark:border-white/20'
            }`}
            style={{ backgroundColor: swatch }}
            title={swatch}
          />
        ))}
      </div>
    </div>
  );
}

function RangeField({ label, value, min, max, step = 1, unit = '', onChange, onReset }) {
  return (
    <div className="rounded-xl border border-card-border bg-background/60 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className={LABEL_CLASS}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black text-foreground">
            {value}
            {unit}
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[9px] font-bold uppercase text-muted-foreground hover:text-re-rojo"
              title="Restablecer valor"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted/40 accent-[#D91929]"
      />
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-card-border bg-background/60 px-3 py-2 transition hover:border-re-rojo/30">
      <span className={LABEL_CLASS}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[#D91929]"
      />
    </label>
  );
}

function PreviewFrame({ label, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center transition hover:border-white/20">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">{label}</p>
      {children}
    </div>
  );
}

export default function KitCreator() {
  const [design, setDesign] = useState(() => loadKitDesign());
  const [savedCollection, setSavedCollection] = useState(() => loadSavedKitCollection());
  const [saveTitle, setSaveTitle] = useState('');
  const [activeTab, setActiveTab] = useState('pattern');
  const [view, setView] = useState('3d');
  const [crestDataUrl, setCrestDataUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);

  const shirtFrontRef = useRef(null);
  const shirtBackRef = useRef(null);
  const shortsFrontRef = useRef(null);
  const shortsBackRef = useRef(null);
  const socksRef = useRef(null);
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

  const handleImageUpload = (field, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setNotice('La imagen no debe superar los 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        update(field, reader.result);
        setNotice('Imagen personalizada aplicada al diseño.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset) => {
    const updated = normalizeKitDesign({
      ...design,
      ...preset,
      teamName: design.teamName,
      season: design.season,
      number: design.number,
      sponsor: design.sponsor,
    });
    setDesign(updated);
    setNotice(`Equipación aplicada: ${preset.name}`);
  };

  const handleSave = () => {
    const normalized = normalizeKitDesign(design);
    setDesign(normalized);
    saveKitDesign(normalized);
    const updatedList = saveKitToCollection(saveTitle || `${normalized.teamName} · ${normalized.season}`, normalized);
    if (updatedList) setSavedCollection(updatedList);
    setSaveTitle('');
    setNotice('Diseño guardado en tu colección del navegador.');
  };

  const handleDeleteSaved = (id) => {
    const updatedList = deleteKitFromCollection(id);
    if (updatedList) setSavedCollection(updatedList);
  };

  const handleRandom = () => {
    setDesign((curr) => randomKitDesign({ teamName: curr.teamName, season: curr.season, number: curr.number, sponsor: curr.sponsor }));
    setNotice('Diseño creativo generado al azar.');
  };

  const handleReset = () => {
    setDesign(normalizeKitDesign(DEFAULT_KIT));
    setNotice('Diseño restablecido al modelo original.');
  };

  const handleCaptureReady = useCallback((capture) => {
    capture3DRef.current = capture;
  }, []);

  const handleDownload2D = async () => {
    if (!shirtFrontRef.current || !shirtBackRef.current || !shortsFrontRef.current || !shortsBackRef.current || !socksRef.current) {
      setNotice('El render 2D aún se está preparando.');
      return;
    }

    setExporting(true);
    try {
      const dataUrl = await composeKitSheet({
        shirtFront: shirtFrontRef.current,
        shirtBack: shirtBackRef.current,
        shortsFront: shortsFrontRef.current,
        shortsBack: shortsBackRef.current,
        socks: socksRef.current,
        subtitle: `${design.teamName} · ${design.season}`,
      });
      const safeSeason = design.season.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'temporada';
      downloadDataUrl(dataUrl, `reli-kit-sheet-${safeSeason}.png`);
      setNotice('Lámina conceptual descargada en alta resolución.');
    } catch {
      setNotice('No se pudo exportar el PNG. Inténtalo de nuevo.');
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
    downloadDataUrl(dataUrl, 'reli-kit-3d-studio.png');
    setNotice('Captura 3D de estudio descargada.');
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <Seo
        title="Kit Creator Studio · Creador de Equipaciones 3D"
        description="Estudio profesional de diseño de equipaciones del Real Lisiados F.C. en 3D y 2D con patrones personalizables, escudos, parches y dorsales."
        path="/equipaciones"
      />

      {/* Top Studio Header */}
      <section className="relative overflow-hidden rounded-3xl border border-card-border bg-card-bg shadow-card dark:border-re-dorado/30 dark:bg-[#070C15]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,25,41,0.2),transparent_48%),radial-gradient(circle_at_85%_100%,rgba(201,162,89,0.16),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-re-rojo">
              <img src={badge} alt="Escudo RELI" className="h-6 w-auto" />
              RELI Pro Kit Studio · Motor 3D Esculpido
            </p>
            <h1 className="text-3xl font-black italic leading-none tracking-tighter text-foreground sm:text-4xl dark:text-white">
              Kit Creator Studio
            </h1>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
              Personaliza cada costura, patrón, ángulo, escudo, parche y dorsal sobre tejido 3D anatómico en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleRandom} className={SECONDARY_BUTTON}>
              🎲 Aleatorio
            </button>
            <button type="button" onClick={handleReset} className={SECONDARY_BUTTON}>
              ↺ Restablecer
            </button>
            <button type="button" onClick={handleSave} className={PRIMARY_BUTTON}>
              💾 Guardar Kit
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="border-t border-card-border/60 bg-muted/10 px-5 py-2.5 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Plantillas del Club:
            </span>
            {KIT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center gap-2 rounded-xl border border-card-border bg-card-bg/90 px-3 py-1.5 text-[11px] font-black tracking-wide text-foreground transition hover:border-re-rojo hover:text-re-rojo"
              >
                <span className="flex items-center -space-x-1">
                  <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: preset.primary }} />
                  <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: preset.secondary }} />
                </span>
                <span>{preset.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Studio Workspace */}
      <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* Left Customization Inspector */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1">
          {/* Layer Tabs */}
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-card-border bg-card-bg p-1.5 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15]">
            {SIDEBAR_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                    active
                      ? 'bg-re-rojo text-white shadow-md shadow-re-rojo/25'
                      : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PATRONES Y GRÁFICOS AVANZADOS */}
          {activeTab === 'pattern' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Motor de Patrones ({KIT_PATTERNS.length})
                </h2>
                <span className="text-[10px] font-bold text-re-rojo">Personalización Total</span>
              </div>

              {/* Visual Grid of Patterns */}
              <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                {KIT_PATTERNS.map((pat) => {
                  const selected = design.pattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => update('pattern', pat.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition ${
                        selected
                          ? 'border-re-rojo bg-re-rojo/10 text-re-rojo'
                          : 'border-card-border bg-background/50 text-foreground hover:border-re-rojo/40'
                      }`}
                    >
                      <span className="truncate">{pat.label}</span>
                      {selected && <span className="text-[10px]">●</span>}
                    </button>
                  );
                })}
              </div>

              {/* Fine-Tuning Sliders */}
              {design.pattern !== 'solid' && (
                <div className="space-y-2 pt-1">
                  <p className={LABEL_CLASS}>Ajustes geométricos del patrón</p>
                  <RangeField
                    label="Escala / Grosor"
                    value={design.patternScale}
                    min={40}
                    max={220}
                    unit="%"
                    onChange={(v) => update('patternScale', v)}
                    onReset={() => update('patternScale', 100)}
                  />
                  <RangeField
                    label="Rotación / Ángulo"
                    value={design.patternRotation}
                    min={-180}
                    max={180}
                    step={5}
                    unit="°"
                    onChange={(v) => update('patternRotation', v)}
                    onReset={() => update('patternRotation', 0)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <RangeField
                      label="Desplazar X"
                      value={design.patternOffsetX}
                      min={-120}
                      max={120}
                      onChange={(v) => update('patternOffsetX', v)}
                      onReset={() => update('patternOffsetX', 0)}
                    />
                    <RangeField
                      label="Desplazar Y"
                      value={design.patternOffsetY}
                      min={-120}
                      max={120}
                      onChange={(v) => update('patternOffsetY', v)}
                      onReset={() => update('patternOffsetY', 0)}
                    />
                  </div>
                  <RangeField
                    label="Opacidad del gráfico"
                    value={design.patternOpacity}
                    min={10}
                    max={100}
                    unit="%"
                    onChange={(v) => update('patternOpacity', v)}
                    onReset={() => update('patternOpacity', 90)}
                  />
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <ToggleField
                      label="Extender patrón a las mangas"
                      checked={design.patternOnSleeves}
                      onChange={(v) => update('patternOnSleeves', v)}
                    />
                    <ToggleField
                      label="Mostrar patrón en la espalda"
                      checked={design.patternOnBack}
                      onChange={(v) => update('patternOnBack', v)}
                    />
                    <ToggleField
                      label="Recuadro liso tras el dorsal (Estilo UEFA)"
                      checked={design.backBoxSolid}
                      onChange={(v) => update('backBoxSolid', v)}
                    />
                  </div>
                </div>
              )}

              {/* Independent Chest Band */}
              <div className="space-y-2 border-t border-card-border pt-3 dark:border-white/5">
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Franja de pecho adicional</span>
                  <select
                    value={design.chestBand}
                    onChange={(e) => update('chestBand', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_CHEST_BANDS.map((band) => (
                      <option key={band.id} value={band.id}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                </label>
                {design.chestBand !== 'none' && (
                  <ColorField
                    label="Color de franja de pecho"
                    value={design.chestBandColor}
                    onChange={(v) => update('chestBandColor', v)}
                  />
                )}
              </div>

              {/* Pattern Colors */}
              <div className="space-y-2 border-t border-card-border pt-3 dark:border-white/5">
                <ColorField label="Color Principal (Base)" value={design.primary} onChange={(v) => update('primary', v)} />
                <ColorField label="Color Secundario (Patrón 1)" value={design.secondary} onChange={(v) => update('secondary', v)} />
                <ColorField label="Color Terciario (Patrón 2 / Sombra)" value={design.tertiary} onChange={(v) => update('tertiary', v)} />
              </div>
            </section>
          )}

          {/* TAB 2: CORTE, CUELLO, HOMBROS Y MANGAS */}
          {activeTab === 'template' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Construcción & Costuras
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground">Sastrería Pro</span>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Diseño del cuello</span>
                  <select
                    value={design.collar}
                    onChange={(e) => update('collar', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_COLLARS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Lema cosido en el interior del cuello</span>
                  <input
                    value={design.innerMotto}
                    onChange={(e) => update('innerMotto', e.target.value.slice(0, 34))}
                    maxLength={34}
                    className={FIELD_CLASS}
                    placeholder="ORGULLO DE PARLA · EST. 2018"
                  />
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Corte de mangas</span>
                  <select
                    value={design.sleeveStyle}
                    onChange={(e) => update('sleeveStyle', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_SLEEVES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Franjas y vivos en hombros</span>
                  <select
                    value={design.shoulderStripes}
                    onChange={(e) => update('shoulderStripes', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_SHOULDER_STRIPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Acabado de puños (Cuffs)</span>
                  <select
                    value={design.cuffStyle}
                    onChange={(e) => update('cuffStyle', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_CUFF_STYLES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Paneles laterales transpirables</span>
                  <select
                    value={design.panelStyle}
                    onChange={(e) => update('panelStyle', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_PANELS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-2 border-t border-card-border pt-3 dark:border-white/5">
                  <ColorField label="Color de Mangas" value={design.sleeveColor} onChange={(v) => update('sleeveColor', v)} />
                  <ColorField label="Color de Cuello, Puños y Hombros" value={design.accent} onChange={(v) => update('accent', v)} />
                  <ColorField label="Color de Paneles Laterales" value={design.panelColor} onChange={(v) => update('panelColor', v)} />
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: ESCUDO, MARCAS, PATROCINADOR Y PARCHES */}
          {activeTab === 'logos' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Escudo, Sponsors & Parches
                </h2>
                <span className="text-[10px] font-bold text-re-rojo">Subida PNG/SVG</span>
              </div>

              {/* Club Crest */}
              <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                <ToggleField label="Mostrar Escudo del Club" checked={design.showCrest} onChange={(v) => update('showCrest', v)} />
                {design.showCrest && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block space-y-1">
                        <span className={LABEL_CLASS}>Ubicación</span>
                        <select
                          value={design.crestPosition}
                          onChange={(e) => update('crestPosition', e.target.value)}
                          className={FIELD_CLASS}
                        >
                          {KIT_CREST_POSITIONS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className={LABEL_CLASS}>Acabado</span>
                        <select
                          value={design.crestStyle}
                          onChange={(e) => update('crestStyle', e.target.value)}
                          className={FIELD_CLASS}
                        >
                          {KIT_CREST_STYLES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <RangeField
                      label="Tamaño del escudo"
                      value={design.crestScale}
                      min={65}
                      max={145}
                      unit="%"
                      onChange={(v) => update('crestScale', v)}
                      onReset={() => update('crestScale', 100)}
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <label className="cursor-pointer rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-foreground hover:border-re-rojo">
                        📤 Subir Escudo Propio
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          onChange={(e) => handleImageUpload('customCrestUrl', e)}
                          className="hidden"
                        />
                      </label>
                      {design.customCrestUrl && (
                        <button
                          type="button"
                          onClick={() => update('customCrestUrl', '')}
                          className="text-[10px] font-bold text-re-rojo hover:underline"
                        >
                          Usar escudo RELI
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Technical Brand */}
              <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                <ToggleField label="Marca Deportiva Técnica" checked={design.showBrand} onChange={(v) => update('showBrand', v)} />
                {design.showBrand && (
                  <>
                    <label className="block space-y-1">
                      <span className={LABEL_CLASS}>Fabricante</span>
                      <select
                        value={design.brand}
                        onChange={(e) => update('brand', e.target.value)}
                        className={FIELD_CLASS}
                      >
                        {KIT_MANUFACTURERS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <ColorField label="Color de la Marca" value={design.brandColor} onChange={(v) => update('brandColor', v)} />
                  </>
                )}
              </div>

              {/* Main Sponsor */}
              <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                <span className={LABEL_CLASS}>Patrocinador Frontal (Texto o Logo)</span>
                <input
                  value={design.sponsor}
                  onChange={(e) => update('sponsor', e.target.value.slice(0, 24))}
                  maxLength={24}
                  className={FIELD_CLASS}
                  placeholder="RELI"
                />
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Estilo de integración</span>
                  <select
                    value={design.sponsorStyle}
                    onChange={(e) => update('sponsorStyle', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_SPONSOR_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <RangeField
                    label="Escala Sponsor"
                    value={design.sponsorScale}
                    min={60}
                    max={150}
                    unit="%"
                    onChange={(v) => update('sponsorScale', v)}
                    onReset={() => update('sponsorScale', 100)}
                  />
                  <RangeField
                    label="Altura Pecho"
                    value={design.sponsorY}
                    min={215}
                    max={330}
                    onChange={(v) => update('sponsorY', v)}
                    onReset={() => update('sponsorY', 265)}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="cursor-pointer rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-foreground hover:border-re-rojo">
                    📤 Subir Logo Sponsor (PNG/SVG)
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={(e) => handleImageUpload('customSponsorUrl', e)}
                      className="hidden"
                    />
                  </label>
                  {design.customSponsorUrl && (
                    <button
                      type="button"
                      onClick={() => update('customSponsorUrl', '')}
                      className="text-[10px] font-bold text-re-rojo hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              {/* Sleeve Patches & Captain Armband */}
              <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Parche oficial en manga derecha</span>
                  <select
                    value={design.sleeveBadge}
                    onChange={(e) => update('sleeveBadge', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_SLEEVE_BADGES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </label>
                <ToggleField
                  label="Brazalete de Capitán (Manga izquierda)"
                  checked={design.captainArmband}
                  onChange={(v) => update('captainArmband', v)}
                />
                {design.captainArmband && (
                  <ColorField
                    label="Color del Brazalete"
                    value={design.captainColor}
                    onChange={(v) => update('captainColor', v)}
                  />
                )}
                <ToggleField
                  label="Etiqueta de Autenticidad (Jock-Tag inferior)"
                  checked={design.showJockTag}
                  onChange={(v) => update('showJockTag', v)}
                />
              </div>
            </section>
          )}

          {/* TAB 4: DORSAL Y TIPOGRAFÍA */}
          {activeTab === 'typography' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Tipografía & Dorsales
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground">6 Fuentes Pro</span>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Nombre del Jugador / Club</span>
                  <input
                    value={design.teamName}
                    onChange={(e) => update('teamName', e.target.value.slice(0, 28))}
                    maxLength={28}
                    className={FIELD_CLASS}
                    placeholder="REAL LISIADOS"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className={LABEL_CLASS}>Número Dorsal (1-99)</span>
                    <input
                      value={design.number}
                      onChange={(e) => update('number', e.target.value.replace(/\D/g, '').slice(0, 2))}
                      maxLength={2}
                      inputMode="numeric"
                      className={FIELD_CLASS}
                      placeholder="10"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={LABEL_CLASS}>Inscripción Inferior</span>
                    <input
                      value={design.season}
                      onChange={(e) => update('season', e.target.value.slice(0, 14))}
                      maxLength={14}
                      className={FIELD_CLASS}
                      placeholder="2026/27"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Familia Tipográfica</span>
                  <select
                    value={design.fontFamily}
                    onChange={(e) => update('fontFamily', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={LABEL_CLASS}>Disposición del Nombre</span>
                  <select
                    value={design.nameStyle}
                    onChange={(e) => update('nameStyle', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {KIT_NAME_STYLES.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>

                <RangeField
                  label="Tamaño del Dorsal Trasero"
                  value={design.numberScale}
                  min={70}
                  max={130}
                  unit="%"
                  onChange={(v) => update('numberScale', v)}
                  onReset={() => update('numberScale', 100)}
                />

                <div className="space-y-2 pt-1">
                  <ToggleField
                    label="Dorsal frontal pequeño (Estilo Selección)"
                    checked={design.showFrontNumber}
                    onChange={(v) => update('showFrontNumber', v)}
                  />
                  <ToggleField
                    label="Contorno exterior en el dorsal"
                    checked={design.showNumberOutline}
                    onChange={(v) => update('showNumberOutline', v)}
                  />
                  <ToggleField
                    label="Calado interior deportivo en el número"
                    checked={design.showNumberBackDetail}
                    onChange={(v) => update('showNumberBackDetail', v)}
                  />
                </div>

                <div className="space-y-2 border-t border-card-border pt-3 dark:border-white/5">
                  <ColorField label="Color del Dorsal" value={design.numberColor} onChange={(v) => update('numberColor', v)} />
                  <ColorField label="Color del Nombre" value={design.nameColor} onChange={(v) => update('nameColor', v)} />
                  <ColorField label="Color del Contorno" value={design.accent} onChange={(v) => update('accent', v)} />
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: PANTALÓN Y MEDIAS */}
          {activeTab === 'bottoms' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Pantalón & Medias
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground">Tren Inferior</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Pantalón Corto</span>
                  <ColorField label="Color del Pantalón" value={design.shortsColor} onChange={(v) => update('shortsColor', v)} />
                  <ToggleField label="Dorsal en el pantalón" checked={design.shortsNumber} onChange={(v) => update('shortsNumber', v)} />
                  <ToggleField label="Escudo en el pantalón" checked={design.shortsCrest} onChange={(v) => update('shortsCrest', v)} />
                </div>

                <div className="space-y-2.5 rounded-xl border border-card-border bg-background/50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Medias de Competición</span>
                  <ColorField label="Color Principal de Medias" value={design.socksColor} onChange={(v) => update('socksColor', v)} />
                  <ColorField
                    label="Color de la Vuelta Superior"
                    value={design.socksStripeColor}
                    onChange={(v) => update('socksStripeColor', v)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: PALETA GLOBAL Y COLECCIÓN GUARDADA */}
          {activeTab === 'colors' && (
            <section className="space-y-4 rounded-2xl border border-card-border bg-card-bg p-4 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-5">
              <div className="flex items-center justify-between border-b border-card-border pb-3 dark:border-white/5">
                <h2 className="text-sm font-black italic uppercase tracking-wider text-foreground dark:text-white">
                  Mis Kits Guardados & Paleta
                </h2>
                <span className="text-[10px] font-bold text-re-rojo">{savedCollection.length}/12</span>
              </div>

              {/* Save to collection box */}
              <div className="space-y-2 rounded-xl border border-card-border bg-background/50 p-3">
                <span className={LABEL_CLASS}>Guardar diseño actual en tu galería</span>
                <div className="flex gap-2">
                  <input
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Ej: 1ª Equipación Dorada..."
                    className={FIELD_CLASS}
                  />
                  <button type="button" onClick={handleSave} className={PRIMARY_BUTTON}>
                    Guardar
                  </button>
                </div>

                {savedCollection.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pt-1">
                    {savedCollection.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-card-border bg-card-bg px-3 py-2 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setDesign(normalizeKitDesign(entry.design));
                            setNotice(`Cargado: ${entry.title}`);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left font-bold text-foreground hover:text-re-rojo"
                        >
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                            style={{ backgroundColor: entry.design.primary }}
                          />
                          <span className="truncate">{entry.title}</span>
                          <span className="text-[9px] text-muted-foreground">{entry.updatedAt}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(entry.id)}
                          className="text-[10px] font-black text-muted-foreground hover:text-re-rojo"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Global Color Palette */}
              <div className="space-y-2 pt-1">
                <p className={LABEL_CLASS}>Resumen Rápido de Colores</p>
                <ColorField label="Torso Principal" value={design.primary} onChange={(v) => update('primary', v)} />
                <ColorField label="Gráfico Secundario" value={design.secondary} onChange={(v) => update('secondary', v)} />
                <ColorField label="Gráfico Terciario" value={design.tertiary} onChange={(v) => update('tertiary', v)} />
                <ColorField label="Mangas" value={design.sleeveColor} onChange={(v) => update('sleeveColor', v)} />
                <ColorField label="Cuello y Detalles" value={design.accent} onChange={(v) => update('accent', v)} />
                <ColorField label="Sponsor Frontal" value={design.text} onChange={(v) => update('text', v)} />
              </div>
            </section>
          )}
        </aside>

        {/* Right Studio Stage */}
        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-card-border bg-card-bg p-3 shadow-card dark:border-re-dorado/30 dark:bg-[#070C15] sm:p-4">
            {/* Stage Toolbar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl border border-card-border bg-background/60 p-1">
                <button
                  type="button"
                  onClick={() => setView('3d')}
                  aria-pressed={view === '3d'}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    view === '3d' ? 'bg-re-rojo text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>🕹️</span>
                  <span>Maniquí 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('2d')}
                  aria-pressed={view === '2d'}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    view === '2d' ? 'bg-re-rojo text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>📐</span>
                  <span>Mockup 2D Pro</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={view === '3d' ? handleDownload3D : handleDownload2D}
                  disabled={exporting}
                  className={PRIMARY_BUTTON}
                >
                  {exporting ? 'Renderizando...' : view === '3d' ? '📸 Captura 3D HD' : '📥 Descargar Lámina 2D'}
                </button>
              </div>
            </div>

            {/* Viewport */}
            {view === '2d' ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,#172033,#050811_75%)] p-4 sm:p-6">
                <div className="relative space-y-6">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
                      Official Concept Mockup
                    </p>
                    <p className="mt-1 text-base font-black uppercase tracking-[0.18em] text-white/90">
                      {design.teamName} · {design.season}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <PreviewFrame label="Camiseta · Frontal">
                      <ShirtSvg
                        design={design}
                        side="front"
                        crestDataUrl={crestDataUrl}
                        className="mx-auto block h-auto w-full max-w-[260px] drop-shadow-[0_22px_32px_rgba(0,0,0,0.6)]"
                      />
                    </PreviewFrame>
                    <PreviewFrame label="Camiseta · Espalda">
                      <ShirtSvg
                        design={design}
                        side="back"
                        crestDataUrl={crestDataUrl}
                        className="mx-auto block h-auto w-full max-w-[260px] drop-shadow-[0_22px_32px_rgba(0,0,0,0.6)]"
                      />
                    </PreviewFrame>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <PreviewFrame label="Pantalón · Frontal">
                      <ShortsSvg
                        design={design}
                        side="front"
                        crestDataUrl={crestDataUrl}
                        className="mx-auto block h-auto w-full max-w-[230px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
                      />
                    </PreviewFrame>
                    <PreviewFrame label="Pantalón · Trasero">
                      <ShortsSvg
                        design={design}
                        side="back"
                        crestDataUrl={crestDataUrl}
                        className="mx-auto block h-auto w-full max-w-[230px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
                      />
                    </PreviewFrame>
                    <PreviewFrame label="Medias Oficiales">
                      <SocksSvg
                        design={design}
                        className="mx-auto block h-auto w-full max-w-[135px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
                      />
                    </PreviewFrame>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[580px] sm:h-[700px]">
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#070C15]">
                      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-re-dorado border-t-transparent" />
                        Cargando estudio 3D...
                      </div>
                    </div>
                  }
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

            {notice && (
              <p
                className="mt-3 rounded-xl border border-re-rojo/25 bg-re-rojo/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-re-rojo"
                role="status"
              >
                {notice}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Offscreen high-res SVG render targets */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0"
      >
        <ShirtSvg ref={shirtFrontRef} design={design} side="front" crestDataUrl={crestDataUrl} />
        <ShirtSvg ref={shirtBackRef} design={design} side="back" crestDataUrl={crestDataUrl} />
        <ShortsSvg ref={shortsFrontRef} design={design} side="front" crestDataUrl={crestDataUrl} />
        <ShortsSvg ref={shortsBackRef} design={design} side="back" crestDataUrl={crestDataUrl} />
        <SocksSvg ref={socksRef} design={design} />
      </div>
    </main>
  );
}
