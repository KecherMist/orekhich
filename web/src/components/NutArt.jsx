// Иллюстрации товаров: орехи рисуем из полей API tone (фон тайла) и accent (цвет ядра).

const SHAPE_BY_ART = {
  hazelnut: 'round',
  cedar: 'oval',
  pecan: 'grooved',
  macadamia: 'disc',
  walnut: 'lobes',
  mix: 'mix',
  almond: 'teardrop',
  cashew: 'crescent',
  peanut: 'peanut',
  honey: 'jar',
  dried: 'wrinkle',
  prune: 'wrinkle',
};

const VARIANTS = {
  tile: { box: 'h-[170px] rounded-tile', kernel: 'w-[110px]' },
  panel: { box: 'h-[320px] rounded-panel', kernel: 'w-[190px]' },
  large: { box: 'h-[280px] rounded-[18px]', kernel: 'w-[176px]' },
  mini: { box: 'h-14 w-14 shrink-0 rounded-[12px]', kernel: 'w-9' },
  micro: { box: 'h-11 w-11 shrink-0 rounded-[10px]', kernel: 'w-7' },
  bare: { box: '', kernel: '' },
};

function highlight(cx, cy, rx, ry, opacity = 0.26, rotate = -22) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#FFFFFF"
      opacity={opacity}
      transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}
    />
  );
}

function Kernel({ shape, accent }) {
  switch (shape) {
    case 'oval':
      return (
        <g>
          <ellipse cx="60" cy="62" rx="19" ry="27" fill={accent} />
          <path d="M60 37v50" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.22" />
          {highlight(53, 50, 6, 9, 0.26, -14)}
          <path d="M60 30c4 3 6 6 6 9-4-2-8-2-12 0 0-3 2-6 6-9z" fill={accent} opacity="0.6" />
        </g>
      );
    case 'grooved':
      return (
        <g>
          <ellipse cx="60" cy="62" rx="24" ry="30" fill={accent} />
          <path
            d="M49 37c-3 16-3 34 0 50M60 33c-2 18-2 38 0 56M71 37c3 16 3 34 0 50"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            opacity="0.2"
            fill="none"
          />
          {highlight(50, 48, 7, 10, 0.22, -10)}
        </g>
      );
    case 'disc':
      return (
        <g>
          <circle cx="60" cy="62" r="29" fill={accent} />
          <path d="M33 56h54" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 5" opacity="0.35" />
          <circle cx="60" cy="62" r="29" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.18" />
          {highlight(50, 47, 8, 6)}
        </g>
      );
    case 'lobes':
      return (
        <g>
          <ellipse cx="46" cy="62" rx="17" ry="25" fill={accent} />
          <ellipse cx="74" cy="62" rx="17" ry="25" fill={accent} opacity="0.9" />
          <path d="M60 40c-4 8-4 16 0 22 4 6 4 14 0 22" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" fill="none" />
          <path d="M38 52c5-4 11-4 15 0M67 52c5-4 11-4 15 0" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.18" fill="none" />
          {highlight(40, 50, 6, 8, 0.22, -12)}
        </g>
      );
    case 'teardrop':
      return (
        <g>
          <path d="M60 29c16 14 22 28 22 39 0 12-10 21-22 21S38 80 38 68c0-11 6-25 22-39z" fill={accent} />
          <path d="M60 45v40" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.2" />
          {highlight(50, 58, 6, 9, 0.24, -8)}
        </g>
      );
    case 'crescent':
      return (
        <g>
          <path d="M37 86C32 60 49 38 80 35" stroke={accent} strokeWidth="23" strokeLinecap="round" fill="none" />
          <path d="M42 78C38 58 52 43 74 41" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.2" fill="none" />
        </g>
      );
    case 'peanut':
      return (
        <g>
          <ellipse cx="51" cy="47" rx="17" ry="19" fill={accent} />
          <ellipse cx="69" cy="76" rx="19" ry="21" fill={accent} opacity="0.94" />
          <path d="M38 61c14 6 28 6 42-1" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.2" fill="none" />
          {highlight(45, 41, 6, 5, 0.24, -18)}
        </g>
      );
    case 'mix':
      return (
        <g>
          <circle cx="41" cy="45" r="13" fill={accent} />
          <ellipse cx="78" cy="50" rx="12" ry="15" fill={accent} opacity="0.86" />
          <path d="M60 62c9 8 13 16 13 23 0 8-6 13-13 13s-13-5-13-13c0-7 4-15 13-23z" fill={accent} opacity="0.92" />
          <ellipse cx="33" cy="78" rx="11" ry="13" fill={accent} opacity="0.72" />
          <circle cx="66" cy="28" r="9" fill={accent} opacity="0.55" />
          {highlight(37, 40, 4.5, 3.5, 0.3, -20)}
          {highlight(74, 44, 4, 5.5, 0.26, -10)}
        </g>
      );
    case 'jar':
      return (
        <g>
          <path d="M42 48h36v34a12 12 0 0 1-12 12H54a12 12 0 0 1-12-12z" fill={accent} />
          <rect x="37" y="33" width="46" height="13" rx="5" fill={accent} opacity="0.82" />
          <rect x="52" y="22" width="16" height="10" rx="4" fill={accent} opacity="0.55" />
          <path d="M45 62c6-3 24-3 30 0" stroke="#FFFFFF" strokeWidth="2" opacity="0.28" fill="none" />
          {highlight(51, 74, 6, 9, 0.26, -6)}
        </g>
      );
    case 'wrinkle':
      return (
        <g transform="rotate(-12 60 62)">
          <ellipse cx="60" cy="62" rx="21" ry="28" fill={accent} />
          <path
            d="M50 40c-3 14-3 30 0 44M60 38c-3 15-3 32 0 48M70 40c-3 14-3 30 0 44"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            opacity="0.18"
            fill="none"
          />
          {highlight(52, 50, 6, 8, 0.22, -6)}
        </g>
      );
    case 'round':
    default:
      return (
        <g>
          <ellipse cx="60" cy="64" rx="30" ry="28" fill={accent} />
          <path d="M44 41c6-9 26-9 32 0-9-5-23-5-32 0z" fill={accent} opacity="0.65" />
          <path d="M60 92v7" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          {highlight(49, 54, 9.5, 7)}
        </g>
      );
  }
}

export default function NutArt({ product, art, tone, accent, variant = 'tile', className = '', kernelClassName = '' }) {
  const artKey = String(art || (product && product.art) || 'hazelnut');
  const toneColor = tone || (product && product.tone) || '#EFE3D0';
  const accentColor = accent || (product && product.accent) || '#C1662F';
  const shape = SHAPE_BY_ART[artKey] || 'round';
  const size = VARIANTS[variant] || VARIANTS.tile;

  const svg = (
    <svg
      viewBox="0 0 120 120"
      className={`${kernelClassName || size.kernel} ${variant === 'bare' ? '' : 'relative z-10'}`}
      aria-hidden="true"
      focusable="false"
    >
      <Kernel shape={shape} accent={accentColor} />
    </svg>
  );

  if (variant === 'bare') {
    return <div className={className}>{svg}</div>;
  }

  return (
    <div className={`${size.box} relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: toneColor }}>
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-25"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-3 left-4 h-2.5 w-2.5 rounded-full opacity-30"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-7 bottom-8 h-1.5 w-1.5 rounded-full opacity-25"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      {svg}
    </div>
  );
}
