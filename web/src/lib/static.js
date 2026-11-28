// Статичный (демо) режим витрины «Орехич» для GitHub Pages.
// GitHub Pages отдаёт только файлы: бэкенда там нет, поэтому каталог читается из
// снимка `data/snapshot.json`, а заказы, отзывы и подписки живут в localStorage браузера.
// Формы ответов/ошибок совпадают с REST-контрактом server/src/api.js.

const SNAPSHOT_URL = `${import.meta.env.BASE_URL || '/'}data/snapshot.json`;

const LS = {
  orders: 'orekhich.static.orders',
  reviews: 'orekhich.static.reviews',
  subs: 'orekhich.static.subscribers',
  promos: 'orekhich.static.promocodes',
  stock: 'orekhich.static.stock',
};

const DELIVERY = {
  courier: { label: 'Курьер по Москве в день обжарки', fee: 350 },
  cdek: { label: 'СДЭК по России', fee: 350 },
  post: { label: 'Почта России', fee: 300 },
  pickup: { label: 'Самовывоз: Даниловский рынок, пав. 4', fee: 0 },
};

const PAYMENT_LABELS = { card: 'Карта онлайн', cash: 'Наличные при получении', sbp: 'СБП' };
const MAX_LINES = 30;

export class StaticError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'StaticError';
    this.status = status;
  }
}

const fold = (v) => String(v ?? '').toLowerCase().replace(/ё/g, 'е').trim();
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || ''));
const digits = (v) => String(v ?? '').replace(/\D/g, '');
const isPhone = (v) => {
  const d = digits(v);
  return d.length === 11 && d.startsWith('7') || d.length === 10;
};
const normCode = (v) => clean(v, 24).toUpperCase();
const round = (n) => Math.round(n);

function readLS(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим браузера — демо работает без сохранения */
  }
}

let snapshotPromise = null;

export function loadSnapshot() {
  if (!snapshotPromise) {
    snapshotPromise = fetch(SNAPSHOT_URL, { cache: 'no-cache' }).then(async (res) => {
      if (!res.ok) throw new StaticError('Не удалось загрузить снимок витрины', res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.products)) throw new StaticError('Снимок витрины повреждён', 500);
      return data;
    });
    snapshotPromise.catch(() => { snapshotPromise = null; });
  }
  return snapshotPromise;
}

// Прям ли бэкенд? Если нет (GitHub Pages), переходим на статичный режим.
export async function probeBackend(signal) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL || '/'}api/health`, { signal, cache: 'no-cache' });
    if (!res.ok) return false;
    const payload = await res.json().catch(() => null);
    return Boolean(payload && payload.ok);
  } catch {
    return false;
  }
}

function stockOf(snap, product) {
  const local = readLS(LS.stock, {});
  const key = product.slug || String(product.id);
  return key in local ? local[key] : product.stock;
}

function applyStock(lines) {
  const local = readLS(LS.stock, {});
  for (const line of lines) {
    const key = line.slug || String(line.product_id);
    local[key] = Math.max(0, (local[key] ?? line.stock ?? 0) - line.qty);
  }
  writeLS(LS.stock, local);
}

function categories(snap) {
  const counts = new Map();
  for (const p of snap.products) counts.set(p.category, (counts.get(p.category) || 0) + 1);
  return [...counts.entries()].map(([category, c]) => ({ category, c }));
}

function sortProducts(items, sort) {
  const byRating = (a, b) => (b.rating - a.rating) || (b.reviews_count - a.reviews_count) || (b.id - a.id);
  const copy = [...items];
  if (sort === 'price-asc') return copy.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return copy.sort((a, b) => b.price - a.price);
  if (sort === 'new') return copy.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : b.id - a.id));
  return copy.sort(byRating);
}

function localReviews() {
  return readLS(LS.reviews, []);
}

function approvedReviews(snap) {
  return [...snap.reviews.items, ...localReviews().filter((r) => r.status === 'approved')];
}

function allPromos(snap) {
  const local = readLS(LS.promos, []);
  // Промокод из снимка помечем использованным, если он уже сработал в этом браузере —
  // как в живом режиме, где код после заказа привязывается к заказу.
  return snap.promokodes.map((p) => {
    const used = local.find((x) => normCode(x.code) === normCode(p.code));
    return { ...p, used: Boolean(used?.used) };
  }).concat(local.filter((p) => !snap.promokodes.some((s) => normCode(s.code) === normCode(p.code))));
}

function findPromo(snap, code) {
  return allPromos(snap).find((p) => normCode(p.code) === normCode(code)) || null;
}

function subscribePromo(email, percent) {
  const seedText = `oreh1ch-${fold(email)}`;
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) h = (h ^ seedText.charCodeAt(i)) * 16777619 >>> 0;
  const code = `OREH-${String(h % 900000 + 100000)}`;
  const promos = readLS(LS.promos, []);
  if (!promos.some((p) => normCode(p.code) === code)) {
    promos.push({ code, percent, kind: 'personal', used: false });
    writeLS(LS.promos, promos);
  }
  return code;
}

function orderNumber() {
  const year = String(new Date().getFullYear()).slice(2);
  return `OREH-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function priceCart(snap, rawItems) {
  const list = Array.isArray(rawItems) ? rawItems : [];
  if (!list.length) throw new StaticError('Корзина пуста', 422);
  if (list.length > MAX_LINES) throw new StaticError(`Не больше ${MAX_LINES} позиций в заказе`, 422);
  const lines = [];
  for (const raw of list) {
    const qty = Number(raw?.qty ?? 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new StaticError('Количество от 1 до 99', 422);
    const key = clean(raw?.slug ?? raw?.productId ?? '', 80);
    const product = snap.products.find((p) => String(p.id) === String(raw?.productId ?? '') || p.slug === key);
    if (!product || !product.is_active) throw new StaticError('В корзине есть недоступный товар, обновите страницу', 422);
    const stock = stockOf(snap, product);
    if (stock < qty) throw new StaticError(`${product.name}: в наличии только ${stock} шт.`, 422);
    lines.push({ product_id: product.id, slug: product.slug, stock: product.stock, name: product.name, price: product.price, qty });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return { lines, subtotal };
}

const ok = (v) => v;

async function createOrder(snap, body) {
  const b = body || {};
  const cart = priceCart(snap, b.items);
  const name = clean(b.customer?.name, 80);
  const phone = clean(b.customer?.phone, 30);
  const city = clean(b.customer?.city, 60) || 'Москва';
  const address = clean(b.customer?.address, 200);
  const email = clean(b.customer?.email, 160).toLowerCase();
  const delivery = DELIVERY[b.customer?.delivery] ? b.customer.delivery : 'courier';
  const payment = ['card', 'cash', 'sbp'].includes(b.customer?.payment) ? b.customer.payment : 'card';
  const comment = clean(b.customer?.comment, 500);

  if (name.length < 2) throw new StaticError('Укажите имя получателя', 422);
  if (!isPhone(phone)) throw new StaticError('Телефон в формате +7 900 000-00-00', 422);
  if (delivery !== 'pickup' && address.length < 6) throw new StaticError('Укажите адрес доставки', 422);
  if (email && !isEmail(email)) throw new StaticError('Проверьте e-mail', 422);

  let discount = 0;
  let promoCode = null;
  let usedPromo = null;
  if (b.promocode) {
    const promo = findPromo(snap, b.promocode);
    if (!promo || promo.used) throw new StaticError('Промокод не найден или уже использован', 422);
    discount = round(cart.subtotal * promo.percent / 100);
    promoCode = normCode(promo.code);
    usedPromo = promo;
  }

  const freeFrom = snap.config?.freeDeliveryFrom ?? 2500;
  const fee = delivery === 'pickup' ? 0 : (cart.subtotal >= freeFrom ? 0 : DELIVERY[delivery].fee);
  const total = Math.max(0, cart.subtotal - discount) + fee;
  const number = orderNumber();

  applyStock(cart.lines);

  if (promoCode) {
    const promos = readLS(LS.promos, []);
    const known = promos.find((p) => normCode(p.code) === promoCode);
    if (known) known.used = true;
    else promos.push({ code: promoCode, percent: usedPromo.percent, kind: usedPromo.kind ?? 'generic', used: true });
    writeLS(LS.promos, promos);
  }

  const created = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const orders = readLS(LS.orders, []);
  orders.push({
    number,
    status: 'new',
    total,
    subtotal: cart.subtotal,
    discount,
    delivery_fee: fee,
    delivery: DELIVERY[delivery].label,
    payment: PAYMENT_LABELS[payment],
    created_at: created,
    items: cart.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty })),
    timeline: [{ status: 'new', note: 'Заказ принят лавкой', created_at: created }],
  });
  writeLS(LS.orders, orders.slice(-50));

  return ok({
    orderNumber: number,
    id: orders.length,
    total,
    subtotal: cart.subtotal,
    discount,
    deliveryFee: fee,
    status: 'new',
    message: `Заказ ${number} принят. Обжарим и отправим в ближайшую пятницу.`,
  });
}

function trackOrder(number) {
  const order = readLS(LS.orders, []).find((o) => o.number === normCode(number));
  if (!order) throw new StaticError('Заказ не найден', 404);
  return {
    number: order.number,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    delivery_fee: order.delivery_fee,
    delivery: order.delivery,
    payment: order.payment,
    created_at: order.created_at,
    items: order.items,
    timeline: order.timeline,
  };
}

function getProducts(snap, query) {
  const category = clean(query.get('category'), 24);
  const q = fold(query.get('q'));
  const min = Number(query.get('min')) || 0;
  const max = Number(query.get('max')) || 0;
  let items = snap.products.filter((p) => p.is_active);
  if (category && category !== 'all') items = items.filter((p) => p.category === category);
  if (q) items = items.filter((p) => [p.name, p.short, p.origin].some((v) => fold(v).includes(q)));
  if (min) items = items.filter((p) => p.price >= min);
  if (max) items = items.filter((p) => p.price <= max);
  items = sortProducts(items, query.get('sort'));
  return { items, total: items.length, config: snap.config };
}

function getProduct(snap, slug) {
  const product = snap.products.find((p) => p.slug === slug && p.is_active);
  if (!product) throw new StaticError('Товар не найден', 404);
  const reviews = approvedReviews(snap).filter((r) => r.product_slug === slug).slice(0, 6)
    .map(({ product_slug, ...rest }) => rest);
  const similar = snap.products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  return { ...product, reviews, similar };
}

function getReviews(snap, query) {
  const limit = Math.min(Number(query.get('limit')) || 6, 24);
  const items = approvedReviews(snap).slice(0, limit)
    .map(({ product_slug, ...rest }) => rest);
  return { items, stats: snap.reviews.stats };
}

async function createReview(body) {
  const b = body || {};
  const author = clean(b.author, 60);
  const text = clean(b.text, 900);
  const rating = Number(b.rating) || 0;
  if (author.length < 2) throw new StaticError('Укажите имя', 422);
  if (text.length < 20) throw new StaticError('Расскажите подробнее — минимум 20 символов', 422);
  if (rating < 1 || rating > 5) throw new StaticError('Оценка от 1 до 5', 422);
  const reviews = localReviews();
  reviews.push({
    author,
    city: clean(b.city, 60) || '',
    rating,
    text,
    product: clean(b.product, 80),
    product_slug: clean(b.product_slug ?? b.product, 80),
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: 'pending',
  });
  writeLS(LS.reviews, reviews.slice(-50));
  return { id: reviews.length, status: 'pending', message: 'Спасибо! Отзыв появится после проверки лавкой.' };
}

async function subscribe(snap, body) {
  const email = clean(body?.email, 160).toLowerCase();
  if (!isEmail(email)) throw new StaticError('Проверьте формат e-mail', 422);
  const percent = snap.config?.firstOrderPercent ?? 15;
  const subs = readLS(LS.subs, []);
  const known = subs.find((s) => s.email === email);
  if (known) {
    return { already: true, promo: known.promo, percent, message: 'Вы уже в списке — промокод ниже.' };
  }
  const promo = subscribePromo(email, percent);
  subs.push({ email, promo });
  writeLS(LS.subs, subs.slice(-200));
  return { promo, percent, message: `Промокод ${promo} на первую покупку. Сработает в корзине.` };
}

function validatePromocode(snap, body) {
  const code = normCode(body?.code);
  if (code.length < 3) throw new StaticError('Введите промокод', 422);
  const promo = findPromo(snap, code);
  if (!promo || promo.used) throw new StaticError('Промокод не найден или уже использован', 404);
  return { code: normCode(promo.code), percent: promo.percent };
}

// Мини-роутер: путь + метод → ответ в формате REST-контракта.
export async function staticApi(path, options = {}) {
  const snap = await loadSnapshot();
  const [rawPath, qs] = String(path).split('?');
  const query = new URLSearchParams(qs || '');
  const method = (options.method || 'GET').toUpperCase();
  const decoded = decodeURIComponent(rawPath);
  const segments = decoded.replace(/^\/+|\/+$/g, '').split('/');
  const body = options.body ? JSON.parse(options.body) : {};

  if (method === 'GET' && segments.length === 1 && segments[0] === 'health') {
    return { ok: true, service: 'orekhich-static', time: new Date().toISOString(), products: snap.products.length, mode: 'static' };
  }

  if (method === 'GET' && segments[0] === 'categories') {
    return { items: categories(snap) };
  }

  if (segments[0] === 'products') {
    if (method !== 'GET') throw new StaticError('В демо-режиме лавки товары меняет только хозяйка', 405);
    if (segments.length === 1) return getProducts(snap, query);
    if (segments.length === 2) return getProduct(snap, segments[1]);
  }

  if (segments[0] === 'reviews') {
    if (method === 'GET') return getReviews(snap, query);
    if (method === 'POST') return createReview(body);
  }

  if (segments[0] === 'orders' && segments[1] === 'track' && segments[2]) {
    if (method !== 'GET') throw new StaticError('Метод не поддерживается', 405);
    return trackOrder(segments[2]);
  }

  if (method === 'POST' && segments[0] === 'orders' && segments.length === 1) return createOrder(snap, body);
  if (method === 'POST' && segments[0] === 'promocode' && segments[1] === 'validate') return validatePromocode(snap, body);
  if (method === 'POST' && segments[0] === 'subscribe') return subscribe(snap, body);

  throw new StaticError('В демо-режиме лавки этот запрос недоступен', 501);
}
