// Орехич — REST API: витрина, заказы, промокоды, подписки, отзывы, админ
import express from 'express';
import crypto from 'node:crypto';
import { db, CONFIG, hashPass, verifyPass, secretKey, fold } from './db.js';

const router = express.Router();
const SECRET = process.env.APP_SECRET || secretKey();
const ADMIN_TTL_MS = 12 * 3600 * 1000;

/* ---------- helpers ---------- */
const ok = (res, data) => res.json(data);
const fail = (res, status, error) => res.status(status).json({ error });

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
}
function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = verify(token);
  if (!session || session.role !== 'admin') return fail(res, 401, 'Нужна авторизация администратора');
  req.admin = session;
  next();
}
const normCode = c => String(c || '').trim().toUpperCase().replace(/\s+/g, '');
const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
const isPhone = v => /^[\d+()\- ]{7,20}$/.test(String(v || '').trim());

const DELIVERY = {
  courier: { label: 'Курьер по Москве в день обжарки', fee: 350 },
  cdek: { label: 'СДЭК по России', fee: 350 },
  post: { label: 'Почта России', fee: 300 },
  pickup: { label: 'Самовывоз: Даниловский рынок, пав. 4', fee: 0 },
};

/* ---------- витрина ---------- */
router.get('/health', (_req, res) => ok(res, {
  ok: true, service: 'orekhich-api', time: new Date().toISOString(),
  products: db.prepare('SELECT COUNT(*) c FROM products WHERE is_active=1').get().c,
}));

router.get('/categories', (_req, res) => ok(res, {
  items: db.prepare(`SELECT category, COUNT(*) c FROM products WHERE is_active=1 GROUP BY category ORDER BY c DESC`).all(),
}));

router.get('/products', (req, res) => {
  const { category, q, sort = 'popular', min, max } = req.query;
  const where = ['is_active=1'];
  const params = {};
  if (category && category !== 'all') { where.push('category = @category'); params.category = category; }
  if (q) { where.push('(norm(name) LIKE @q OR norm(short) LIKE @q OR norm(origin) LIKE @q)'); params.q = `%${fold(q)}%`; }
  if (min) { where.push('price >= @min'); params.min = Number(min); }
  if (max) { where.push('price <= @max'); params.max = Number(max); }
  const order = { 'price-asc': 'price ASC', 'price-desc': 'price DESC', new: 'created_at DESC, id DESC' }[sort] || 'rating DESC, reviews_count DESC';
  const items = db.prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY ${order}`).all(params);
  ok(res, { items, total: items.length, config: CONFIG });
});

router.get('/products/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE slug = ? AND is_active=1').get(req.params.slug);
  if (!p) return fail(res, 404, 'Товар не найден');
  p.reviews = db.prepare(`SELECT author, city, rating, text, created_at FROM reviews WHERE product_id=? AND status='approved' ORDER BY id DESC LIMIT 6`).all(p.id);
  p.similar = db.prepare(`SELECT slug,name,price,old_price,art,tone,accent FROM products WHERE is_active=1 AND category=? AND id<>? ORDER BY RANDOM() LIMIT 3`).all(p.category, p.id);
  ok(res, p);
});

router.get('/reviews', (req, res) => ok(res, {
  items: db.prepare(`SELECT r.author, r.city, r.rating, r.text, r.created_at, p.name AS product
    FROM reviews r LEFT JOIN products p ON p.id=r.product_id
    WHERE r.status='approved' ORDER BY r.rating DESC, r.id DESC LIMIT ?`).all(Number(req.query.limit) || 12),
  stats: db.prepare(`SELECT COUNT(*) total, ROUND(AVG(rating),2) avg FROM reviews WHERE status='approved'`).get(),
}));

router.post('/reviews', (req, res) => {
  const { author, city, rating, text, product_slug } = req.body || {};
  if (clean(author, 60).length < 2) return fail(res, 422, 'Укажите имя');
  if (clean(text, 900).length < 20) return fail(res, 422, 'Отзыв слишком короткий (минимум 20 символов)');
  const r = Math.max(1, Math.min(5, Number(rating) || 5));
  const product = product_slug ? db.prepare('SELECT id FROM products WHERE slug=?').get(product_slug) : null;
  const info = db.prepare('INSERT INTO reviews (product_id,author,city,rating,text) VALUES (?,?,?,?,?)')
    .run(product?.id ?? null, clean(author, 60), clean(city, 60) || null, r, clean(text, 900));
  ok(res, { id: info.lastInsertRowid, status: 'pending', message: 'Спасибо! Отзыв появится после проверки лавкой.' });
});

/* ---------- подписка и промокоды ---------- */
router.post('/subscribe', (req, res) => {
  const email = clean(req.body?.email, 160).toLowerCase();
  if (!isEmail(email)) return fail(res, 422, 'Проверьте формат e-mail');
  const promo = 'OREH-' + crypto.randomInt(100000, 999999);
  try {
    db.prepare('INSERT INTO subscribers (email, promo, source) VALUES (?,?,?)').run(email, promo, clean(req.body?.source, 40) || 'site');
    db.prepare('INSERT INTO promokodes (code, percent, kind) VALUES (?,?,?)').run(promo, CONFIG.firstOrderPercent, 'personal');
  } catch (e) {
    if (!String(e.message).includes('UNIQUE')) throw e;
    const existing = db.prepare('SELECT promo FROM subscribers WHERE email=?').get(email);
    return ok(res, { already: true, promo: existing.promo, percent: CONFIG.firstOrderPercent });
  }
  ok(res, { promo, percent: CONFIG.firstOrderPercent, message: `Промокод ${promo} — минус 15 % на первый заказ.` });
});

router.post('/promocode/validate', (req, res) => {
  const code = normCode(req.body?.code);
  if (!code) return fail(res, 422, 'Введите промокод');
  const promo = db.prepare('SELECT code, percent, is_active FROM promokodes WHERE code=? AND order_id IS NULL').get(code);
  if (!promo || !promo.is_active) return fail(res, 404, 'Промокод не найден или уже использован');
  ok(res, { code: promo.code, percent: promo.percent });
});

/* ---------- заказы ---------- */
function priceCart(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { error: 'Корзина пуста' };
  const lines = [];
  for (const raw of rawItems.slice(0, 40)) {
    const wanted = Number(raw.qty);
    if (!Number.isFinite(wanted) || wanted < 1) return { error: 'Некорректное количество товара в корзине' };
    if (wanted > 30) return { error: 'Максимум 30 пачек в заказе, для опта напишите нам напрямую' };
    const qty = Math.min(30, Math.trunc(wanted));
    const p = db.prepare('SELECT id, name, price, stock, is_active FROM products WHERE id=? OR slug=?').get(raw.productId ?? -1, clean(raw.slug, 80));
    if (!p || !p.is_active) return { error: 'В корзине есть недоступный товар, обновите страницу' };
    if (p.stock < qty) return { error: `${p.name}: в наличии только ${p.stock} шт.` };
    lines.push({ product_id: p.id, name: p.name, price: p.price, qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  return { lines, subtotal };
}

router.post('/orders', (req, res) => {
  const b = req.body || {};
  const cart = priceCart(b.items);
  if (cart.error) return fail(res, 422, cart.error);

  const name = clean(b.customer?.name, 80), phone = clean(b.customer?.phone, 30);
  const city = clean(b.customer?.city, 60) || 'Москва', address = clean(b.customer?.address, 200);
  const email = clean(b.customer?.email, 160).toLowerCase();
  const delivery = DELIVERY[b.customer?.delivery] ? b.customer.delivery : 'courier';
  const payment = ['card', 'cash', 'sbp'].includes(b.customer?.payment) ? b.customer.payment : 'card';
  const comment = clean(b.customer?.comment, 500);

  if (name.length < 2) return fail(res, 422, 'Укажите имя получателя');
  if (!isPhone(phone)) return fail(res, 422, 'Телефон в формате +7 900 000-00-00');
  if (delivery !== 'pickup' && address.length < 6) return fail(res, 422, 'Укажите адрес доставки');
  if (email && !isEmail(email)) return fail(res, 422, 'Проверьте e-mail');

  let discount = 0, promoCode = null;
  if (b.promocode) {
    const code = normCode(b.promocode);
    const promo = db.prepare('SELECT code, percent, kind, is_active FROM promokodes WHERE code=? AND order_id IS NULL').get(code);
    if (!promo || !promo.is_active) return fail(res, 422, 'Промокод не найден или уже использован');
    discount = Math.round(cart.subtotal * promo.percent / 100);
    promoCode = promo.code;
  }
  const fee = delivery === 'pickup' ? 0 : (cart.subtotal >= CONFIG.freeDeliveryFrom ? 0 : DELIVERY[delivery].fee);
  const total = Math.max(0, cart.subtotal - discount) + fee;
  const number = 'OREH-' + new Date().getFullYear().toString().slice(2) + '-' + crypto.randomInt(1000, 9999);

  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO orders (number,status,name,phone,email,city,address,delivery,payment,promocode,comment,subtotal,discount,delivery_fee,total)
      VALUES (?, 'new', ?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(number, name, phone, email || null, city, address || 'самовывоз', DELIVERY[delivery].label,
        { card: 'Карта онлайн', cash: 'Наличные при получении', sbp: 'СБП' }[payment], promoCode, comment || null,
        cart.subtotal, discount, fee, total);
    const orderId = Number(info.lastInsertRowid);
    const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?,?,?,?,?)');
    const updStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const l of cart.lines) { insItem.run(orderId, l.product_id, l.name, l.price, l.qty); updStock.run(l.qty, l.product_id); }
    db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?,?,?)').run(orderId, 'new', 'Заказ принят лавкой');
    if (promoCode) db.prepare('UPDATE promokodes SET order_id=? WHERE code=?').run(orderId, promoCode);
    return orderId;
  });
  const orderId = tx();
  ok(res, {
    orderNumber: number, id: orderId, total, subtotal: cart.subtotal, discount, deliveryFee: fee,
    status: 'new', message: `Заказ ${number} принят. Обжарим и отправим в ближайшую пятницу.`,
  });
});

router.get('/orders/track/:number', (req, res) => {
  const order = db.prepare('SELECT number, status, total, subtotal, discount, delivery_fee, delivery, payment, created_at FROM orders WHERE number=?').get(clean(req.params.number, 40));
  if (!order) return fail(res, 404, 'Заказ не найден');
  order.items = db.prepare('SELECT name, price, qty FROM order_items WHERE order_id=(SELECT id FROM orders WHERE number=?)').all(order.number);
  order.timeline = db.prepare('SELECT status, note, created_at FROM order_events WHERE order_id=(SELECT id FROM orders WHERE number=?) ORDER BY id').all(order.number);
  ok(res, order);
});

/* ---------- админ ---------- */
router.post('/admin/login', (req, res) => {
  const login = clean(req.body?.login, 60), password = String(req.body?.password || '');
  const admin = db.prepare('SELECT * FROM admins WHERE login=?').get(login);
  if (!admin || !verifyPass(password, admin.salt, admin.pass_hash)) return fail(res, 401, 'Неверный логин или пароль');
  const token = sign({ sub: admin.id, login: admin.login, role: 'admin', name: admin.name, exp: Date.now() + ADMIN_TTL_MS });
  ok(res, { token, name: admin.name, login: admin.login, expiresIn: '12 ч' });
});

router.use('/admin', requireAdmin);

router.get('/admin/stats', (_req, res) => ok(res, {
  revenue: db.prepare("SELECT IFNULL(SUM(total),0) v FROM orders WHERE status<>'cancelled'").get().v,
  ordersToday: db.prepare("SELECT COUNT(*) v FROM orders WHERE date(created_at)=date('now')").get().v,
  ordersTotal: db.prepare('SELECT COUNT(*) v FROM orders').get().v,
  awaiting: db.prepare("SELECT COUNT(*) v FROM orders WHERE status IN ('new','roast','shipping')").get().v,
  lowStock: db.prepare('SELECT COUNT(*) v FROM products WHERE stock < 20 AND is_active=1').get().v,
  subscribers: db.prepare('SELECT COUNT(*) v FROM subscribers').get().v,
  pendingReviews: db.prepare("SELECT COUNT(*) v FROM reviews WHERE status='pending'").get().v,
  topProducts: db.prepare(`SELECT p.name, SUM(oi.qty) qty, SUM(oi.price*oi.qty) revenue FROM order_items oi
    JOIN orders o ON o.id=oi.order_id AND o.status<>'cancelled' JOIN products p ON p.id=oi.product_id
    GROUP BY p.id ORDER BY revenue DESC LIMIT 5`).all(),
}));

router.get('/admin/orders', (req, res) => {
  const params = {};
  const where = ['1=1'];
  if (req.query.status) { where.push('status=@status'); params.status = req.query.status; }
  const items = db.prepare(`SELECT id,number,status,name,phone,city,delivery,payment,subtotal,discount,delivery_fee,total,promocode,created_at
    FROM orders WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT 200`).all(params)
    .map(o => ({ ...o, items: db.prepare('SELECT name, price, qty FROM order_items WHERE order_id=?').all(o.id) }));
  ok(res, { items, statuses: ['new', 'roast', 'packing', 'shipping', 'done', 'cancelled'] });
});

router.patch('/admin/orders/:id', (req, res) => {
  const order = db.prepare('SELECT id, status FROM orders WHERE id=?').get(Number(req.params.id));
  if (!order) return fail(res, 404, 'Заказ не найден');
  const status = clean(req.body?.status, 20);
  const allowed = ['new', 'roast', 'packing', 'shipping', 'done', 'cancelled'];
  if (!allowed.includes(status)) return fail(res, 422, 'Неизвестный статус');
  const note = clean(req.body?.note, 200) || null;
  db.transaction(() => {
    db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, order.id);
    db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?,?,?)').run(order.id, status, note);
  })();
  ok(res, { id: order.id, status });
});

router.get('/admin/products', (_req, res) => ok(res, {
  items: db.prepare('SELECT * FROM products ORDER BY id').all(),
  categories: [...new Set(db.prepare('SELECT category FROM products').all().map(p => p.category))],
}));

const PRODUCT_FIELDS = ['slug', 'name', 'category', 'weight_g', 'price', 'old_price', 'badge', 'art', 'tone', 'accent', 'origin', 'short', 'description', 'stock', 'is_active'];
router.post('/admin/products', (req, res) => {
  const b = req.body || {};
  const values = {
    slug: clean(b.slug, 80) || clean(b.name, 80).toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-'),
    name: clean(b.name, 120), category: clean(b.category, 40) || 'nuts', weight_g: Number(b.weight_g) || 500,
    price: Math.max(1, Number(b.price) || 0), old_price: b.old_price ? Number(b.old_price) : null,
    badge: clean(b.badge, 30) || null, art: clean(b.art, 30) || 'hazelnut', tone: clean(b.tone, 20) || '#EFE3D0',
    accent: clean(b.accent, 20) || '#C1662F', origin: clean(b.origin, 120) || null, short: clean(b.short, 160) || null,
    description: clean(b.description, 2000) || null, stock: Math.max(0, Number(b.stock) || 0),
    is_active: b.is_active === false ? 0 : 1,
  };
  if (!values.name) return fail(res, 422, 'Название обязательно');
  const info = db.prepare(`INSERT INTO products (${PRODUCT_FIELDS.join(',')}) VALUES (${PRODUCT_FIELDS.map(f => '@' + f).join(',')})`).run(values);
  ok(res, { id: Number(info.lastInsertRowid), ...values });
});

router.patch('/admin/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(id)) return fail(res, 404, 'Товар не найден');
  const patch = {};
  for (const f of PRODUCT_FIELDS) if (req.body?.[f] !== undefined) patch[f] = req.body[f] === '' ? null : req.body[f];
  if (!Object.keys(patch).length) return fail(res, 422, 'Нечего обновлять');
  db.prepare(`UPDATE products SET ${Object.keys(patch).map(k => k + '=@' + k).join(',')} WHERE id=@id`).run({ ...patch, id });
  ok(res, { id, updated: Object.keys(patch) });
});

router.delete('/admin/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(id)) return fail(res, 404, 'Товар не найден');
  db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(id);
  ok(res, { id, archived: true });
});

router.get('/admin/reviews', (_req, res) => ok(res, {
  items: db.prepare(`SELECT r.*, p.name AS product FROM reviews r LEFT JOIN products p ON p.id=r.product_id ORDER BY r.status='pending' DESC, r.id DESC LIMIT 200`).all(),
}));
router.patch('/admin/reviews/:id', (req, res) => {
  const status = req.body?.status === 'approved' ? 'approved' : 'pending';
  const info = db.prepare('UPDATE reviews SET status=? WHERE id=?').run(status, Number(req.params.id));
  if (!info.changes) return fail(res, 404, 'Отзыв не найден');
  ok(res, { id: Number(req.params.id), status });
});

router.get('/admin/subscribers', (_req, res) => ok(res, {
  items: db.prepare('SELECT id, email, promo, source, created_at FROM subscribers ORDER BY id DESC LIMIT 200').all(),
}));
router.post('/admin/password', (req, res) => {
  const { login, oldPassword, newPassword } = req.body || {};
  if (String(newPassword || '').length < 6) return fail(res, 422, 'Пароль минимум 6 символов');
  const admin = db.prepare('SELECT * FROM admins WHERE login=?').get(clean(login, 60));
  if (!admin || !verifyPass(String(oldPassword || ''), admin.salt, admin.pass_hash)) return fail(res, 401, 'Текущий пароль неверен');
  const { salt, hash } = hashPass(String(newPassword));
  db.prepare('UPDATE admins SET pass_hash=?, salt=? WHERE id=?').run(hash, salt, admin.id);
  ok(res, { updated: true });
});

export default router;
