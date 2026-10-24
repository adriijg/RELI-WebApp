import { forwardRef, useId } from 'react';
import { SHIRT_PATH, SHORTS_PATH } from '../../utils/kit';

const FONT = 'Arial, sans-serif';
const FONT_BLACK = 'Arial Black, Arial, sans-serif';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function fitTextSize(text, maxWidth, maxSize, minSize, factor = 0.6) {
  const length = Math.max(String(text || '').length, 1);
  return Math.round(clamp(maxWidth / (length * factor), minSize, maxSize));
}

function hexLuminance(hex) {
  const value = String(hex || '').replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasting(hex) {
  return hexLuminance(hex) > 0.55 ? '#0F172A' : '#FFFFFF';
}

function darken(hex, factor) {
  const value = String(hex || '').replace('#', '');
  const parts = [0, 2, 4].map((index) => {
    const channel = Math.round(parseInt(value.slice(index, index + 2), 16) * factor);
    return clamp(channel, 0, 255).toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
}

function CommonDefs({ id }) {
  return (
    <>
      <filter id={`${id}-rough`} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <pattern id={`${id}-mesh`} width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 0H7V7H0Z" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.22" />
      </pattern>
      <pattern id={`${id}-mesh-dark`} width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 0H7V7H0Z" fill="none" stroke="#0F172A" strokeWidth="1" opacity="0.22" />
      </pattern>
      <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="#000000" strokeWidth="1" opacity="0.22" />
      </pattern>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
        <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
      </linearGradient>
    </>
  );
}

function Pattern({ design, id }) {
  const clip = `url(#${id}-clip)`;
  const { secondary } = design;

  if (design.pattern === 'solid') return null;

  if (design.pattern === 'gradient') {
    return <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-gradient)`} clipPath={clip} />;
  }

  if (design.pattern === 'stripes') {
    return (
      <g clipPath={clip} opacity="0.95">
        {Array.from({ length: 13 }).map((_, index) => (
          <rect key={index} x={index * 32} y="0" width="16" height="520" fill={secondary} />
        ))}
      </g>
    );
  }

  if (design.pattern === 'pinstripes') {
    return (
      <g clipPath={clip} opacity="0.9">
        {Array.from({ length: 26 }).map((_, index) => (
          <rect key={index} x={index * 16} y="0" width="2" height="520" fill={secondary} />
        ))}
      </g>
    );
  }

  if (design.pattern === 'hoops') {
    return (
      <g clipPath={clip} opacity="0.95">
        {Array.from({ length: 13 }).map((_, index) => (
          <rect key={index} x="0" y={index * 40} width="400" height="20" fill={secondary} />
        ))}
      </g>
    );
  }

  if (design.pattern === 'sash') {
    return (
      <g clipPath={clip} opacity="0.95">
        <polygon points="0,0 116,0 400,384 400,520 284,520" fill={secondary} />
      </g>
    );
  }

  if (design.pattern === 'halves') {
    return (
      <g clipPath={clip} opacity="0.95">
        <rect x="200" y="0" width="200" height="520" fill={secondary} />
      </g>
    );
  }

  if (design.pattern === 'diagonal') {
    return (
      <g clipPath={clip} opacity="0.9">
        <g transform="rotate(-34 200 260)">
          {Array.from({ length: 30 }).map((_, index) => (
            <rect key={index} x={-220 + index * 24} y="-120" width="10" height="820" fill={secondary} />
          ))}
        </g>
      </g>
    );
  }

  if (design.pattern === 'chevron') {
    return (
      <g clipPath={clip} opacity="0.88">
        {Array.from({ length: 9 }).map((_, index) => {
          const y = index * 66 - 24;
          return (
            <path
              key={index}
              d={`M0 ${y} L200 ${y + 38} L400 ${y} L400 ${y + 18} L200 ${y + 56} L0 ${y + 18} Z`}
              fill={secondary}
            />
          );
        })}
      </g>
    );
  }

  return (
    <g clipPath={clip} opacity="0.55">
      {Array.from({ length: 9 }).map((_, index) => (
        <line key={`v-${index}`} x1={index * 50} y1="0" x2={index * 50} y2="520" stroke={secondary} strokeWidth="6" />
      ))}
      {Array.from({ length: 11 }).map((_, index) => (
        <line key={`h-${index}`} x1="0" y1={index * 50} x2="400" y2={index * 50} stroke={secondary} strokeWidth="6" />
      ))}
    </g>
  );
}

const LEFT_SLEEVE = 'M106 78 L58 102 C44 116 34 140 28 166 L26 196 L82 226 L102 182 L108 150 L118 108 Z';
const RIGHT_SLEEVE = 'M294 78 L342 102 C356 116 366 140 372 166 L374 196 L318 226 L298 182 L292 150 L282 108 Z';
const LEFT_SIDE = 'M102 182 L116 182 L112 466 L102 466 Z';
const RIGHT_SIDE = 'M298 182 L284 182 L288 466 L298 466 Z';

function Collar({ design }) {
  if (design.collar === 'vneck') {
    return (
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M152 66 L200 128 L248 66" stroke={design.accent} strokeWidth="8" />
        <path d="M152 66 L200 128 L248 66" stroke={design.secondary} strokeWidth="2.5" opacity="0.9" />
      </g>
    );
  }

  if (design.collar === 'polo') {
    return (
      <g>
        <path d="M152 66 L200 98 L248 66 L260 82 L200 118 L140 82 Z" fill={design.accent} />
        <path d="M162 72 L200 106 L238 72 L244 78 L200 112 L156 78 Z" fill="#000000" opacity="0.16" />
        <line x1="200" y1="104" x2="200" y2="134" stroke={design.primary} strokeWidth="3" />
        <line x1="194" y1="110" x2="194" y2="132" stroke={design.secondary} strokeWidth="1.2" opacity="0.6" />
        <line x1="206" y1="110" x2="206" y2="132" stroke={design.secondary} strokeWidth="1.2" opacity="0.6" />
      </g>
    );
  }

  return (
    <g fill="none" strokeLinecap="round">
      <path d="M152 66 C176 79 224 79 248 66" stroke={design.accent} strokeWidth="8" />
      <path d="M152 66 C176 79 224 79 248 66" stroke={design.secondary} strokeWidth="2.5" opacity="0.9" />
      <path d="M200 78 L200 88" stroke={design.accent} strokeWidth="4" />
    </g>
  );
}

function CrestBadge({ design, crestDataUrl, x, y, width, height }) {
  if (!design.showCrest) return null;

  if (crestDataUrl) {
    return (
      <image
        href={crestDataUrl}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${width / 48} ${height / 64})`}>
      <path d="M24 0 L48 10 V32 C48 48 36 58 24 64 C12 58 0 48 0 32 V10 Z" fill={design.secondary} stroke={design.accent} strokeWidth="3" />
      <text x="24" y="36" textAnchor="middle" fontSize="13" fontWeight="900" fill={design.primary} fontFamily={FONT}>RELI</text>
    </g>
  );
}

function FrontPrint({ design, crestDataUrl }) {
  const sponsorSize = fitTextSize(design.sponsor, 186, 28, 13);
  const teamSize = fitTextSize(design.teamName, 180, 13, 8, 0.55);
  const crestX = design.crestPosition === 'right' ? 219 : design.crestPosition === 'center' ? 174 : 129;
  const showBand = design.sponsorStyle === 'band' && Boolean(design.sponsor);
  const showText = design.sponsorStyle === 'text' && Boolean(design.sponsor);
  const bandText = contrasting(design.secondary);

  return (
    <g>
      <ellipse cx={crestX + 26} cy="212" rx="26" ry="4" fill="#000000" opacity="0.2" />
      <CrestBadge design={design} crestDataUrl={crestDataUrl} x={crestX} y="148" width="52" height="62" />
      {showBand ? (
        <g>
          <rect x="102" y="246" width="196" height="48" fill={design.secondary} />
          <rect x="102" y="246" width="196" height="3" fill={design.accent} />
          <rect x="102" y="291" width="196" height="3" fill={design.accent} />
          <text x="200" y="278" textAnchor="middle" fontSize={sponsorSize} fontWeight="900" fontStyle="italic" letterSpacing="1" fill={bandText} fontFamily={FONT}>
            {design.sponsor}
          </text>
        </g>
      ) : null}
      {showText ? (
        <text x="200" y="282" textAnchor="middle" fontSize={sponsorSize} fontWeight="900" fontStyle="italic" letterSpacing="1" fill={design.text} fontFamily={FONT}>
          {design.sponsor}
        </text>
      ) : null}
      <text x="200" y="442" textAnchor="middle" fontSize={teamSize} fontWeight="900" letterSpacing="3" fill={design.nameColor} opacity="0.9" fontFamily={FONT}>
        {design.teamName}
      </text>
    </g>
  );
}

function BackPrint({ design, arcId }) {
  const straightSize = fitTextSize(design.teamName, 148, 22, 9, 0.64);
  const archedSize = fitTextSize(design.teamName, 150, 18, 8, 0.64);
  const numberSize = design.number.length > 1 ? 118 : 146;
  const isArched = design.nameStyle === 'arched';
  const numberStroke = design.showNumberOutline ? design.accent : 'none';

  return (
    <g>
      {isArched ? (
        <text fontSize={archedSize} fontWeight="900" letterSpacing="0.5" fill={design.nameColor} fontFamily={FONT} textAnchor="middle">
          <textPath href={`#${arcId}`} startOffset="50%">
            {design.teamName}
          </textPath>
        </text>
      ) : (
        <text x="200" y="198" textAnchor="middle" fontSize={straightSize} fontWeight="900" letterSpacing="0.5" fill={design.nameColor} fontFamily={FONT}>
          {design.teamName}
        </text>
      )}
      <text x="200" y="376" textAnchor="middle" fontSize={numberSize} fontWeight="900" fontStyle="italic" fill="#000000" opacity="0.18" fontFamily={FONT_BLACK}>
        {design.number}
      </text>
      <text
        x="200"
        y="370"
        textAnchor="middle"
        fontSize={numberSize}
        fontWeight="900"
        fontStyle="italic"
        fill={design.numberColor}
        stroke={numberStroke}
        strokeWidth={design.showNumberOutline ? 5 : 0}
        paintOrder="stroke"
        fontFamily={FONT_BLACK}
      >
        {design.number}
      </text>
      <text x="200" y="448" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="3" fill={design.nameColor} opacity="0.85" fontFamily={FONT}>
        {design.season}
      </text>
      <path d="M152 462 L248 462" stroke={design.accent} strokeWidth="1.2" opacity="0.45" strokeDasharray="3 3" />
    </g>
  );
}

export const ShirtSvg = forwardRef(function ShirtSvg(
  { design, side = 'front', crestDataUrl, className = '' },
  ref,
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const isFront = side === 'front';
  const clip = `url(#${id}-clip)`;
  const mesh = `url(#${id}-${hexLuminance(design.panelColor) > 0.55 ? 'mesh-dark' : 'mesh'})`;
  const showSleevePanel = design.sleeveStyle !== 'classic';
  const sleeveMesh = design.sleeveStyle === 'raglan';
  const showSidePanel = design.panelStyle !== 'none';
  const sideMesh = design.panelStyle === 'mesh';
  const seamColor = contrasting(showSidePanel ? design.panelColor : design.primary);

  return (
    <svg
      ref={ref}
      viewBox="0 0 400 520"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Camiseta ${isFront ? 'delantera' : 'trasera'}`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={SHIRT_PATH} />
        </clipPath>
        <path id={`${id}-arc`} d="M20 216 Q200 156 380 216" />
        <CommonDefs id={id} />
        <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={design.primary} />
          <stop offset="100%" stopColor={design.secondary} />
        </linearGradient>
      </defs>

      <g filter={`url(#${id}-rough)`}>
        <path d={SHIRT_PATH} fill={design.primary} />
        <path d={SHIRT_PATH} fill="none" stroke={design.primary} strokeWidth="6" strokeLinejoin="round" opacity="0.55" />
      </g>

      <Pattern design={design} id={id} />

      <g clipPath={clip}>
        {showSleevePanel ? (
          <>
            <path d={LEFT_SLEEVE} fill={design.panelColor} />
            <path d={RIGHT_SLEEVE} fill={design.panelColor} />
            {sleeveMesh ? (
              <>
                <path d={LEFT_SLEEVE} fill={mesh} />
                <path d={RIGHT_SLEEVE} fill={mesh} />
              </>
            ) : null}
          </>
        ) : null}
        {showSidePanel ? (
          <>
            <path d={LEFT_SIDE} fill={design.panelColor} />
            <path d={RIGHT_SIDE} fill={design.panelColor} />
            {sideMesh ? (
              <>
                <path d={LEFT_SIDE} fill={mesh} />
                <path d={RIGHT_SIDE} fill={mesh} />
              </>
            ) : null}
          </>
        ) : null}
        <line x1="119" y1="200" x2="114" y2="462" stroke={seamColor} strokeWidth="1" strokeDasharray="4 5" opacity="0.35" />
        <line x1="281" y1="200" x2="286" y2="462" stroke={seamColor} strokeWidth="1" strokeDasharray="4 5" opacity="0.35" />
        <path d="M108 466 C150 480 250 480 292 466" stroke={design.secondary} strokeWidth="1.4" strokeDasharray="4 4" opacity="0.45" fill="none" />
        <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-shade)`} />
        <rect x="0" y="0" width="400" height="520" fill={`url(#${id}-weave)`} opacity="0.35" />
      </g>

      <path d="M374 196 L318 226 L312 212 L368 182 Z" fill={design.accent} />
      <path d="M26 196 L82 226 L88 212 L32 182 Z" fill={design.accent} />
      <Collar design={design} />

      {isFront ? (
        <FrontPrint design={design} crestDataUrl={crestDataUrl} />
      ) : (
        <BackPrint design={design} arcId={`${id}-arc`} />
      )}
    </svg>
  );
});

const LEFT_SHORTS_PANEL = 'M70 56 L57 92 L60 200 L86 200 L78 100 Z';
const RIGHT_SHORTS_PANEL = 'M230 56 L243 92 L240 200 L214 200 L222 100 Z';

export const ShortsSvg = forwardRef(function ShortsSvg(
  { design, side = 'front', crestDataUrl, className = '' },
  ref,
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const isFront = side === 'front';
  const clip = `url(#${id}-clip)`;
  const numberSize = design.number.length > 1 ? 40 : 48;
  const mesh = `url(#${id}-${hexLuminance(design.panelColor) > 0.55 ? 'mesh-dark' : 'mesh'})`;
  const showPanels = design.panelStyle !== 'none';
  const panelMesh = design.panelStyle === 'mesh';

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Pantalón ${isFront ? 'delantero' : 'trasero'}`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={SHORTS_PATH} />
        </clipPath>
        <CommonDefs id={id} />
      </defs>

      <g filter={`url(#${id}-rough)`}>
        <path d={SHORTS_PATH} fill={design.shortsColor} />
        <path d={SHORTS_PATH} fill="none" stroke={design.shortsColor} strokeWidth="5" strokeLinejoin="round" opacity="0.55" />
      </g>

      <g clipPath={clip}>
        {showPanels ? (
          <>
            <path d={LEFT_SHORTS_PANEL} fill={design.panelColor} />
            <path d={RIGHT_SHORTS_PANEL} fill={design.panelColor} />
            {panelMesh ? (
              <>
                <path d={LEFT_SHORTS_PANEL} fill={mesh} />
                <path d={RIGHT_SHORTS_PANEL} fill={mesh} />
              </>
            ) : null}
          </>
        ) : null}
        <path d="M71 20 C112 11 188 11 229 20 L232 48 C190 57 110 57 68 48 Z" fill={darken(design.shortsColor, 0.82)} />
        <line x1="69" y1="46" x2="231" y2="46" stroke={contrasting(darken(design.shortsColor, 0.82))} strokeWidth="1" strokeDasharray="5 4" opacity="0.45" />
        <path d="M157 126 L175 196" stroke="#000000" strokeWidth="3" opacity="0.08" />
        <path d="M143 126 L125 196" stroke="#000000" strokeWidth="3" opacity="0.08" />
        <rect x="0" y="0" width="300" height="220" fill={`url(#${id}-shade)`} />
        <rect x="0" y="0" width="300" height="220" fill={`url(#${id}-weave)`} opacity="0.3" />
      </g>

      {isFront ? (
        <g>
          <path d="M144 50 C146 66 147 78 148 86" stroke={design.secondary} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M156 50 C154 66 153 78 152 86" stroke={design.secondary} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <circle cx="144" cy="52" r="2.2" fill="#000000" opacity="0.4" />
          <circle cx="156" cy="52" r="2.2" fill="#000000" opacity="0.4" />
          <circle cx="148" cy="88" r="2.6" fill={design.secondary} />
          <circle cx="152" cy="88" r="2.6" fill={design.secondary} />
          <CrestBadge design={design} crestDataUrl={crestDataUrl} x="84" y="146" width="36" height="44" />
          {design.shortsNumber ? (
            <>
              <text x="190" y="178" textAnchor="middle" fontSize={numberSize} fontWeight="900" fontStyle="italic" fill="#000000" opacity="0.18" fontFamily={FONT_BLACK}>
                {design.number}
              </text>
              <text
                x="190"
                y="174"
                textAnchor="middle"
                fontSize={numberSize}
                fontWeight="900"
                fontStyle="italic"
                fill={design.numberColor}
                stroke={design.showNumberOutline ? design.accent : 'none'}
                strokeWidth={design.showNumberOutline ? 2.5 : 0}
                paintOrder="stroke"
                fontFamily={FONT_BLACK}
              >
                {design.number}
              </text>
            </>
          ) : null}
        </g>
      ) : (
        <g>
          <path d="M150 56 L150 116" stroke={design.secondary} strokeWidth="1.2" opacity="0.3" strokeDasharray="4 4" />
          <path d="M96 92 C112 100 128 104 144 104" stroke="#000000" strokeWidth="1.2" opacity="0.14" fill="none" />
          <path d="M204 92 C188 100 172 104 156 104" stroke="#000000" strokeWidth="1.2" opacity="0.14" fill="none" />
        </g>
      )}
    </svg>
  );
});

export const SocksSvg = forwardRef(function SocksSvg({ design, className = '' }, ref) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const sockPath = 'M18 8 C18 3 22 0 27 0 H73 C78 0 82 3 82 8 V148 C82 166 86 180 94 188 L120 202 C132 209 137 222 133 234 C129 246 116 252 104 248 L44 232 C28 228 20 214 20 196 V8 Z';
  const clip = `url(#${id}-clip)`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 140 280"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medias"
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={sockPath} />
        </clipPath>
        <CommonDefs id={id} />
      </defs>

      <path d={sockPath} fill={design.socksColor} />
      <g clipPath={clip}>
        <rect x="10" y="0" width="80" height="34" fill={design.accent} />
        <rect x="10" y="40" width="80" height="8" fill={design.secondary} />
        <path d="M20 196 L44 200" stroke="#000000" strokeWidth="1" strokeDasharray="3 4" opacity="0.2" />
        <rect x="0" y="0" width="140" height="280" fill={`url(#${id}-shade)`} />
        <rect x="0" y="0" width="140" height="280" fill={`url(#${id}-weave)`} opacity="0.3" />
      </g>

      <text x="50" y="126" textAnchor="middle" fontSize="12" fontWeight="900" letterSpacing="0.5" fill={design.text} fontFamily={FONT}>
        RELI
      </text>
      <text x="50" y="142" textAnchor="middle" fontSize="8" fontWeight="800" letterSpacing="1" fill={design.text} opacity="0.75" fontFamily={FONT}>
        {design.season}
      </text>
    </svg>
  );
});
