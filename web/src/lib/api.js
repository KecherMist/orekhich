// Единая обёртка над REST-бэкендом лавки: возвращает JSON или бросает Error(text из {error}).
// Есть бэкенд — работаем с ним; если сайт лежит на GitHub Pages (там только статика),
// автоматически переключаемся на демо-режим: снимок каталога + заказы в localStorage браузера.

import { StaticError, probeBackend, staticApi } from './static.js';

const BASE = `${import.meta.env.BASE_URL || '/'}api`;
const TIMEOUT_MS = 15000;
const PROBE_MS = 4000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// live / static решается один раз на загрузку страницы.
let mode = null;
let modePromise = null;

function resolveMode() {
  if (mode) return Promise.resolve(mode);
  if (!modePromise) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_MS);
    modePromise = probeBackend(controller.signal)
      .then((live) => {
        clearTimeout(timer);
        mode = live ? 'live' : 'static';
        return mode;
      })
      .catch(() => {
        mode = 'static';
        return mode;
      });
  }
  return modePromise;
}

function toQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const str = String(value).trim();
    if (!str || str === 'all') return;
    search.set(key, str);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Живой запрос к REST-бэкенду.
 * @param {string} path   путь относительно /api, например '/products'
 * @param {object} [options] { method, body, signal, timeout }
 * @returns {Promise<any>} разобранный JSON
 */
async function liveApi(path, options = {}) {
  const { method = 'GET', body, signal, timeout = TIMEOUT_MS } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  const onOuterAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new ApiError('Запрос отменён', 0);
    }
    signal.addEventListener('abort', onOuterAbort, { once: true });
  }

  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'same-origin',
    });
  } catch (error) {
    if (timedOut) throw new ApiError('Лавка не отвечает: превышено время ожидания', 0);
    if (signal && signal.aborted) throw new ApiError('Запрос отменён', 0);
    if (error && error.name === 'AbortError') throw new ApiError('Запрос отменён', 0);
    throw new ApiError('Не удалось связаться с лавкой. Проверьте соединение', 0);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && typeof data.error === 'string' && data.error) || `Ошибка лавки (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (data === null) throw new ApiError('Лавка вернула пустой ответ', response.status);
  return data;
}

/**
 * Точка входа витрины: живой бэкенд или демо-режим статики.
 * @param {string} path   путь относительно /api, например '/products'
 * @param {object} [options] { method, body, signal }
 */
export async function api(path, options = {}) {
  if ((await resolveMode()) === 'static') return runStatic(path, options);

  try {
    return await liveApi(path, options);
  } catch (error) {
    // Бэкенд пропал (статический хостинг, рестарт процесса) — тихо уходим в демо-режим.
    const lostBackend = error instanceof ApiError && (error.status === 0 || error.status === 404 || error.status === 405);
    if (lostBackend) {
      mode = 'static';
      return runStatic(path, options);
    }
    throw error;
  }
}

async function runStatic(path, options) {
  try {
    return await staticApi(path, options);
  } catch (error) {
    if (error instanceof StaticError) throw new ApiError(error.message, error.status);
    throw new ApiError('Демо-витрина не отвечает', 0);
  }
}

/* ── хелперы витрины ─────────────────────────────────────────────── */

const CATEGORY_LABELS = {
  nuts: 'Орехи',
  mixes: 'Миксы',
  med: 'Мёд',
  сухофрукты: 'Сухофрукты',
  dried: 'Сухофрукты',
};

/** Бэкенд отдаёт {category,c}, спека обещает {slug,name,count} — приводим к одному виду. */
export function normalizeCategories(payload) {
  const items = Array.isArray(payload && payload.items) ? payload.items : [];
  return items
    .map((raw) => {
      const slug = String(raw.slug || raw.category || '').trim();
      if (!slug) return null;
      const name = String(raw.name || CATEGORY_LABELS[slug] || slug).trim();
      const count = Number(raw.count != null ? raw.count : raw.c) || 0;
      return { slug, name, count };
    })
    .filter(Boolean);
}

export function getHealth(signal) {
  return api('/health', { signal });
}

export async function getCategories(signal) {
  const payload = await api('/categories', { signal });
  return normalizeCategories(payload);
}

export function getProducts(params, signal) {
  return api(`/products${toQuery(params)}`, { signal });
}

export function getProduct(slug, signal) {
  return api(`/products/${encodeURIComponent(slug)}`, { signal });
}

export function getReviews(limit = 6, signal) {
  return api(`/reviews?limit=${Number(limit) || 6}`, { signal });
}

export function createReview(payload) {
  return api('/reviews', { method: 'POST', body: payload });
}

export function createOrder(payload) {
  return api('/orders', { method: 'POST', body: payload });
}

export function validatePromocode(code) {
  return api('/promocode/validate', { method: 'POST', body: { code } });
}

export function trackOrder(number, signal) {
  return api(`/orders/track/${encodeURIComponent(String(number).trim())}`, { signal });
}

export function subscribe(email) {
  return api('/subscribe', { method: 'POST', body: { email: String(email).trim() } });
}
