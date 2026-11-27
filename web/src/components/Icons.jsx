// Иконки лавки — только inline-SVG, без иконочных пакетов.

function Svg({ className = 'h-5 w-5', strokeWidth = 1.7, viewBox = '0 0 24 24', children, ...rest }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconCart({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 4h2.2l1.6 10.4a2 2 0 0 0 2 1.7h8.4a2 2 0 0 0 2-1.6L21 8H6.4" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </Svg>
  );
}

export function IconSearch({ className }) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Svg>
  );
}

export function IconClose({ className }) {
  return (
    <Svg className={className} strokeWidth={1.9}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconPlus({ className }) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  );
}

export function IconMinus({ className }) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M5.5 12h13" />
    </Svg>
  );
}

export function IconTrash({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
      <path d="M6.5 7l.9 12.1A1.9 1.9 0 0 0 9.3 21h5.4a1.9 1.9 0 0 0 1.9-1.9L17.5 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </Svg>
  );
}

export function IconArrowRight({ className }) {
  return (
    <Svg className={className}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function IconChevronDown({ className }) {
  return (
    <Svg className={className}>
      <path d="M6 9.5l6 5.5 6-5.5" />
    </Svg>
  );
}

export function IconPhone({ className }) {
  return (
    <Svg className={className}>
      <path d="M6.5 3.5h3l1.6 4-2.2 1.6a11 11 0 0 0 5 5l1.6-2.2 4 1.6v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
    </Svg>
  );
}

export function IconMail({ className }) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
    </Svg>
  );
}

export function IconPin({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 21c4.5-5 6.8-8.4 6.8-11.4A6.8 6.8 0 0 0 5.2 9.6C5.2 12.6 7.5 16 12 21z" />
      <circle cx="12" cy="9.6" r="2.6" />
    </Svg>
  );
}

export function IconCheck({ className }) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function IconAlert({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v5.4M12 16.4h.01" />
    </Svg>
  );
}

export function IconInfo({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.4M12 7.8h.01" />
    </Svg>
  );
}

export function IconTruck({ className }) {
  return (
    <Svg className={className}>
      <path d="M3.5 6.5h10v10h-10z" />
      <path d="M13.5 10h4l3 3v3.5h-7z" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="16.5" cy="18.5" r="1.6" />
    </Svg>
  );
}

export function IconFire({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3.5c3.5 3.6 6 6.6 6 9.6a6 6 0 0 1-12 0c0-2.1 1-3.9 2.6-5.4.4 1.6 1.4 2.6 2.4 2.9-.6-2.2-.4-4.4 1-7.1z" />
    </Svg>
  );
}

export function IconLeaf({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 4.5C10.5 5 5 9 5 14.5A5.5 5.5 0 0 0 10.5 20C16 20 19.8 14 20 4.5z" />
      <path d="M13.5 10.5c-3 1.8-5 4.2-6 7.5" />
    </Svg>
  );
}

export function IconClock({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.4 2.2" />
    </Svg>
  );
}

export function IconShield({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3.5l7 2.6v5.6c0 4.3-2.8 7.4-7 8.8-4.2-1.4-7-4.5-7-8.8V6.1z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </Svg>
  );
}

export function IconPackage({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3.5l8 4v9l-8 4-8-4v-9z" />
      <path d="M4.5 8L12 12l7.5-4M12 12v8.5" />
    </Svg>
  );
}

export function IconCopy({ className }) {
  return (
    <Svg className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2.4" />
      <path d="M15.5 6.5V5.9A1.9 1.9 0 0 0 13.6 4H6.4A1.9 1.9 0 0 0 4.5 5.9v7.2A1.9 1.9 0 0 0 6.4 15h.6" />
    </Svg>
  );
}

export function IconStar({ className = 'h-4 w-4', filled = true }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} strokeLinejoin="round">
      <path d="M12 3.6l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" />
    </svg>
  );
}

export function IconSpark({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 4.5l1.7 4.6 4.6 1.7-4.6 1.7L12 17.1l-1.7-4.6-4.6-1.7 4.6-1.7z" />
      <path d="M18.5 16.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </Svg>
  );
}

/** Звёзды рейтинга: заполненные — gold, пустые — hairline. */
export function Stars({ value = 0, className = 'h-4 w-4', label }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label || `Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <IconStar
          key={step}
          className={`${className} ${step <= rounded ? 'text-gold' : 'text-hairline'}`}
          filled={step <= rounded}
        />
      ))}
    </span>
  );
}
