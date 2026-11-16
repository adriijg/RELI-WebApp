import { forwardRef, useId } from 'react';
import {
  LEFT_SLEEVE_PATH,
  RIGHT_SLEEVE_PATH,
  SHIRT_OUTER_PATH,
  SHIRT_TORSO_PATH,
  SHORTS_PATH,
  SOCKS_PATH,
} from '../../utils/kit';

const FONT_MAP = {
  athletic: "'Impact', 'Arial Black', sans-serif",
  modern: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  condensed: "'Arial Narrow', 'Impact', sans-serif",
  stencil: "'Courier New', 'Consolas', monospace",
  serif: "'Georgia', 'Times New Roman', serif",
  cyber: "'Trebuchet MS', 'Segoe UI', sans-serif",
};

const getFont = (fontFamily = 'athletic') => FONT_MAP[fontFamily] || FONT_MAP.athletic;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function fitTextSize(text, maxWidth, maxSize, minSize, factor = 0.58) {
  const length = Math.max(String(text || '').length, 1);
  return Math.round(clamp(maxWidth / (length * factor), minSize, maxSize));
}

function hexLuminance(hex) {
  const value = String(hex || '#000000').replace('#', '');
  const r = parseInt(value.slice(0, 2) || '00', 16) / 255;
  const g = parseInt(value.slice(2, 4) || '00', 16) / 255;
  const b = parseInt(value.slice(4, 6) || '00', 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasting(hex) {
  return hexLuminance(hex) > 0.55 ? '#0F172A' : '#FFFFFF';
}

function darken(hex, factor) {
  const value = String(hex || '#000000').replace('#', '');
  const parts = [0, 2, 4].map((index) => {
    const channel = Math.round(parseInt(value.slice(index, index + 2) || '00', 16) * factor);
    return clamp(channel, 0, 255).toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
}

function CommonDefs({ id, design }) {
  return (
    <>
      {/* Micro-polyester breathable fabric weave */}
      <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.55" fill="#000000" opacity="0.16" />
        <circle cx="3" cy="3" r="0.55" fill="#FFFFFF" opacity="0.08" />
      </pattern>

      <pattern id={`${id}-mesh`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="2.5" r="1.1" fill="#000000" opacity="0.28" />
      </pattern>

      <pattern id={`${id}-honeycomb`} width="28" height="48" patternUnits="userSpaceOnUse">
        <path
          d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 48 L28 40 L28 24 L14 32 L0 24 L0 40 Z"
          fill="none"
          stroke={design.secondary}
          strokeWidth="2.4"
        />
      </pattern>

      {/* Cylindrical 3D torso lighting */}
      <linearGradient id={`${id}-cylinder`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.34" />
        <stop offset="14%" stopColor="#000000" stopOpacity="0.08" />
        <stop offset="32%" stopColor="#FFFFFF" stopOpacity="0.11" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
        <stop offset="68%" stopColor="#FFFFFF" stopOpacity="0.09" />
        <stop offset="86%" stopColor="#000000" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.36" />
      </linearGradient>

      {/* Top-down studio spotlight */}
      <radialGradient id={`${id}-chest-light`} cx="50%" cy="28%" r="54%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
        <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
      </radialGradient>

      {/* Pattern gradients */}
      <linearGradient id={`${id}-pat-grad`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={design.primary} stopOpacity="0" />
        <stop offset="35%" stopColor={design.secondary} stopOpacity="0.45" />
        <stop offset="100%" stopColor={design.secondary} stopOpacity="1" />
      </linearGradient>

      <linearGradient id={`${id}-pat-grad-diag`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={design.secondary} stopOpacity="1" />
        <stop offset="55%" stopColor={design.secondary} stopOpacity="0.35" />
        <stop offset="100%" stopColor={design.tertiary || design.primary} stopOpacity="0.9" />
      </linearGradient>

      <linearGradient id={`${id}-fade-v`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={design.secondary} stopOpacity="0.98" />
        <stop offset="55%" stopColor={design.secondary} stopOpacity="0.55" />
        <stop offset="92%" stopColor={design.secondary} stopOpacity="0" />
      </linearGradient>

      {/* Monochrome crest color filters */}
      <filter id={`${id}-crest-gold`} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.45 0.45 0.1 0 0.35
                  0.36 0.36 0.08 0 0.25
                  0.16 0.16 0.04 0 0.08
                  0    0    0    1 0"
        />
      </filter>
      <filter id={`${id}-crest-light`} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.33 0.33 0.33 0 0.72
                  0.33 0.33 0.33 0 0.74
                  0.33 0.33 0.33 0 0.78
                  0    0    0    1 0"
        />
      </filter>
      <filter id={`${id}-crest-dark`} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.12 0.12 0.12 0 0.02
                  0.12 0.12 0.12 0 0.04
                  0.15 0.15 0.15 0 0.07
                  0    0    0    1 0"
        />
      </filter>

      {/* Soft cloth fold blur */}
      <filter id={`${id}-fold-blur`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="4.5" />
      </filter>
    </>
  );
}

function PatternLayer({ design, id, clipPath }) {
  const {
    pattern,
    secondary,
    tertiary,
    patternScale = 100,
    patternRotation = 0,
    patternOffsetX = 0,
    patternOffsetY = 0,
    patternOpacity = 90,
  } = design;

  if (pattern === 'solid') return null;

  const scale = clamp(patternScale / 100, 0.4, 2.4);
  const opacity = clamp(patternOpacity / 100, 0.08, 1);
  const transform = `translate(${200 + Number(patternOffsetX)} ${260 + Number(patternOffsetY)}) rotate(${patternRotation}) scale(${scale}) translate(-200 -260)`;

  return (
    <g clipPath={clipPath} opacity={opacity}>
      <g transform={transform}>
        {pattern === 'stripes' &&
          Array.from({ length: 19 }).map((_, index) => (
            <rect key={index} x={-160 + index * 38} y="-160" width="19" height="840" fill={secondary} />
          ))}

        {pattern === 'wide-stripes' && (
          <>
            <rect x="142" y="-160" width="116" height="840" fill={secondary} />
            <rect x="132" y="-160" width="5" height="840" fill={design.accent} />
            <rect x="263" y="-160" width="5" height="840" fill={design.accent} />
          </>
        )}

        {pattern === 'blaugrana' &&
          Array.from({ length: 15 }).map((_, index) => (
            <g key={index}>
              <rect x={-140 + index * 48} y="-160" width="24" height="840" fill={secondary} />
              <rect x={-140 + index * 48 + 21} y="-160" width="6" height="840" fill={tertiary || design.accent} />
            </g>
          ))}

        {pattern === 'pinstripes' &&
          Array.from({ length: 35 }).map((_, index) => (
            <rect key={index} x={-140 + index * 18} y="-160" width="2.2" height="840" fill={secondary} />
          ))}

        {pattern === 'hoops' &&
          Array.from({ length: 21 }).map((_, index) => (
            <rect key={index} x="-180" y={-140 + index * 42} width="760" height="21" fill={secondary} />
          ))}

        {pattern === 'sash' && (
          <>
            <polygon points="-80,-80 45,-80 480,520 355,520" fill={secondary} />
            <polygon points="50,-80 60,-80 495,520 485,520" fill={design.accent} />
            <polygon points="-95,-80 -85,-80 350,520 340,520" fill={design.accent} />
          </>
        )}

        {pattern === 'double-sash' && (
          <>
            <polygon points="-80,-80 -15,-80 420,520 355,520" fill={secondary} />
            <polygon points="0,-80 65,-80 500,520 435,520" fill={tertiary || secondary} />
          </>
        )}

        {pattern === 'halves' && <rect x="200" y="-180" width="420" height="880" fill={secondary} />}

        {pattern === 'quarters' && (
          <>
            <rect x="200" y="-160" width="400" height="420" fill={secondary} />
            <rect x="-200" y="260" width="400" height="420" fill={secondary} />
          </>
        )}

        {pattern === 'cross' && (
          <>
            <rect x="164" y="-160" width="44" height="840" fill={secondary} />
            <rect x="-160" y="158" width="720" height="44" fill={secondary} />
            <rect x="178" y="-160" width="16" height="840" fill={tertiary || design.accent} />
            <rect x="-160" y="172" width="720" height="16" fill={tertiary || design.accent} />
          </>
        )}

        {pattern === 'chevron' && (
          <>
            <path d="M-120 110 L200 285 L520 110 L520 185 L200 360 L-120 185 Z" fill={secondary} />
            <path d="M-120 194 L200 369 L520 194 L520 214 L200 389 L-120 214 Z" fill={design.accent} />
          </>
        )}

        {pattern === 'multi-chevron' &&
          Array.from({ length: 11 }).map((_, index) => {
            const y = -80 + index * 64;
            return (
              <path
                key={index}
                d={`M-120 ${y} L200 ${y + 95} L520 ${y} L520 ${y + 28} L200 ${y + 123} L-120 ${y + 28} Z`}
                fill={index % 2 === 0 ? secondary : tertiary || secondary}
              />
            );
          })}

        {pattern === 'diagonal' && (
          <g transform="rotate(-35 200 260)">
            {Array.from({ length: 32 }).map((_, index) => (
              <rect key={index} x={-260 + index * 28} y="-220" width="13" height="960" fill={secondary} />
            ))}
          </g>
        )}

        {pattern === 'fade-stripes' &&
          Array.from({ length: 13 }).map((_, index) => (
            <rect
              key={index}
              x={-40 + index * 38}
              y="20"
              width="20"
              height="490"
              fill={`url(#${id}-fade-v)`}
            />
          ))}

        {pattern === 'gradient' && (
          <rect x="-180" y="30" width="760" height="500" fill={`url(#${id}-pat-grad)`} />
        )}

        {pattern === 'gradient-diag' && (
          <rect x="-180" y="-120" width="760" height="760" fill={`url(#${id}-pat-grad-diag)`} />
        )}

        {pattern === 'grid' &&
          Array.from({ length: 18 }).map((_, row) =>
            Array.from({ length: 18 }).map((__, col) =>
              (row + col) % 2 === 0 ? (
                <rect
                  key={`${row}-${col}`}
                  x={-160 + col * 42}
                  y={-140 + row * 42}
                  width="42"
                  height="42"
                  fill={secondary}
                />
              ) : null,
            ),
          )}

        {pattern === 'honeycomb' && (
          <rect x="-180" y="-160" width="760" height="840" fill={`url(#${id}-honeycomb)`} />
        )}

        {pattern === 'sunburst' &&
          Array.from({ length: 24 }).map((_, index) => (
            <polygon
              key={index}
              points="148,175 -300,145 -300,205"
              fill={secondary}
              opacity="0.5"
              transform={`rotate(${index * 15} 148 175)`}
            />
          ))}

        {pattern === 'lightning' &&
          Array.from({ length: 8 }).map((_, index) => {
            const y = -40 + index * 78;
            return (
              <path
                key={index}
                d={`M-120 ${y} L-20 ${y + 36} L60 ${y - 8} L160 ${y + 42} L250 ${y - 6} L350 ${y + 38} L520 ${y - 12} L520 ${y + 18} L350 ${y + 68} L250 ${y + 24} L160 ${y + 72} L60 ${y + 22} L-20 ${y + 66} L-120 ${y + 30} Z`}
                fill={index % 2 === 0 ? secondary : tertiary || secondary}
              />
            );
          })}

        {pattern === 'waves' &&
          Array.from({ length: 14 }).map((_, index) => {
            const y = -60 + index * 48;
            return (
              <path
                key={index}
                d={`M -160 ${y} Q -40 ${y - 38}, 80 ${y} T 320 ${y} T 560 ${y} L 560 ${y + 20} Q 440 ${y + 58}, 320 ${y + 20} T 80 ${y + 20} T -160 ${y + 20} Z`}
                fill={secondary}
              />
            );
          })}

        {pattern === 'camo' &&
          [
            [-40, 40, 180, 90, 120, 210],
            [140, 20, 320, 70, 260, 190],
            [240, 150, 390, 220, 280, 340],
            [30, 180, 210, 240, 110, 370],
            [150, 290, 340, 360, 220, 490],
            [-20, 330, 150, 410, 60, 510],
          ].map((pts, idx) => (
            <g key={idx}>
              <polygon
                points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
                fill={idx % 2 === 0 ? secondary : tertiary || secondary}
                opacity="0.65"
              />
              <polygon
                points={`${pts[0] + 45},${pts[1] + 55} ${pts[2] - 25},${pts[3] + 85} ${pts[4] + 35},${pts[5] - 15}`}
                fill={idx % 2 === 0 ? tertiary || design.accent : secondary}
                opacity="0.45"
              />
            </g>
          ))}
      </g>
    </g>
  );
}

function ChestBandLayer({ design, clipPath }) {
  if (!design.chestBand || design.chestBand === 'none') return null;
  const color = design.chestBandColor || design.secondary;

  return (
    <g clipPath={clipPath}>
      {design.chestBand === 'horizontal' && (
        <>
          <rect x="80" y="222" width="240" height="68" fill={color} />
          <rect x="80" y="215" width="240" height="4" fill={design.accent} />
          <rect x="80" y="293" width="240" height="4" fill={design.accent} />
        </>
      )}
      {design.chestBand === 'double' && (
        <>
          <rect x="80" y="226" width="240" height="24" fill={color} />
          <rect x="80" y="258" width="240" height="24" fill={design.accent} />
        </>
      )}
      {design.chestBand === 'v-chest' && (
        <path d="M85 155 L200 250 L315 155 L315 190 L200 285 L85 190 Z" fill={color} />
      )}
      {design.chestBand === 'center-stripe' && (
        <>
          <rect x="172" y="50" width="56" height="450" fill={color} />
          <rect x="165" y="50" width="4" height="450" fill={design.accent} />
          <rect x="231" y="50" width="4" height="450" fill={design.accent} />
        </>
      )}
    </g>
  );
}

function ShoulderDetails({ design, clipPath }) {
  const { shoulderStripes, accent, secondary } = design;
  if (!shoulderStripes || shoulderStripes === 'none') return null;

  return (
    <g clipPath={clipPath}>
      {shoulderStripes === 'three-stripes' && (
        <g stroke={accent} strokeWidth="5.5" strokeLinecap="butt" fill="none">
          {/* Left Shoulder 3 Stripes */}
          <path d="M138 56 C106 70, 74 92, 42 138" />
          <path d="M143 64 C112 78, 80 100, 49 145" />
          <path d="M148 72 C118 86, 86 108, 56 152" />
          {/* Right Shoulder 3 Stripes */}
          <path d="M262 56 C294 70, 326 92, 358 138" />
          <path d="M257 64 C288 78, 320 100, 351 145" />
          <path d="M252 72 C282 86, 314 108, 344 152" />
        </g>
      )}
      {shoulderStripes === 'piping' && (
        <g stroke={accent} strokeWidth="3.5" fill="none">
          <path d="M124 60 C114 96, 104 128, 96 154" />
          <path d="M276 60 C286 96, 296 128, 304 154" />
        </g>
      )}
      {shoulderStripes === 'panel' && (
        <g fill={secondary} opacity="0.92">
          <path d="M142 54 C114 62, 82 78, 54 112 L72 128 C96 98, 122 82, 148 72 Z" />
          <path d="M258 54 C286 62, 318 78, 346 112 L328 128 C304 98, 278 82, 252 72 Z" />
        </g>
      )}
    </g>
  );
}

function SleeveCuffs({ design }) {
  const { cuffStyle, accent, secondary, tertiary } = design;

  return (
    <g>
      {/* Left Sleeve Cuff */}
      <path d="M14 174 L62 206 L69 194 L21 162 Z" fill={accent} />
      {/* Right Sleeve Cuff */}
      <path d="M386 174 L338 206 L331 194 L379 162 Z" fill={accent} />

      {cuffStyle === 'double' && (
        <>
          <line x1="17" y1="169" x2="65" y2="201" stroke={secondary} strokeWidth="3" />
          <line x1="383" y1="169" x2="335" y2="201" stroke={secondary} strokeWidth="3" />
        </>
      )}

      {cuffStyle === 'tricolor' && (
        <>
          <line x1="16" y1="171" x2="64" y2="203" stroke={secondary} strokeWidth="3.5" />
          <line x1="20" y1="165" x2="68" y2="197" stroke={tertiary || '#0F172A'} strokeWidth="3.5" />
          <line x1="384" y1="171" x2="336" y2="203" stroke={secondary} strokeWidth="3.5" />
          <line x1="380" y1="165" x2="332" y2="197" stroke={tertiary || '#0F172A'} strokeWidth="3.5" />
        </>
      )}
    </g>
  );
}

function RealisticCollar({ design, isFront }) {
  const font = getFont(design.fontFamily);
  const innerDark = darken(design.primary, 0.42);

  if (!isFront) {
    // Back collar view
    return (
      <g>
        <path
          d="M140 54 C162 66, 238 66, 260 54 C242 46, 158 46, 140 54 Z"
          fill={design.accent}
          stroke={darken(design.accent, 0.75)}
          strokeWidth="1"
        />
        <path
          d="M144 57 C164 68, 236 68, 256 57"
          fill="none"
          stroke={design.secondary}
          strokeWidth="2.5"
          opacity="0.85"
        />
      </g>
    );
  }

  // Front view includes realistic inner neck cavity + back neck tape + size label
  return (
    <g>
      {/* Inner neck cavity */}
      <path
        d={
          design.collar === 'vneck' || design.collar === 'overlap'
            ? 'M146 53 C166 44, 234 44, 254 53 L200 118 Z'
            : 'M146 53 C166 44, 234 44, 254 53 C248 92, 152 92, 146 53 Z'
        }
        fill={innerDark}
      />
      {/* Inner neck shadow gradient */}
      <ellipse cx="200" cy="62" rx="44" ry="16" fill="#000000" opacity="0.38" />
      {/* Inner neck seam tape */}
      <path d="M154 55 C174 49, 226 49, 246 55" fill="none" stroke={design.accent} strokeWidth="3.5" opacity="0.9" />
      {/* Inner motto text */}
      {design.innerMotto ? (
        <text
          x="200"
          y="65"
          textAnchor="middle"
          fontSize="5.2"
          fontWeight="800"
          letterSpacing="1.2"
          fill={design.secondary}
          opacity="0.82"
          fontFamily={font}
        >
          {design.innerMotto}
        </text>
      ) : null}
      {/* Heat-pressed size label */}
      <rect x="191" y="70" width="18" height="10" rx="1.5" fill="#FFFFFF" opacity="0.16" />
      <text x="200" y="77" textAnchor="middle" fontSize="5" fontWeight="900" fill="#FFFFFF" opacity="0.65" fontFamily={font}>
        RELI · L
      </text>

      {/* Outer collar styles */}
      {design.collar === 'vneck' && (
        <g>
          <path
            d="M142 54 L200 124 L258 54 L247 51 L200 107 L153 51 Z"
            fill={design.accent}
          />
          <path d="M147 53 L200 116 L253 53" fill="none" stroke={design.secondary} strokeWidth="2.2" opacity="0.9" />
        </g>
      )}

      {design.collar === 'overlap' && (
        <g>
          <path d="M142 54 L206 124 L216 112 L153 51 Z" fill={design.accent} />
          <path d="M258 54 L194 124 L184 112 L247 51 Z" fill={design.accent} />
          <path d="M254 53 L194 118" fill="none" stroke={design.secondary} strokeWidth="2.5" />
          <path d="M146 53 L199 111" fill="none" stroke={design.secondary} strokeWidth="2" opacity="0.8" />
        </g>
      )}

      {design.collar === 'polo' && (
        <g>
          {/* Placket */}
          <rect x="192" y="92" width="16" height="44" rx="2" fill={design.accent} stroke={darken(design.accent, 0.7)} strokeWidth="1" />
          <circle cx="200" cy="106" r="2.2" fill={design.secondary} />
          <circle cx="200" cy="122" r="2.2" fill={design.secondary} />
          {/* Folded Left Collar Wing */}
          <path
            d="M142 54 L196 98 L172 114 L128 74 Z"
            fill={design.accent}
            stroke={darken(design.accent, 0.75)}
            strokeWidth="1.2"
          />
          {/* Folded Right Collar Wing */}
          <path
            d="M258 54 L204 98 L228 114 L272 74 Z"
            fill={design.accent}
            stroke={darken(design.accent, 0.75)}
            strokeWidth="1.2"
          />
          <path d="M134 72 L171 107 L193 93" fill="none" stroke={design.secondary} strokeWidth="2" opacity="0.85" />
          <path d="M266 72 L229 107 L207 93" fill="none" stroke={design.secondary} strokeWidth="2" opacity="0.85" />
        </g>
      )}

      {design.collar === 'mandarin' && (
        <g>
          <rect x="194" y="84" width="12" height="38" rx="1.5" fill={design.accent} />
          <circle cx="200" cy="96" r="2" fill={design.secondary} />
          <path
            d="M142 54 C162 94, 238 94, 258 54 L248 48 C230 80, 170 80, 152 48 Z"
            fill={design.accent}
          />
          <line x1="200" y1="74" x2="200" y2="120" stroke={ innerDark } strokeWidth="2" />
        </g>
      )}

      {design.collar === 'cutout' && (
        <g>
          <path
            d="M142 54 C156 84, 176 92, 188 92 L192 104 L208 104 L212 92 C224 92, 244 84, 258 54 L247 50 C236 74, 220 80, 200 80 C180 80, 164 74, 153 50 Z"
            fill={design.accent}
          />
          <rect x="188" y="90" width="24" height="6" rx="2" fill={design.secondary} />
        </g>
      )}

      {design.collar === 'round' && (
        <g>
          <path
            d="M142 54 C160 96, 240 96, 258 54 L247 50 C232 82, 168 82, 153 50 Z"
            fill={design.accent}
          />
          <path
            d="M147 52 C164 89, 236 89, 253 52"
            fill="none"
            stroke={design.secondary}
            strokeWidth="2.4"
            opacity="0.9"
          />
        </g>
      )}
    </g>
  );
}

function BrandLogo({ brand, color = '#FFFFFF', x = 0, y = 0, width = 34, height = 24 }) {
  if (!brand || brand === 'none') return null;

  return (
    <g transform={`translate(${x} ${y}) scale(${width / 40} ${height / 28})`}>
      {brand === 'reli' && (
        <g fill={color}>
          <path d="M20 2 L24 11 L33 6 L28 16 L38 14 L29 22 L20 20 L11 22 L2 14 L12 16 L7 6 L16 11 Z" />
          <path d="M14 23 H26 L24 27 H16 Z" />
        </g>
      )}
      {brand === 'swoosh' && (
        <path
          d="M38 5 C27 14, 16 23, 6 25 C2 26, 0 23, 2 20 C4 16, 9 12, 13 9 C11 13, 11 17, 15 17 C21 17, 30 11, 38 5 Z"
          fill={color}
        />
      )}
      {brand === 'stripes' && (
        <g fill={color}>
          <polygon points="8,25 13,25 19,13 14,13" />
          <polygon points="16,25 21,25 29,9 24,9" />
          <polygon points="24,25 29,25 39,5 34,5" />
        </g>
      )}
      {brand === 'puma' && (
        <path
          d="M36 6 C31 4, 26 7, 22 11 C17 15, 11 16, 5 19 C3 20, 1 23, 2 25 C5 23, 9 22, 14 20 C19 18, 24 17, 29 14 C33 11, 36 9, 39 8 Z"
          fill={color}
        />
      )}
      {brand === 'hummel' && (
        <g fill={color}>
          <polygon points="8,14 20,4 32,14 26,14 20,9 14,14" />
          <polygon points="8,24 20,14 32,24 26,24 20,19 14,24" />
        </g>
      )}
      {brand === 'joma' && (
        <path
          d="M6 19 C12 25, 21 26, 27 21 C33 17, 36 10, 38 4 L32 8 C29 14, 25 18, 20 19 C16 20, 11 18, 8 14 Z"
          fill={color}
        />
      )}
      {brand === 'kelme' && (
        <g fill={color}>
          <ellipse cx="20" cy="19" rx="8" ry="6" />
          <ellipse cx="11" cy="10" rx="2.8" ry="4" transform="rotate(-18 11 10)" />
          <ellipse cx="17" cy="7.5" rx="3" ry="4.5" />
          <ellipse cx="23" cy="7.5" rx="3" ry="4.5" />
          <ellipse cx="29" cy="10" rx="2.8" ry="4" transform="rotate(18 29 10)" />
        </g>
      )}
      {brand === 'kappa' && (
        <g fill={color}>
          <circle cx="15" cy="7" r="3" />
          <circle cx="25" cy="7" r="3" />
          <path d="M18 11 L15 20 L8 25 L12 26 L19 21 L20 12 Z" />
          <path d="M22 11 L25 20 L32 25 L28 26 L21 21 L20 12 Z" />
        </g>
      )}
      {brand === 'umbro' && (
        <g fill="none" stroke={color} strokeWidth="2.5">
          <polygon points="20,4 37,14 20,24 3,14" />
          <polygon points="20,8 30,14 20,20 10,14" />
        </g>
      )}
    </g>
  );
}

function CrestBadge({ design, crestDataUrl, id, x, y, width, height }) {
  if (!design.showCrest) return null;

  const scale = clamp((design.crestScale || 100) / 100, 0.65, 1.45);
  const w = width * scale;
  const h = height * scale;
  const cx = x + (width - w) / 2;
  const cy = y + (height - h) / 2;

  const activeImage = design.customCrestUrl || crestDataUrl;
  const filterMap = {
    gold: `url(#${id}-crest-gold)`,
    'mono-light': `url(#${id}-crest-light)`,
    'mono-dark': `url(#${id}-crest-dark)`,
  };
  const filter = filterMap[design.crestStyle] || undefined;

  if (design.crestStyle !== 'shield' && activeImage) {
    return (
      <g filter={filter}>
        <image
          href={activeImage}
          x={cx}
          y={cy}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }

  return (
    <g transform={`translate(${cx} ${cy}) scale(${w / 48} ${h / 60})`}>
      <path
        d="M24 2 L46 10 V30 C46 45 35 54 24 58 C13 54 2 45 2 30 V10 Z"
        fill={design.primary}
        stroke={design.accent}
        strokeWidth="3.5"
      />
      <path d="M24 6 L41 13 V29 C41 41 32 49 24 53 C16 49 7 41 7 29 V13 Z" fill={design.secondary} opacity="0.18" />
      <text x="24" y="35" textAnchor="middle" fontSize="12" fontWeight="900" fill={design.accent} fontFamily="Arial, sans-serif">
        RELI
      </text>
    </g>
  );
}

function SleeveExtras({ design, clipPath }) {
  const font = getFont(design.fontFamily);
  return (
    <g clipPath={clipPath}>
      {/* Captain Armband on Left Sleeve */}
      {design.captainArmband && (
        <g transform="rotate(-33 56 146)">
          <rect x="20" y="132" width="76" height="26" fill={design.captainColor || '#FACC15'} />
          <rect x="20" y="132" width="76" height="4" fill="#FFFFFF" opacity="0.7" />
          <rect x="20" y="154" width="76" height="4" fill="#0F172A" opacity="0.7" />
          <text x="58" y="150" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0F172A" fontFamily={font}>
            C
          </text>
        </g>
      )}

      {/* Right Sleeve Competition Patch */}
      {design.sleeveBadge && design.sleeveBadge !== 'none' && (
        <g transform="translate(344 134) rotate(32)">
          <circle
            cx="0"
            cy="0"
            r="14"
            fill={design.sleeveBadge === 'champions' ? '#C9A259' : design.sleeveBadge === 'respect' ? '#0284C7' : '#FFFFFF'}
            stroke="#0F172A"
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="10.5" fill="none" stroke="#0F172A" strokeWidth="1" opacity="0.4" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#0F172A" fontFamily={font}>
            {design.sleeveBadge === 'champions' ? 'CHAMP' : design.sleeveBadge === 'respect' ? 'FAIR' : 'FFM'}
          </text>
        </g>
      )}
    </g>
  );
}

function GarmentDrapeShading({ id, clipPath }) {
  return (
    <g clipPath={clipPath} pointerEvents="none">
      {/* Base cylindrical shading */}
      <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-cylinder)`} />
      {/* Spotlight chest highlight */}
      <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-chest-light)`} />
      {/* Micro-polyester weave texture */}
      <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-weave)`} />

      {/* Realistic fabric folds & tension creases */}
      <g filter={`url(#${id}-fold-blur)`} opacity="0.22" fill="none" strokeLinecap="round">
        {/* Underarm tension drapes */}
        <path d="M98 156 C118 176, 134 210, 146 250" stroke="#000000" strokeWidth="6" />
        <path d="M102 152 C122 172, 138 206, 150 246" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M302 156 C282 176, 266 210, 254 250" stroke="#000000" strokeWidth="6" />
        <path d="M298 152 C278 172, 262 206, 250 246" stroke="#FFFFFF" strokeWidth="3" />
        {/* Pectoral & waist subtle drape waves */}
        <path d="M126 330 C166 346, 234 346, 274 330" stroke="#000000" strokeWidth="5" />
        <path d="M118 415 C164 432, 236 432, 282 415" stroke="#000000" strokeWidth="6" />
        <path d="M120 410 C164 426, 236 426, 280 410" stroke="#FFFFFF" strokeWidth="3" />
        {/* Sleeve folds */}
        <path d="M84 96 C66 124, 52 152, 42 178" stroke="#000000" strokeWidth="5" />
        <path d="M316 96 C334 124, 348 152, 358 178" stroke="#000000" strokeWidth="5" />
      </g>
    </g>
  );
}

function FrontPrint({ design, crestDataUrl, id }) {
  const font = getFont(design.fontFamily);
  const scale = clamp((design.sponsorScale || 100) / 100, 0.6, 1.5);
  const baseSponsorSize = fitTextSize(design.sponsor, 178, 30, 13);
  const sponsorSize = Math.round(baseSponsorSize * scale);
  const sponsorY = clamp(design.sponsorY || 265, 210, 340);

  const crestX = design.crestPosition === 'right' ? 228 : design.crestPosition === 'center' ? 176 : 124;
  const brandX = design.crestPosition === 'right' ? 128 : design.crestPosition === 'center' ? 181 : 238;
  const brandY = design.crestPosition === 'center' ? 124 : 158;

  const hasSponsor = design.sponsorStyle !== 'none' && (Boolean(design.sponsor) || Boolean(design.customSponsorUrl));
  const bandText = contrasting(design.secondary);

  return (
    <g>
      {/* Crest */}
      <CrestBadge design={design} crestDataUrl={crestDataUrl} id={id} x={crestX} y="142" width="48" height="58" />

      {/* Technical Brand Logo */}
      {design.showBrand && design.brand !== 'none' && (
        <BrandLogo
          brand={design.brand}
          color={design.brandColor || design.accent}
          x={brandX}
          y={brandY}
          width="38"
          height="26"
        />
      )}

      {/* Optional Front Small Number */}
      {design.showFrontNumber && (
        <text
          x={design.crestPosition === 'center' ? 200 : 200}
          y={design.crestPosition === 'center' ? 222 : 186}
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fontStyle="italic"
          fill={design.numberColor}
          stroke={design.showNumberOutline ? design.accent : 'none'}
          strokeWidth={design.showNumberOutline ? 2 : 0}
          paintOrder="stroke"
          fontFamily={font}
        >
          {design.number}
        </text>
      )}

      {/* Main Sponsor */}
      {hasSponsor && (
        <g>
          {design.sponsorStyle === 'band' && (
            <>
              <rect x="98" y={sponsorY - 34} width="204" height="52" fill={design.secondary} opacity="0.96" />
              <rect x="98" y={sponsorY - 34} width="204" height="3.5" fill={design.accent} />
              <rect x="98" y={sponsorY + 14.5} width="204" height="3.5" fill={design.accent} />
            </>
          )}

          {design.sponsorStyle === 'box' && (
            <rect
              x="114"
              y={sponsorY - 32}
              width="172"
              height="48"
              rx="8"
              fill={design.secondary}
              stroke={design.accent}
              strokeWidth="2.5"
            />
          )}

          {design.sponsorStyle === 'frame' && (
            <rect
              x="114"
              y={sponsorY - 32}
              width="172"
              height="48"
              rx="6"
              fill="#000000"
              fillOpacity="0.22"
              stroke={design.accent}
              strokeWidth="2.5"
            />
          )}

          {design.customSponsorUrl ? (
            <image
              href={design.customSponsorUrl}
              x={200 - 80 * scale}
              y={sponsorY - 32 * scale}
              width={160 * scale}
              height={52 * scale}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <text
              x="200"
              y={sponsorY}
              textAnchor="middle"
              fontSize={sponsorSize}
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="1"
              fill={design.sponsorStyle === 'band' || design.sponsorStyle === 'box' ? bandText : design.text}
              stroke={design.sponsorStyle === 'text' ? darken(design.primary, 0.45) : 'none'}
              strokeWidth={design.sponsorStyle === 'text' ? 3 : 0}
              paintOrder="stroke"
              fontFamily={font}
            >
              {design.sponsor}
            </text>
          )}
        </g>
      )}

      {/* Authentic Jock Tag at lower left hem */}
      {design.showJockTag && (
        <g transform="translate(114 434)">
          <rect x="0" y="0" width="46" height="22" rx="3" fill="#0B0F19" stroke={design.accent} strokeWidth="1.2" />
          <line x1="4" y1="9" x2="42" y2="9" stroke={design.accent} strokeWidth="0.7" opacity="0.6" />
          <text x="23" y="6.8" textAnchor="middle" fontSize="4.2" fontWeight="900" letterSpacing="0.8" fill={design.accent} fontFamily={font}>
            AUTHENTIC
          </text>
          <text x="23" y="16.5" textAnchor="middle" fontSize="4.8" fontWeight="800" letterSpacing="0.6" fill="#FFFFFF" fontFamily={font}>
            {design.season}
          </text>
        </g>
      )}
    </g>
  );
}

function BackPrint({ design, arcId }) {
  const font = getFont(design.fontFamily);
  const straightSize = fitTextSize(design.teamName, 158, 23, 10, 0.62);
  const archedSize = fitTextSize(design.teamName, 165, 20, 9, 0.62);
  const numScale = clamp((design.numberScale || 100) / 100, 0.7, 1.3);
  const baseNumSize = design.number.length > 1 ? 124 : 148;
  const numberSize = Math.round(baseNumSize * numScale);
  const numberStroke = design.showNumberOutline ? design.accent : 'none';
  const numberY = design.nameStyle === 'bottom' ? 318 : 352;

  return (
    <g>
      {/* Optional UEFA-style solid back box for striped/patterned jerseys */}
      {design.pattern !== 'solid' && design.backBoxSolid && (
        <rect x="118" y="198" width="164" height="196" rx="14" fill={design.primary} opacity="0.92" />
      )}

      {/* Player / Team Name */}
      {design.nameStyle === 'arched' ? (
        <text
          fontSize={archedSize}
          fontWeight="900"
          letterSpacing="1.2"
          fill={design.nameColor}
          stroke={darken(design.primary, 0.4)}
          strokeWidth="2.5"
          paintOrder="stroke"
          fontFamily={font}
          textAnchor="middle"
        >
          <textPath href={`#${arcId}`} startOffset="50%">
            {design.teamName}
          </textPath>
        </text>
      ) : design.nameStyle === 'bottom' ? (
        <text
          x="200"
          y="394"
          textAnchor="middle"
          fontSize={straightSize}
          fontWeight="900"
          letterSpacing="1.2"
          fill={design.nameColor}
          stroke={darken(design.primary, 0.4)}
          strokeWidth="2.5"
          paintOrder="stroke"
          fontFamily={font}
        >
          {design.teamName}
        </text>
      ) : (
        <text
          x="200"
          y="174"
          textAnchor="middle"
          fontSize={straightSize}
          fontWeight="900"
          letterSpacing="1.2"
          fill={design.nameColor}
          stroke={darken(design.primary, 0.4)}
          strokeWidth="2.5"
          paintOrder="stroke"
          fontFamily={font}
        >
          {design.teamName}
        </text>
      )}

      {/* Drop shadow of number */}
      <text
        x="203"
        y={numberY + 5}
        textAnchor="middle"
        fontSize={numberSize}
        fontWeight="900"
        fontStyle="italic"
        fill="#000000"
        opacity="0.24"
        fontFamily={font}
      >
        {design.number}
      </text>

      {/* Main Back Number */}
      <text
        x="200"
        y={numberY}
        textAnchor="middle"
        fontSize={numberSize}
        fontWeight="900"
        fontStyle="italic"
        fill={design.numberColor}
        stroke={numberStroke}
        strokeWidth={design.showNumberOutline ? 6 : 0}
        paintOrder="stroke"
        fontFamily={font}
      >
        {design.number}
      </text>

      {/* Inner inline detail on pro numbers */}
      {design.showNumberBackDetail && (
        <text
          x="200"
          y={numberY}
          textAnchor="middle"
          fontSize={numberSize}
          fontWeight="900"
          fontStyle="italic"
          fill="none"
          stroke={design.primary}
          strokeWidth="1.6"
          opacity="0.45"
          fontFamily={font}
        >
          {design.number}
        </text>
      )}

      {/* Bottom Season Tag */}
      <text
        x="200"
        y="452"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        letterSpacing="3.5"
        fill={design.nameColor}
        opacity="0.75"
        fontFamily={font}
      >
        {design.season}
      </text>
    </g>
  );
}

const LEFT_SIDE_PANEL = 'M 96 154 L 114 162 C 114 260, 112 365, 110 478 L 94 474 C 98 380, 102 260, 96 154 Z';
const RIGHT_SIDE_PANEL = 'M 304 154 L 286 162 C 286 260, 288 365, 290 478 L 306 474 C 302 380, 298 260, 304 154 Z';

export const ShirtSvg = forwardRef(function ShirtSvg(
  { design, side = 'front', crestDataUrl, className = '' },
  ref,
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const isFront = side === 'front';
  const outerClip = `url(#${id}-outer-clip)`;
  const torsoClip = `url(#${id}-torso-clip)`;
  const patternClip = design.patternOnSleeves ? outerClip : torsoClip;
  const showPattern = isFront || design.patternOnBack !== false;

  const sleeveFill =
    design.sleeveStyle === 'classic'
      ? design.primary
      : design.sleeveColor || design.panelColor || design.primary;

  return (
    <svg
      ref={ref}
      viewBox="0 0 400 520"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Camiseta ${isFront ? 'frontal' : 'trasera'}`}
    >
      <defs>
        <clipPath id={`${id}-outer-clip`}>
          <path d={SHIRT_OUTER_PATH} />
        </clipPath>
        <clipPath id={`${id}-torso-clip`}>
          <path d={SHIRT_TORSO_PATH} />
        </clipPath>
        <path id={`${id}-arc`} d="M 88 188 Q 200 132 312 188" />
        <CommonDefs id={id} design={design} />
      </defs>

      {/* Base Torso Fill */}
      <path d={SHIRT_OUTER_PATH} fill={design.primary} />

      {/* Sleeves Base Fill (when independent from pattern) */}
      {!design.patternOnSleeves && (
        <g clipPath={outerClip}>
          <path d={LEFT_SLEEVE_PATH} fill={sleeveFill} />
          <path d={RIGHT_SLEEVE_PATH} fill={sleeveFill} />
          {design.sleeveStyle === 'raglan' && (
            <>
              <path d={LEFT_SLEEVE_PATH} fill={`url(#${id}-mesh)`} />
              <path d={RIGHT_SLEEVE_PATH} fill={`url(#${id}-mesh)`} />
            </>
          )}
        </g>
      )}

      {/* Pattern Layer */}
      {showPattern && <PatternLayer design={design} id={id} clipPath={patternClip} />}

      {/* Front Chest Band */}
      {isFront && <ChestBandLayer design={design} clipPath={torsoClip} />}

      {/* Side Ventilation Panels */}
      {design.panelStyle !== 'none' && (
        <g clipPath={outerClip}>
          <path d={LEFT_SIDE_PANEL} fill={design.panelColor} />
          <path d={RIGHT_SIDE_PANEL} fill={design.panelColor} />
          {design.panelStyle === 'mesh' && (
            <>
              <path d={LEFT_SIDE_PANEL} fill={`url(#${id}-mesh)`} />
              <path d={RIGHT_SIDE_PANEL} fill={`url(#${id}-mesh)`} />
            </>
          )}
        </g>
      )}

      {/* Shoulder Stripes & Piping */}
      <ShoulderDetails design={design} clipPath={outerClip} />

      {/* Sleeve Badges & Captain Armband */}
      <SleeveExtras design={design} clipPath={outerClip} />

      {/* Twin-needle coverstitching details */}
      <g clipPath={outerClip} fill="none" stroke={contrasting(design.primary)} opacity="0.22" strokeDasharray="3 3" strokeWidth="1.1">
        <path d="M 124 60 C 114 96, 104 128, 96 154" />
        <path d="M 276 60 C 286 96, 296 128, 304 154" />
        <path d="M 96 462 C 132 478, 268 478, 304 462" />
      </g>

      {/* Prints (Crest, Sponsor, Name, Number) */}
      <g clipPath={outerClip}>
        {isFront ? (
          <FrontPrint design={design} crestDataUrl={crestDataUrl} id={id} />
        ) : (
          <BackPrint design={design} arcId={`${id}-arc`} />
        )}
      </g>

      {/* Sleeve Cuffs */}
      <g clipPath={outerClip}>
        <SleeveCuffs design={design} />
      </g>

      {/* Realistic 3D Cloth Folds & Studio Lighting Overlay */}
      <GarmentDrapeShading id={id} clipPath={outerClip} />

      {/* Collar & Inner Neck Cavity */}
      <RealisticCollar design={design} isFront={isFront} />

      {/* Outer silhouette crisp anti-aliased rim */}
      <path d={SHIRT_OUTER_PATH} fill="none" stroke="#000000" strokeOpacity="0.24" strokeWidth="1.5" />
    </svg>
  );
});

const LEFT_SHORTS_PANEL = 'M 72 44 L 56 124 L 52 196 L 74 198 L 82 48 Z';
const RIGHT_SHORTS_PANEL = 'M 228 44 L 244 124 L 248 196 L 226 198 L 218 48 Z';

export const ShortsSvg = forwardRef(function ShortsSvg(
  { design, side = 'front', crestDataUrl, className = '' },
  ref,
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const font = getFont(design.fontFamily);
  const isFront = side === 'front';
  const clip = `url(#${id}-clip)`;
  const numberSize = design.number.length > 1 ? 38 : 44;

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Pantalón ${isFront ? 'frontal' : 'trasero'}`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={SHORTS_PATH} />
        </clipPath>
        <CommonDefs id={id} design={design} />
      </defs>

      <path d={SHORTS_PATH} fill={design.shortsColor} />

      <g clipPath={clip}>
        {design.panelStyle !== 'none' && (
          <>
            <path d={LEFT_SHORTS_PANEL} fill={design.panelColor} />
            <path d={RIGHT_SHORTS_PANEL} fill={design.panelColor} />
          </>
        )}

        {/* Bottom leg trim */}
        <path d="M50 186 L138 186 L138 194 L50 194 Z" fill={design.accent} />
        <path d="M162 186 L250 186 L250 194 L162 194 Z" fill={design.accent} />

        {/* Gathered elastic waistband */}
        <path d="M74 16 C118 10, 182 10, 226 16 L229 44 C184 50, 116 50, 71 44 Z" fill={darken(design.shortsColor, 0.8)} />
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={i}
            x1={82 + i * 8}
            y1="16"
            x2={82 + i * 8}
            y2="44"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.18"
          />
        ))}
        <line x1="72" y1="44" x2="228" y2="44" stroke={design.accent} strokeWidth="2" opacity="0.8" />

        {isFront && (
          <g>
            {/* Drawstrings */}
            <path d="M145 36 C142 56, 140 70, 143 82" stroke={design.secondary} strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M155 36 C158 56, 160 70, 157 82" stroke={design.secondary} strokeWidth="2.6" strokeLinecap="round" fill="none" />
            {design.shortsCrest !== false && (
              <CrestBadge design={design} crestDataUrl={crestDataUrl} id={id} x="82" y="132" width="34" height="42" />
            )}
            {design.showBrand && design.brand !== 'none' && (
              <BrandLogo brand={design.brand} color={design.brandColor || design.accent} x={84} y="98" width="26" height="18" />
            )}
            {design.shortsNumber && (
              <text
                x="198"
                y="168"
                textAnchor="middle"
                fontSize={numberSize}
                fontWeight="900"
                fontStyle="italic"
                fill={design.numberColor}
                stroke={design.showNumberOutline ? design.accent : 'none'}
                strokeWidth={design.showNumberOutline ? 2.5 : 0}
                paintOrder="stroke"
                fontFamily={font}
              >
                {design.number}
              </text>
            )}
          </g>
        )}

        {/* Realistic cylindrical leg shading & folds */}
        <rect x="0" y="0" width="300" height="220" fill={`url(#${id}-cylinder)`} />
        <rect x="0" y="0" width="300" height="220" fill={`url(#${id}-weave)`} />
      </g>

      <path d={SHORTS_PATH} fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.4" />
    </svg>
  );
});

export const SocksSvg = forwardRef(function SocksSvg({ design, className = '' }, ref) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const font = getFont(design.fontFamily);
  const clip = `url(#${id}-clip)`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 150 270"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medias"
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={SOCKS_PATH} />
        </clipPath>
        <CommonDefs id={id} design={design} />
      </defs>

      <path d={SOCKS_PATH} fill={design.socksColor} />

      <g clipPath={clip}>
        {/* Top Folded Ribbed Cuff */}
        <rect x="0" y="0" width="150" height="36" fill={design.socksStripeColor || design.secondary} />
        <rect x="0" y="36" width="150" height="6" fill={design.accent} />
        <rect x="0" y="46" width="150" height="5" fill={design.socksStripeColor || design.secondary} />

        {/* Ribbing vertical texture on sock cuff */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={28 + i * 5} y1="8" x2={28 + i * 5} y2="36" stroke="#000000" strokeWidth="1" opacity="0.16" />
        ))}

        {/* Anatomical heel and toe reinforcement */}
        <path d="M24 186 C38 190, 48 206, 44 234 L24 230 Z" fill={darken(design.socksColor, 0.72)} />
        <path d="M104 198 L136 220 L128 254 L96 248 Z" fill={darken(design.socksColor, 0.72)} />

        {design.showBrand && design.brand !== 'none' ? (
          <BrandLogo brand={design.brand} color={design.brandColor || design.accent} x={46} y="88" width="28" height="20" />
        ) : (
          <text x="60" y="105" textAnchor="middle" fontSize="13" fontWeight="900" fill={design.accent} fontFamily={font}>
            RELI
          </text>
        )}

        <rect x="0" y="0" width="150" height="270" fill={`url(#${id}-cylinder)`} />
        <rect x="0" y="0" width="150" height="270" fill={`url(#${id}-weave)`} />
      </g>

      <path d={SOCKS_PATH} fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.4" />
    </svg>
  );
});
