// Состояние корзины: reducer + localStorage['orekhich.cart'] + snapshot товара для отрисовки внутри drawer.

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

const STORAGE_KEY = 'orekhich.cart';
export const MAX_QTY = 30;

export const DEFAULT_CONFIG = {
  freeDeliveryFrom: 2500,
  deliveryFee: 350,
  pickupFee: 0,
  firstOrderPromo: 'ОРЕХИЧ15',
  firstOrderPercent: 15,
};

const CartContext = createContext(null);

function clampQty(qty, stock) {
  let n = Math.trunc(Number(qty) || 0);
  if (n < 1) n = 1;
  if (Number.isFinite(stock) && stock > 0 && n > stock) n = stock;
  if (n > MAX_QTY) n = MAX_QTY;
  return n;
}

function snapshot(product) {
  if (!product || !product.slug) return null;
  return {
    slug: String(product.slug),
    qty: clampQty(product.qty || 1, product.stock),
    name: String(product.name || ''),
    price: Number(product.price) || 0,
    weight_g: Number(product.weight_g) || 0,
    tone: product.tone || '#EFE3D0',
    accent: product.accent || '#C1662F',
    art: product.art || 'hazelnut',
    stock: Number.isFinite(product.stock) ? product.stock : null,
  };
}

function readStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line) => {
        if (!line || !line.slug) return null;
        const base = {
          slug: String(line.slug),
          qty: clampQty(line.qty, line.stock),
          name: String(line.name || ''),
          price: Number(line.price) || 0,
          weight_g: Number(line.weight_g) || 0,
          tone: line.tone || '#EFE3D0',
          accent: line.accent || '#C1662F',
          art: line.art || 'hazelnut',
          stock: Number.isFinite(line.stock) ? line.stock : null,
        };
        return base;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function persist(lines) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.map(({ slug, qty }) => ({ slug, qty }))));
  } catch {
    /* приватный режим — просто продолжаем в памяти */
  }
}

function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const line = snapshot(action.product);
      if (!line) return lines;
      const qty = clampQty(action.qty || 1, line.stock);
      const existing = lines.find((item) => item.slug === line.slug);
      if (existing) {
        return lines.map((item) =>
          item.slug === line.slug
            ? { ...item, ...line, qty: clampQty(item.qty + qty, item.stock == null ? line.stock : item.stock) }
            : item,
        );
      }
      return [...lines, { ...line, qty }];
    }
    case 'setQty': {
      const found = lines.find((item) => item.slug === action.slug);
      if (!found) return lines;
      const qty = clampQty(action.qty, found.stock);
      if (qty <= 0) return lines.filter((item) => item.slug !== action.slug);
      return lines.map((item) => (item.slug === action.slug ? { ...item, qty } : item));
    }
    case 'inc': {
      return lines.map((item) => (item.slug === action.slug ? { ...item, qty: clampQty(item.qty + 1, item.stock) } : item));
    }
    case 'dec': {
      return lines
        .map((item) => (item.slug === action.slug ? { ...item, qty: Math.max(0, item.qty - 1) } : item))
        .filter((item) => item.qty > 0);
    }
    case 'remove':
      return lines.filter((item) => item.slug !== action.slug);
    case 'replace':
      return Array.isArray(action.lines) ? action.lines : lines;
    case 'clear':
      return [];
    case 'refresh': {
      const bySlug = new Map((action.products || []).map((p) => [p.slug, p]));
      return lines.map((line) => {
        const fresh = bySlug.get(line.slug);
        if (!fresh) return line;
        const merged = {
          ...line,
          name: fresh.name || line.name,
          price: Number.isFinite(fresh.price) ? fresh.price : line.price,
          weight_g: Number.isFinite(fresh.weight_g) ? fresh.weight_g : line.weight_g,
          tone: fresh.tone || line.tone,
          accent: fresh.accent || line.accent,
          art: fresh.art || line.art,
          stock: Number.isFinite(fresh.stock) ? fresh.stock : line.stock,
        };
        return { ...merged, qty: clampQty(merged.qty, merged.stock) };
      });
    }
    default:
      return lines;
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, readStorage);
  const [open, setOpen] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    persist(lines);
  }, [lines]);

  // Синхронизация между вкладками: перечитываем ключ и подменяем строки
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      dispatch({ type: 'replace', lines: readStorage() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, qty = 1) => dispatch({ type: 'add', product, qty }), []);
  const setQty = useCallback((slug, qty) => dispatch({ type: 'setQty', slug, qty }), []);
  const inc = useCallback((slug) => dispatch({ type: 'inc', slug }), []);
  const dec = useCallback((slug) => dispatch({ type: 'dec', slug }), []);
  const remove = useCallback((slug) => dispatch({ type: 'remove', slug }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const refresh = useCallback((products) => dispatch({ type: 'refresh', products }), []);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const qtyOf = useCallback((slug) => (lines.find((line) => line.slug === slug) || {}).qty || 0, [lines]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.qty * line.price, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      open,
      add,
      inc,
      dec,
      setQty,
      remove,
      clear,
      refresh,
      qtyOf,
      openCart,
      closeCart,
    }),
    [lines, count, subtotal, open, add, inc, dec, setQty, remove, clear, refresh, qtyOf, openCart, closeCart],
  );

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart должен вызываться внутри CartProvider');
  return ctx;
}
