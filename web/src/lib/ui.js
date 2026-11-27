// Мелкие хуки интерфейса: debounce, поведение оверлея (Esc, блокировка скролла, ловушка фокуса).

import { useEffect, useRef, useState } from 'react';

/** Значение с задержкой — для поиска каталога (300 мс по спеке). */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Поведение модального слоя: Escape закрывает, скролл страницы блокируется,
 * Tab не уходит за пределы панели, фокус возвращается на триггер.
 * @param {boolean} open      открыт ли слой
 * @param {Function} onClose  what to do on Escape / Tab-catch
 * @param {{current: HTMLElement|null}} panelRef  ссылка на панель
 */
export function useOverlay(open, onClose, panelRef) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => {
      if (panelRef && panelRef.current) {
        const target = panelRef.current.querySelector('[data-autofocus]') || panelRef.current;
        if (typeof target.focus === 'function') target.focus({ preventScroll: true });
      }
    }, 40);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, panelRef]);
}

/** Копирование в буфер обмена с fallback для небезопасного контекста. */
export async function copyText(value) {
  const text = String(value || '');
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* падаем в fallback */
  }
  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '-1000px';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(helper);
    return ok;
  } catch {
    return false;
  }
}

/** Плавная прокрутка к якорю с учётом sticky-шапки (96px). */
export function scrollToAnchor(id) {
  const node = document.getElementById(id);
  if (!node) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = node.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}
