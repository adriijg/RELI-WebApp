export const KIT_STORAGE_KEY = 'reli-kit-design-v2';
export const KIT_SAVED_LIST_KEY = 'reli-kit-saved-collection-v1';

// Realistic anatomical 2D garment paths (relaxed 38-degree sleeves, natural waist taper, drop-tail hem)
export const SHIRT_OUTER_PATH =
  'M 142 54 ' +
  'C 162 66, 238 66, 258 54 ' +
  'C 278 58, 304 68, 326 82 ' +
  'C 350 98, 372 132, 386 174 ' +
  'L 338 206 ' +
  'C 326 184, 314 166, 304 154 ' +
  'C 300 206, 296 266, 298 336 ' +
  'C 300 390, 304 438, 306 474 ' +
  'C 272 492, 128 492, 94 474 ' +
  'C 96 438, 100 390, 102 336 ' +
  'C 104 266, 100 206, 96 154 ' +
  'C 86 166, 74 184, 62 206 ' +
  'L 14 174 ' +
  'C 28 132, 50 98, 74 82 ' +
  'C 96 68, 122 58, 142 54 Z';

export const SHIRT_TORSO_PATH =
  'M 142 54 ' +
  'C 162 66, 238 66, 258 54 ' +
  'L 276 60 ' +
  'C 286 96, 296 128, 304 154 ' +
  'C 300 206, 296 266, 298 336 ' +
  'C 300 390, 304 438, 306 474 ' +
  'C 272 492, 128 492, 94 474 ' +
  'C 96 438, 100 390, 102 336 ' +
  'C 104 266, 100 206, 96 154 ' +
  'C 104 128, 114 96, 124 60 Z';

export const LEFT_SLEEVE_PATH =
  'M 142 54 ' +
  'C 122 58, 96 68, 74 82 ' +
  'C 50 98, 28 132, 14 174 ' +
  'L 62 206 ' +
  'C 74 184, 86 166, 96 154 ' +
  'C 104 128, 114 96, 124 60 Z';

export const RIGHT_SLEEVE_PATH =
  'M 258 54 ' +
  'C 278 58, 304 68, 326 82 ' +
  'C 350 98, 372 132, 386 174 ' +
  'L 338 206 ' +
  'C 326 184, 314 166, 304 154 ' +
  'C 296 128, 286 96, 276 60 Z';

export const SHORTS_PATH =
  'M 76 18 ' +
  'C 118 12, 182 12, 224 18 ' +
  'C 232 48, 238 82, 244 124 ' +
  'L 248 196 ' +
  'C 220 204, 188 202, 166 196 ' +
  'L 154 118 ' +
  'C 152 112, 148 112, 146 118 ' +
  'L 134 196 ' +
  'C 112 202, 80 204, 52 196 ' +
  'L 56 124 ' +
  'C 62 82, 68 48, 76 18 Z';

export const SOCKS_PATH =
  'M 34 12 ' +
  'C 48 8, 76 8, 90 12 ' +
  'L 86 156 ' +
  'C 86 174, 92 188, 104 198 ' +
  'L 124 214 ' +
  'C 134 222, 136 236, 128 246 ' +
  'C 120 256, 104 258, 88 252 ' +
  'L 42 234 ' +
  'C 28 228, 24 214, 26 194 ' +
  'L 34 12 Z';

export const SHIRT_PATH = SHIRT_OUTER_PATH;

export const SHIRT_VIEWBOX = { width: 400, height: 520 };
export const SHORTS_VIEWBOX = { width: 300, height: 220 };
export const SOCKS_VIEWBOX = { width: 150, height: 270 };

export const KIT_PATTERNS = [
  { id: 'solid', label: 'Liso Clásico', category: 'Clásicos' },
  { id: 'stripes', label: 'Rayas Verticales', category: 'Clásicos' },
  { id: 'wide-stripes', label: 'Banda Central Ancha (Estilo Ajax)', category: 'Clásicos' },
  { id: 'blaugrana', label: 'Franjas Tricolor (3 Colores)', category: 'Clásicos' },
  { id: 'pinstripes', label: 'Rayas Finas (Pinstripes)', category: 'Clásicos' },
  { id: 'hoops', label: 'Aros Horizontales (Hoops)', category: 'Clásicos' },
  { id: 'sash', label: 'Banda Diagonal (Sash)', category: 'Clásicos' },
  { id: 'double-sash', label: 'Doble Banda Diagonal', category: 'Clásicos' },
  { id: 'halves', label: 'Mitades (Half & Half)', category: 'Clásicos' },
  { id: 'quarters', label: 'Cuartos / Arlequín', category: 'Clásicos' },
  { id: 'cross', label: 'Cruz Escandinava / Centenario', category: 'Clásicos' },
  { id: 'chevron', label: 'Gran Chevron en V', category: 'Modernos' },
  { id: 'multi-chevron', label: 'Cascada de Chevrons', category: 'Modernos' },
  { id: 'diagonal', label: 'Rayas Diagonales Dinámicas', category: 'Modernos' },
  { id: 'fade-stripes', label: 'Rayas en Degradado (Fade)', category: 'Modernos' },
  { id: 'gradient', label: 'Degradado Suave', category: 'Modernos' },
  { id: 'gradient-diag', label: 'Degradado Bicolor Diagonal', category: 'Modernos' },
  { id: 'grid', label: 'Damero / Cuadros (Estilo Croacia)', category: 'Gráficos' },
  { id: 'honeycomb', label: 'Panal Hexagonal Pro', category: 'Gráficos' },
  { id: 'sunburst', label: 'Rayos desde el Escudo', category: 'Gráficos' },
  { id: 'lightning', label: 'Rayos Eléctricos 90s', category: 'Gráficos' },
  { id: 'waves', label: 'Ondas Orgánicas', category: 'Gráficos' },
  { id: 'camo', label: 'Camuflaje Geométrico', category: 'Gráficos' },
];

export const KIT_CHEST_BANDS = [
  { id: 'none', label: 'Sin franja de pecho' },
  { id: 'horizontal', label: 'Franja horizontal ancha' },
  { id: 'double', label: 'Doble franja deportiva' },
  { id: 'v-chest', label: 'Chevron de pecho' },
  { id: 'center-stripe', label: 'Franja vertical central' },
];

export const KIT_COLLARS = [
  { id: 'round', label: 'Redondo (Crew Neck)' },
  { id: 'vneck', label: 'Pico Deportivo (V-Neck)' },
  { id: 'overlap', label: 'Pico Cruzado (Overlap V)' },
  { id: 'polo', label: 'Polo Clásico con Botones' },
  { id: 'mandarin', label: 'Cuello Mao / Mandarin' },
  { id: 'cutout', label: 'Corte Olímpico Moderno' },
];

export const KIT_SLEEVES = [
  { id: 'raglan', label: 'Raglán anatómico con malla' },
  { id: 'contrast', label: 'Manga entera en contraste' },
  { id: 'classic', label: 'Manga continua del torso' },
];

export const KIT_SHOULDER_STRIPES = [
  { id: 'none', label: 'Sin franjas en hombros' },
  { id: 'three-stripes', label: '3 Franjas en hombros' },
  { id: 'piping', label: 'Vivo fino en costura Raglán' },
  { id: 'panel', label: 'Banda ancha de hombro' },
];

export const KIT_CUFF_STYLES = [
  { id: 'solid', label: 'Puño liso' },
  { id: 'double', label: 'Puño con doble línea' },
  { id: 'tricolor', label: 'Puño tricolor' },
];

export const KIT_PANELS = [
  { id: 'mesh', label: 'Paneles laterales micro-perforados' },
  { id: 'solid', label: 'Cortes laterales en contraste' },
  { id: 'none', label: 'Torso limpio sin paneles' },
];

export const KIT_MANUFACTURERS = [
  { id: 'reli', label: 'RELI Pro Sportswear' },
  { id: 'swoosh', label: 'Swoosh Pro' },
  { id: 'stripes', label: 'Triple Stripe' },
  { id: 'puma', label: 'Wildcat Leap' },
  { id: 'hummel', label: 'Double Chevron' },
  { id: 'joma', label: 'Athletic J' },
  { id: 'kelme', label: 'Paw Print' },
  { id: 'kappa', label: 'Omni Silhouette' },
  { id: 'umbro', label: 'Double Diamond' },
  { id: 'none', label: 'Sin marca técnica' },
];

export const KIT_FONTS = [
  { id: 'athletic', label: 'Premier Athletic Block' },
  { id: 'modern', label: 'LaLiga Modern Geometric' },
  { id: 'condensed', label: 'Ultra Condensed Pro' },
  { id: 'stencil', label: 'Serie A Stencil Cut' },
  { id: 'serif', label: '90s Vintage Serif' },
  { id: 'cyber', label: 'Futuristic Edge' },
];

export const KIT_NAME_STYLES = [
  { id: 'straight', label: 'Superior recto' },
  { id: 'arched', label: 'Superior arqueado (Curvo)' },
  { id: 'bottom', label: 'Inferior (Bajo el dorsal)' },
];

export const KIT_CREST_POSITIONS = [
  { id: 'left', label: 'Pecho izquierdo' },
  { id: 'center', label: 'Centrado (Estilo Campeón)' },
  { id: 'right', label: 'Pecho derecho' },
];

export const KIT_CREST_STYLES = [
  { id: 'full', label: 'Escudo Oficial a todo color' },
  { id: 'gold', label: 'Monocromo Dorado (Edición Especial)' },
  { id: 'mono-light', label: 'Monocromo Claro / Blanco' },
  { id: 'mono-dark', label: 'Monocromo Oscuro / Negro' },
  { id: 'shield', label: 'Escudo Minimalista Vectorial' },
];

export const KIT_SPONSOR_STYLES = [
  { id: 'text', label: 'Tipografía limpia con borde' },
  { id: 'band', label: 'Banda horizontal completa' },
  { id: 'box', label: 'Caja deportiva redondeada' },
  { id: 'frame', label: 'Marco lineal elegante' },
  { id: 'none', label: 'Sin patrocinador frontal' },
];

export const KIT_SLEEVE_BADGES = [
  { id: 'none', label: 'Sin parche de manga' },
  { id: 'league', label: 'Parche Liga Municipal Parla' },
  { id: 'champions', label: 'Parche Campeones Oro' },
  { id: 'respect', label: 'Parche Fair Play / Respeto' },
];

export const KIT_PRESETS = [
  {
    id: 'home',
    name: '1ª Equipación · Local',
    badge: '1ª Local',
    description: 'Rojo carmesí clásico con detalles en oro noble y blanco.',
    primary: '#D91929',
    secondary: '#FFFFFF',
    tertiary: '#990F1B',
    accent: '#C9A259',
    text: '#FFFFFF',
    sleeveColor: '#B81422',
    shortsColor: '#D91929',
    socksColor: '#D91929',
    socksStripeColor: '#FFFFFF',
    panelColor: '#FFFFFF',
    nameColor: '#FFFFFF',
    numberColor: '#FFFFFF',
    brandColor: '#C9A259',
    pattern: 'fade-stripes',
    patternScale: 100,
    patternRotation: 0,
    patternOpacity: 90,
    chestBand: 'none',
    collar: 'overlap',
    sleeveStyle: 'raglan',
    shoulderStripes: 'three-stripes',
    cuffStyle: 'double',
    panelStyle: 'mesh',
    brand: 'reli',
    fontFamily: 'athletic',
    sponsorStyle: 'text',
    crestStyle: 'full',
    sleeveBadge: 'league',
  },
  {
    id: 'away',
    name: '2ª Equipación · Visitante',
    badge: '2ª Visitante',
    description: 'Negro obsidiana con patrón geométrico dorado y cuello en pico.',
    primary: '#0D1117',
    secondary: '#C9A259',
    tertiary: '#1E293B',
    accent: '#C9A259',
    text: '#C9A259',
    sleeveColor: '#0D1117',
    shortsColor: '#0D1117',
    socksColor: '#0D1117',
    socksStripeColor: '#C9A259',
    panelColor: '#C9A259',
    nameColor: '#C9A259',
    numberColor: '#C9A259',
    brandColor: '#C9A259',
    pattern: 'honeycomb',
    patternScale: 110,
    patternRotation: 0,
    patternOpacity: 35,
    chestBand: 'none',
    collar: 'vneck',
    sleeveStyle: 'classic',
    shoulderStripes: 'piping',
    cuffStyle: 'double',
    panelStyle: 'solid',
    brand: 'reli',
    fontFamily: 'modern',
    sponsorStyle: 'text',
    crestStyle: 'gold',
    sleeveBadge: 'champions',
  },
  {
    id: 'third',
    name: '3ª Equipación · Alternativa',
    badge: '3ª Blanca',
    description: 'Blanco perla con banda diagonal roja y ribetes azul marino.',
    primary: '#F8FAFC',
    secondary: '#D91929',
    tertiary: '#0F172A',
    accent: '#0F172A',
    text: '#0F172A',
    sleeveColor: '#F8FAFC',
    shortsColor: '#0F172A',
    socksColor: '#F8FAFC',
    socksStripeColor: '#D91929',
    panelColor: '#D91929',
    nameColor: '#0F172A',
    numberColor: '#D91929',
    brandColor: '#0F172A',
    pattern: 'sash',
    patternScale: 100,
    patternRotation: 0,
    patternOpacity: 95,
    chestBand: 'none',
    collar: 'polo',
    sleeveStyle: 'classic',
    shoulderStripes: 'none',
    cuffStyle: 'tricolor',
    panelStyle: 'none',
    brand: 'reli',
    fontFamily: 'condensed',
    sponsorStyle: 'box',
    crestStyle: 'full',
    sleeveBadge: 'league',
  },
  {
    id: 'gk',
    name: 'Portero · Esmeralda Pro',
    badge: 'Portero',
    description: 'Verde esmeralda intenso con ondas dinámicas y acentos lima.',
    primary: '#047857',
    secondary: '#10B981',
    tertiary: '#064E3B',
    accent: '#A7F3D0',
    text: '#FFFFFF',
    sleeveColor: '#064E3B',
    shortsColor: '#064E3B',
    socksColor: '#047857',
    socksStripeColor: '#A7F3D0',
    panelColor: '#10B981',
    nameColor: '#FFFFFF',
    numberColor: '#FFFFFF',
    brandColor: '#A7F3D0',
    pattern: 'waves',
    patternScale: 115,
    patternRotation: -15,
    patternOpacity: 65,
    chestBand: 'none',
    collar: 'cutout',
    sleeveStyle: 'raglan',
    shoulderStripes: 'piping',
    cuffStyle: 'solid',
    panelStyle: 'mesh',
    brand: 'reli',
    fontFamily: 'stencil',
    sponsorStyle: 'text',
    crestStyle: 'full',
    sleeveBadge: 'respect',
  },
  {
    id: 'retro',
    name: 'Clásica 90s · Centenario',
    badge: 'Retro 90s',
    description: 'Inspirada en los años 90 con cuello polo, chevrons y corte clásico.',
    primary: '#1E3A8A',
    secondary: '#D91929',
    tertiary: '#FFFFFF',
    accent: '#FFFFFF',
    text: '#FFFFFF',
    sleeveColor: '#1E3A8A',
    shortsColor: '#FFFFFF',
    socksColor: '#1E3A8A',
    socksStripeColor: '#D91929',
    panelColor: '#FFFFFF',
    nameColor: '#FFFFFF',
    numberColor: '#FFFFFF',
    brandColor: '#FFFFFF',
    pattern: 'multi-chevron',
    patternScale: 100,
    patternRotation: 0,
    patternOpacity: 90,
    chestBand: 'none',
    collar: 'polo',
    sleeveStyle: 'contrast',
    shoulderStripes: 'three-stripes',
    cuffStyle: 'tricolor',
    panelStyle: 'solid',
    brand: 'hummel',
    fontFamily: 'serif',
    sponsorStyle: 'band',
    crestStyle: 'full',
    sleeveBadge: 'champions',
  },
];

export const DEFAULT_KIT = {
  teamName: 'REAL LISIADOS',
  season: '2026/27',
  number: '10',
  sponsor: 'RELI',
  innerMotto: 'ORGULLO DE PARLA · EST. 2018',
  primary: '#D91929',
  secondary: '#FFFFFF',
  tertiary: '#990F1B',
  accent: '#C9A259',
  text: '#FFFFFF',
  sleeveColor: '#B81422',
  shortsColor: '#D91929',
  socksColor: '#D91929',
  socksStripeColor: '#FFFFFF',
  panelColor: '#FFFFFF',
  nameColor: '#FFFFFF',
  numberColor: '#FFFFFF',
  brandColor: '#C9A259',
  pattern: 'fade-stripes',
  patternScale: 100,
  patternRotation: 0,
  patternOffsetX: 0,
  patternOffsetY: 0,
  patternOpacity: 90,
  patternOnSleeves: false,
  patternOnBack: true,
  backBoxSolid: true,
  chestBand: 'none',
  chestBandColor: '#FFFFFF',
  collar: 'overlap',
  sleeveStyle: 'raglan',
  shoulderStripes: 'three-stripes',
  cuffStyle: 'double',
  panelStyle: 'mesh',
  brand: 'reli',
  fontFamily: 'athletic',
  nameStyle: 'arched',
  crestPosition: 'left',
  crestStyle: 'full',
  crestScale: 100,
  sponsorStyle: 'text',
  sponsorScale: 100,
  sponsorY: 265,
  numberScale: 100,
  sleeveBadge: 'league',
  captainArmband: false,
  captainColor: '#FACC15',
  showCrest: true,
  showBrand: true,
  showJockTag: true,
  showFrontNumber: false,
  showNumberOutline: true,
  showNumberBackDetail: true,
  shortsNumber: true,
  shortsCrest: true,
  customCrestUrl: '',
  customSponsorUrl: '',
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const safeColor = (value, fallback) => (HEX_COLOR.test(value || '') ? value : fallback);

const safeText = (value, fallback, maxLength) => {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
};

const safeNumber = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const pickOption = (options, value, fallback) => (
  options.some((item) => item.id === value) ? value : fallback
);

export function normalizeKitDesign(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const primary = safeColor(source.primary, DEFAULT_KIT.primary);
  const secondary = safeColor(source.secondary, DEFAULT_KIT.secondary);
  const tertiary = safeColor(source.tertiary, DEFAULT_KIT.tertiary);
  const text = safeColor(source.text, DEFAULT_KIT.text);
  const accent = safeColor(source.accent, DEFAULT_KIT.accent);
  const number = safeText(source.number, DEFAULT_KIT.number, 2).replace(/[^0-9]/g, '') || DEFAULT_KIT.number;

  return {
    teamName: safeText(source.teamName, DEFAULT_KIT.teamName, 28),
    season: safeText(source.season, DEFAULT_KIT.season, 14),
    number,
    sponsor: safeText(source.sponsor, DEFAULT_KIT.sponsor, 24),
    innerMotto: safeText(source.innerMotto, DEFAULT_KIT.innerMotto, 34),
    primary,
    secondary,
    tertiary,
    accent,
    text,
    sleeveColor: safeColor(source.sleeveColor, primary),
    shortsColor: safeColor(source.shortsColor, DEFAULT_KIT.shortsColor),
    socksColor: safeColor(source.socksColor, DEFAULT_KIT.socksColor),
    socksStripeColor: safeColor(source.socksStripeColor, secondary),
    panelColor: safeColor(source.panelColor, secondary),
    nameColor: safeColor(source.nameColor, text),
    numberColor: safeColor(source.numberColor, text),
    brandColor: safeColor(source.brandColor, accent),
    pattern: pickOption(KIT_PATTERNS, source.pattern, DEFAULT_KIT.pattern),
    patternScale: safeNumber(source.patternScale, DEFAULT_KIT.patternScale, 40, 220),
    patternRotation: safeNumber(source.patternRotation, DEFAULT_KIT.patternRotation, -180, 180),
    patternOffsetX: safeNumber(source.patternOffsetX, DEFAULT_KIT.patternOffsetX, -150, 150),
    patternOffsetY: safeNumber(source.patternOffsetY, DEFAULT_KIT.patternOffsetY, -150, 150),
    patternOpacity: safeNumber(source.patternOpacity, DEFAULT_KIT.patternOpacity, 10, 100),
    patternOnSleeves: Boolean(source.patternOnSleeves),
    patternOnBack: source.patternOnBack !== false,
    backBoxSolid: source.backBoxSolid !== false,
    chestBand: pickOption(KIT_CHEST_BANDS, source.chestBand, DEFAULT_KIT.chestBand),
    chestBandColor: safeColor(source.chestBandColor, secondary),
    collar: pickOption(KIT_COLLARS, source.collar, DEFAULT_KIT.collar),
    sleeveStyle: pickOption(KIT_SLEEVES, source.sleeveStyle, DEFAULT_KIT.sleeveStyle),
    shoulderStripes: pickOption(KIT_SHOULDER_STRIPES, source.shoulderStripes, DEFAULT_KIT.shoulderStripes),
    cuffStyle: pickOption(KIT_CUFF_STYLES, source.cuffStyle, DEFAULT_KIT.cuffStyle),
    panelStyle: pickOption(KIT_PANELS, source.panelStyle, DEFAULT_KIT.panelStyle),
    brand: pickOption(KIT_MANUFACTURERS, source.brand, DEFAULT_KIT.brand),
    fontFamily: pickOption(KIT_FONTS, source.fontFamily, DEFAULT_KIT.fontFamily),
    nameStyle: pickOption(KIT_NAME_STYLES, source.nameStyle, DEFAULT_KIT.nameStyle),
    crestPosition: pickOption(KIT_CREST_POSITIONS, source.crestPosition, DEFAULT_KIT.crestPosition),
    crestStyle: pickOption(KIT_CREST_STYLES, source.crestStyle, DEFAULT_KIT.crestStyle),
    crestScale: safeNumber(source.crestScale, DEFAULT_KIT.crestScale, 65, 145),
    sponsorStyle: pickOption(KIT_SPONSOR_STYLES, source.sponsorStyle, DEFAULT_KIT.sponsorStyle),
    sponsorScale: safeNumber(source.sponsorScale, DEFAULT_KIT.sponsorScale, 60, 150),
    sponsorY: safeNumber(source.sponsorY, DEFAULT_KIT.sponsorY, 210, 340),
    numberScale: safeNumber(source.numberScale, DEFAULT_KIT.numberScale, 70, 130),
    sleeveBadge: pickOption(KIT_SLEEVE_BADGES, source.sleeveBadge, DEFAULT_KIT.sleeveBadge),
    captainArmband: Boolean(source.captainArmband),
    captainColor: safeColor(source.captainColor, DEFAULT_KIT.captainColor),
    showCrest: source.showCrest !== false,
    showBrand: source.showBrand !== false,
    showJockTag: source.showJockTag !== false,
    showFrontNumber: Boolean(source.showFrontNumber),
    showNumberOutline: source.showNumberOutline !== false,
    showNumberBackDetail: source.showNumberBackDetail !== false,
    shortsNumber: source.shortsNumber !== false,
    shortsCrest: source.shortsCrest !== false,
    customCrestUrl: typeof source.customCrestUrl === 'string' ? source.customCrestUrl : '',
    customSponsorUrl: typeof source.customSponsorUrl === 'string' ? source.customSponsorUrl : '',
  };
}

const PALETTES = [
  { primary: '#D91929', secondary: '#FFFFFF', tertiary: '#880E18', accent: '#C9A259', text: '#FFFFFF' },
  { primary: '#0D1117', secondary: '#C9A259', tertiary: '#1E293B', accent: '#E21D2C', text: '#C9A259' },
  { primary: '#F8FAFC', secondary: '#D91929', tertiary: '#0F172A', accent: '#0F172A', text: '#0F172A' },
  { primary: '#1E3A8A', secondary: '#FACC15', tertiary: '#172554', accent: '#FFFFFF', text: '#FFFFFF' },
  { primary: '#065F46', secondary: '#ECFDF5', tertiary: '#022C22', accent: '#D4AF37', text: '#FFFFFF' },
  { primary: '#581C87', secondary: '#FDE047', tertiary: '#3B0764', accent: '#FFFFFF', text: '#FFFFFF' },
  { primary: '#7F1D1D', secondary: '#38BDF8', tertiary: '#450A0A', accent: '#FDE047', text: '#FFFFFF' },
  { primary: '#0F766E', secondary: '#F8FAFC', tertiary: '#134E4A', accent: '#F59E0B', text: '#FFFFFF' },
  { primary: '#18181B', secondary: '#EC4899', tertiary: '#27272A', accent: '#38BDF8', text: '#FFFFFF' },
];

const pickRandom = (options) => options[Math.floor(Math.random() * options.length)].id;

export function randomKitDesign(current = {}) {
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const pattern = pickRandom(KIT_PATTERNS);
  const collar = pickRandom(KIT_COLLARS);
  const brand = pickRandom(KIT_MANUFACTURERS.filter((b) => b.id !== 'none'));
  const fontFamily = pickRandom(KIT_FONTS);
  const useContrastSleeves = Math.random() > 0.45;
  const useSecondaryShorts = Math.random() > 0.55;

  return normalizeKitDesign({
    ...DEFAULT_KIT,
    ...current,
    ...palette,
    sleeveColor: useContrastSleeves ? palette.tertiary : palette.primary,
    shortsColor: useSecondaryShorts ? palette.secondary : palette.primary,
    socksColor: Math.random() > 0.5 ? palette.primary : palette.tertiary,
    socksStripeColor: palette.secondary,
    panelColor: palette.secondary,
    nameColor: palette.text,
    numberColor: palette.text,
    brandColor: palette.accent,
    pattern,
    patternScale: Math.floor(Math.random() * 60) + 75,
    patternRotation: Math.random() > 0.75 ? (Math.floor(Math.random() * 7) - 3) * 15 : 0,
    patternOpacity: Math.floor(Math.random() * 35) + 65,
    chestBand: Math.random() > 0.75 ? pickRandom(KIT_CHEST_BANDS) : 'none',
    chestBandColor: palette.secondary,
    collar,
    brand,
    fontFamily,
    sleeveStyle: pickRandom(KIT_SLEEVES),
    shoulderStripes: pickRandom(KIT_SHOULDER_STRIPES),
    cuffStyle: pickRandom(KIT_CUFF_STYLES),
    panelStyle: pickRandom(KIT_PANELS),
    nameStyle: pickRandom(KIT_NAME_STYLES),
    sponsorStyle: Math.random() > 0.25 ? 'text' : 'band',
    showNumberOutline: Math.random() > 0.25,
    captainArmband: Math.random() > 0.7,
  });
}

export function loadKitDesign() {
  try {
    const raw = localStorage.getItem(KIT_STORAGE_KEY);
    if (!raw) return DEFAULT_KIT;
    return normalizeKitDesign(JSON.parse(raw));
  } catch {
    return DEFAULT_KIT;
  }
}

export function saveKitDesign(design) {
  try {
    localStorage.setItem(KIT_STORAGE_KEY, JSON.stringify(normalizeKitDesign(design)));
    return true;
  } catch {
    return false;
  }
}

export function loadSavedKitCollection() {
  try {
    const raw = localStorage.getItem(KIT_SAVED_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 12).map((item) => ({
      id: String(item.id || Date.now()),
      title: String(item.title || 'Equipación'),
      updatedAt: String(item.updatedAt || ''),
      design: normalizeKitDesign(item.design),
    }));
  } catch {
    return [];
  }
}

export function saveKitToCollection(title, design) {
  try {
    const current = loadSavedKitCollection();
    const entry = {
      id: `kit-${Date.now()}`,
      title: safeText(title || `${design.teamName} ${design.season}`, 'Mi Equipación', 32),
      updatedAt: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      design: normalizeKitDesign(design),
    };
    const next = [entry, ...current].slice(0, 12);
    localStorage.setItem(KIT_SAVED_LIST_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function deleteKitFromCollection(id) {
  try {
    const current = loadSavedKitCollection();
    const next = current.filter((item) => item.id !== id);
    localStorage.setItem(KIT_SAVED_LIST_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function svgToImage(svg, width, height) {
  return new Promise((resolve, reject) => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    const markup = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}

export async function composeKitSheet({ shirtFront, shirtBack, shortsFront, shortsBack, socks, subtitle = '' }) {
  const width = 2200;
  const height = 1950;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const fetchPromises = [
    svgToImage(shirtFront, 720, 936),
    svgToImage(shirtBack, 720, 936),
    svgToImage(shortsFront, 620, 455),
    svgToImage(shortsBack, 620, 455),
  ];

  if (socks) {
    fetchPromises.push(svgToImage(socks, 280, 504));
  }

  const results = await Promise.all(fetchPromises);
  const [frontImage, backImage, shortsFrontImage, shortsBackImage, socksImage] = results;

  // Deep Studio Backdrop
  const bg = context.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#090D16');
  bg.addColorStop(1, '#03060C');
  context.fillStyle = bg;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width / 2, 420, 60, width / 2, 420, 1150);
  glow.addColorStop(0, 'rgba(217,25,41,0.22)');
  glow.addColorStop(0.55, 'rgba(201,162,89,0.08)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255,255,255,0.035)';
  context.lineWidth = 1;
  for (let x = 50; x < width; x += 50) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 50; y < height; y += 50) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.textAlign = 'center';
  context.fillStyle = '#FFFFFF';
  context.font = '900 46px Arial, sans-serif';
  context.fillText('RELI KIT CREATOR · OFFICIAL CONCEPT SHEET', width / 2, 74);
  if (subtitle) {
    context.fillStyle = '#C9A259';
    context.font = '700 20px Arial, sans-serif';
    context.fillText(subtitle.toUpperCase(), width / 2, 110);
  }

  context.fillStyle = 'rgba(255,255,255,0.45)';
  context.font = '700 15px Arial, sans-serif';
  context.fillText('CAMISETA · VISTA FRONTAL', 574, 148);
  context.fillText('CAMISETA · VISTA TRASERA', 1626, 148);
  context.fillText('PANTALÓN · FRONTAL', 420, 1270);
  context.fillText('PANTALÓN · TRASERO', 1140, 1270);
  if (socksImage) {
    context.fillText('MEDIAS OFICIALES', 1860, 1270);
  }

  context.drawImage(frontImage, 214, 168, 720, 936);
  context.drawImage(backImage, 1266, 168, 720, 936);

  context.drawImage(shortsFrontImage, 110, 1295, 620, 455);
  context.drawImage(shortsBackImage, 830, 1295, 620, 455);

  if (socksImage) {
    context.drawImage(socksImage, 1720, 1290, 280, 504);
  }

  return canvas.toDataURL('image/png');
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}
