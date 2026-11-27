// Тосты лавки: свой компонент, живут 4 секунды, не перекрывают друг друга.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconClose, IconSpark } from './Icons.jsx';

const ToastContext = createContext(null);
const TTL_MS = 4000;
const MAX_VISIBLE = 3;

const TONE_STYLES = {
  success: {
    box: 'border-olive/35 bg-card text-ink',
    icon: 'bg-olive/15 text-olive',
    Icon: IconCheck,
  },
  error: {
    box: 'border-caramel/40 bg-card text-ink',
    icon: 'bg-caramel/15 text-caramel',
    Icon: IconAlert,
  },
  info: {
    box: 'border-hairline bg-card text-ink',
    icon: 'bg-ink/10 text-muted',
    Icon: IconSpark,
  },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'info') => {
      const text = String(message || '').trim();
      if (!text) return null;
      seq.current += 1;
      const id = seq.current;
      setItems((prev) => [...prev, { id, message: text, tone }].slice(-MAX_VISIBLE));
      window.setTimeout(() => dismiss(id), TTL_MS);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
        role="region"
        aria-live="polite"
        aria-label="Уведомления лавки"
      >
        {items.map((item) => {
          const tone = TONE_STYLES[item.tone] || TONE_STYLES.info;
          const Icon = tone.Icon;
          return (
            <div
              key={item.id}
              role="status"
              className={`anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[16px] border px-4 py-3 shadow-lift ${tone.box}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone.icon}`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="pt-1 text-[14px] leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Закрыть уведомление"
                className="ml-auto rounded-pill p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast должен вызываться внутри ToastProvider');
  return ctx;
}
