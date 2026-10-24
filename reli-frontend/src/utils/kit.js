export const KIT_STORAGE_KEY = 'reli-kit-design-v1';

export const SHIRT_PATH = 'M154 66 C176 78 224 78 246 66 L294 78 L342 102 C356 116 366 140 372 166 L374 196 L318 226 L298 182 L298 466 C298 482 256 492 200 492 C144 492 102 482 102 466 L102 182 L82 226 L26 196 L28 166 C34 140 44 116 58 102 L106 78 Z';
export const SHORTS_PATH = 'M72 18 C112 10 188 10 228 18 C236 44 241 68 243 92 L240 198 C240 204 236 206 230 206 L186 206 C180 206 176 202 175 196 L157 126 C156 118 144 118 143 126 L125 196 C124 202 120 206 114 206 L70 206 C64 206 60 204 60 198 L57 92 C59 68 64 44 72 18 Z';

export const SHIRT_VIEWBOX = { width: 400, height: 520 };
export const SHORTS_VIEWBOX = { width: 300, height: 220 };
export const SOCKS_VIEWBOX = { width: 140, height: 280 };

export const KIT_PATTERNS = [
  { id: 'solid', label: 'Liso' },
  { id: 'stripes', label: 'Rayas' },
  { id: 'pinstripes', label: 'Rayas finas' },
  { id: 'hoops', label: 'Franjas' },
  { id: 'sash', label: 'Banda' },
  { id: 'halves', label: 'Mitades' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'grid', label: 'Cuadros' },
  { id: 'gradient', label: 'Degradado' },
];

export const KIT_COLLARS = [
  { id: 'round', label: 'Redondo' },
  { id: 'vneck', label: 'Pico' },
  { id: 'polo', label: 'Polo' },
];

export const KIT_SLEEVES = [
  { id: 'raglan', label: 'Raglán con malla' },
  { id: 'contrast', label: 'Manga de contraste' },
  { id: 'classic', label: 'Manga lisa' },
];

export const KIT_PANELS = [
  { id: 'mesh', label: 'Paneles con malla' },
  { id: 'solid', label: 'Paneles de contraste' },
  { id: 'none', label: 'Sin paneles' },
];

export const KIT_NAME_STYLES = [
  { id: 'straight', label: 'Nombre recto' },
  { id: 'arched', label: 'Nombre arqueado' },
];

export const KIT_CREST_POSITIONS = [
  { id: 'left', label: 'Izquierda' },
  { id: 'center', label: 'Centro' },
  { id: 'right', label: 'Derecha' },
];

export const KIT_SPONSOR_STYLES = [
  { id: 'band', label: 'Banda' },
  { id: 'text', label: 'Solo texto' },
  { id: 'none', label: 'Sin patrocinador' },
];

export const DEFAULT_KIT = {
  teamName: 'REAL LISIADOS',
  season: '2026/27',
  number: '10',
  sponsor: 'RELI',
  primary: '#E21D2C',
  secondary: '#FFFFFF',
  accent: '#C19A5B',
  text: '#FFFFFF',
  shortsColor: '#E21D2C',
  socksColor: '#E21D2C',
  panelColor: '#FFFFFF',
  nameColor: '#FFFFFF',
  numberColor: '#FFFFFF',
  pattern: 'solid',
  collar: 'round',
  sleeveStyle: 'raglan',
  panelStyle: 'mesh',
  nameStyle: 'straight',
  crestPosition: 'left',
  sponsorStyle: 'band',
  showCrest: true,
  showNumberOutline: true,
  shortsNumber: true,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const safeColor = (value, fallback) => (HEX_COLOR.test(value || '') ? value : fallback);

const safeText = (value, fallback, maxLength) => {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
};

const pickOption = (options, value, fallback) => (
  options.some((item) => item.id === value) ? value : fallback
);

export function normalizeKitDesign(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const secondary = safeColor(source.secondary, DEFAULT_KIT.secondary);
  const text = safeColor(source.text, DEFAULT_KIT.text);
  const number = safeText(source.number, DEFAULT_KIT.number, 2).replace(/[^0-9]/g, '') || DEFAULT_KIT.number;

  return {
    teamName: safeText(source.teamName, DEFAULT_KIT.teamName, 28),
    season: safeText(source.season, DEFAULT_KIT.season, 12),
    number,
    sponsor: safeText(source.sponsor, DEFAULT_KIT.sponsor, 22),
    primary: safeColor(source.primary, DEFAULT_KIT.primary),
    secondary,
    accent: safeColor(source.accent, DEFAULT_KIT.accent),
    text,
    shortsColor: safeColor(source.shortsColor, DEFAULT_KIT.shortsColor),
    socksColor: safeColor(source.socksColor, DEFAULT_KIT.socksColor),
    panelColor: safeColor(source.panelColor, secondary),
    nameColor: safeColor(source.nameColor, text),
    numberColor: safeColor(source.numberColor, text),
    pattern: pickOption(KIT_PATTERNS, source.pattern, DEFAULT_KIT.pattern),
    collar: pickOption(KIT_COLLARS, source.collar, DEFAULT_KIT.collar),
    sleeveStyle: pickOption(KIT_SLEEVES, source.sleeveStyle, DEFAULT_KIT.sleeveStyle),
    panelStyle: pickOption(KIT_PANELS, source.panelStyle, DEFAULT_KIT.panelStyle),
    nameStyle: pickOption(KIT_NAME_STYLES, source.nameStyle, DEFAULT_KIT.nameStyle),
    crestPosition: pickOption(KIT_CREST_POSITIONS, source.crestPosition, DEFAULT_KIT.crestPosition),
    sponsorStyle: pickOption(KIT_SPONSOR_STYLES, source.sponsorStyle, DEFAULT_KIT.sponsorStyle),
    showCrest: source.showCrest !== false,
    showNumberOutline: source.showNumberOutline !== false,
    shortsNumber: source.shortsNumber !== false,
  };
}

const PALETTES = [
  { primary: '#E21D2C', secondary: '#FFFFFF', accent: '#C19A5B', text: '#FFFFFF' },
  { primary: '#0F172A', secondary: '#E21D2C', accent: '#C19A5B', text: '#FFFFFF' },
  { primary: '#FFFFFF', secondary: '#E21D2C', accent: '#0F172A', text: '#0F172A' },
  { primary: '#1D4ED8', secondary: '#FFFFFF', accent: '#F3E5AB', text: '#FFFFFF' },
  { primary: '#166534', secondary: '#F8FAFC', accent: '#C19A5B', text: '#FFFFFF' },
  { primary: '#7C3AED', secondary: '#FDE047', accent: '#FFFFFF', text: '#FFFFFF' },
  { primary: '#111827', secondary: '#F59E0B', accent: '#F8FAFC', text: '#F8FAFC' },
  { primary: '#0E7490', secondary: '#F8FAFC', accent: '#F59E0B', text: '#F8FAFC' },
];

const pickRandom = (options) => options[Math.floor(Math.random() * options.length)].id;

export function randomKitDesign() {
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const pattern = pickRandom(KIT_PATTERNS);
  const collar = pickRandom(KIT_COLLARS);
  const number = String(Math.floor(Math.random() * 99) + 1);
  const useSecondaryShorts = Math.random() > 0.6;

  return normalizeKitDesign({
    ...DEFAULT_KIT,
    ...palette,
    shortsColor: useSecondaryShorts ? palette.secondary : palette.primary,
    socksColor: Math.random() > 0.5 ? palette.primary : palette.secondary,
    panelColor: palette.secondary,
    nameColor: palette.text,
    numberColor: palette.text,
    pattern,
    collar,
    sleeveStyle: pickRandom(KIT_SLEEVES),
    panelStyle: pickRandom(KIT_PANELS),
    nameStyle: pickRandom(KIT_NAME_STYLES),
    crestPosition: pickRandom(KIT_CREST_POSITIONS),
    sponsorStyle: Math.random() > 0.15 ? 'band' : 'text',
    showNumberOutline: Math.random() > 0.3,
    shortsNumber: Math.random() > 0.2,
    number,
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

export async function composeKitSheet({ shirtFront, shirtBack, shortsFront, shortsBack, subtitle = '' }) {
  const width = 2000;
  const height = 1900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const [frontImage, backImage, shortsFrontImage, shortsBackImage] = await Promise.all([
    svgToImage(shirtFront, 692, 900),
    svgToImage(shirtBack, 692, 900),
    svgToImage(shortsFront, 764, 560),
    svgToImage(shortsBack, 764, 560),
  ]);

  context.fillStyle = '#0B1220';
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width / 2, 240, 40, width / 2, 240, 950);
  glow.addColorStop(0, 'rgba(226,29,44,0.18)');
  glow.addColorStop(1, 'rgba(226,29,44,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(96,165,250,0.12)';
  context.lineWidth = 1;
  for (let x = 40; x < width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 40; y < height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.textAlign = 'center';
  context.fillStyle = 'rgba(255,255,255,0.95)';
  context.font = '900 44px Arial, sans-serif';
  context.fillText('2D KIT BUILDER', width / 2, 72);
  if (subtitle) {
    context.fillStyle = 'rgba(255,255,255,0.6)';
    context.font = '700 20px Arial, sans-serif';
    context.fillText(subtitle, width / 2, 106);
  }

  context.fillStyle = 'rgba(255,255,255,0.42)';
  context.font = '700 16px Arial, sans-serif';
  context.fillText('CAMISETA · DELANTERA', 536, 136);
  context.fillText('CAMISETA · TRASERA', 1464, 136);
  context.fillText('PANTALÓN · DELANTERO', 572, 1232);
  context.fillText('PANTALÓN · TRASERO', 1428, 1232);

  context.drawImage(frontImage, 190, 150, 692, 900);
  context.drawImage(backImage, 1118, 150, 692, 900);

  context.drawImage(shortsFrontImage, 190, 1250, 764, 560);
  context.drawImage(shortsBackImage, 1046, 1250, 764, 560);

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
