// Тесты REST API лавки «Орехич». Запуск: npm test (node:test + нативный fetch).
// Каждый прогон поднимает отдельный HTTP-сервер на случайной порте и изолированную SQLite-базу в /tmp.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orekhich-test-'));
process.env.APP_SECRET = 'test-secret-key';
process.env.ADMIN_LOGIN = 'admin';
process.env.ADMIN_PASS = 'test-pass-123';

const { createApp } = await import('../src/app.js');
const app = createApp({ staticDir: path.join(process.env.DATA_DIR, 'no-dist') });
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;

after(() => server.close());

async function call(method, url, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const customer = (over = {}) => ({
  name: 'Виталий Котов', phone: '+7 900 123-45-67', city: 'Москва',
  address: 'Даниловская 8, кв. 12', delivery: 'courier', payment: 'card', ...over,
});

/* ---------------- витрина ---------------- */

test('health: сервис жив и витрина наполнена', async () => {
  const { status, data } = await call('GET', '/health');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.products, 12);
});

test('products: каталог, фильтр по категории, поиск и сортировка по цене', async () => {
  const all = await call('GET', '/products');
  assert.equal(all.data.items.length, 12);
  assert.equal(all.data.config.freeDeliveryFrom, 2500);

  const mixes = await call('GET', '/products?category=mixes');
  assert.equal(mixes.data.items.length, 2);
  assert.ok(mixes.data.items.every((p) => p.category === 'mixes'));

  const found = await call('GET', '/products?q=' + encodeURIComponent('кедр'));
  const slugs = found.data.items.map((p) => p.slug);
  assert.ok(slugs.includes('kedrovyi-oreh') && slugs.includes('med-kedrovyi'));

  const asc = await call('GET', '/products?sort=price-asc');
  const prices = asc.data.items.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
});

test('products: карточка товара с отзывами и похожими, 404 для несуществующего', async () => {
  const one = await call('GET', '/products/fundoq-yadro');
  assert.equal(one.status, 200);
  assert.equal(one.data.name, 'Фундук ядро');
  assert.equal(one.data.rating, 4.9);
  assert.ok(one.data.reviews.length >= 1);
  assert.ok(one.data.similar.length <= 3);

  const missing = await call('GET', '/products/net-takogo-tovara');
  assert.equal(missing.status, 404);
});

test('reviews: публичная лента и статистика', async () => {
  const { status, data } = await call('GET', '/reviews?limit=6');
  assert.equal(status, 200);
  assert.ok(data.items.length >= 5);
  assert.ok(data.stats.avg >= 4.5);
});

/* ---------------- заказы ---------------- */

test('orders: пустая корзина и невалидные данные отклоняются', async () => {
  const empty = await call('POST', '/orders', { items: [], customer: customer() });
  assert.equal(empty.status, 422);
  assert.match(empty.data.error, /корзина пуста/i);

  const badPhone = await call('POST', '/orders', { items: [{ slug: 'fundoq-yadro', qty: 1 }], customer: customer({ phone: 'abc' }) });
  assert.equal(badPhone.status, 422);
  assert.match(badPhone.data.error, /телефон/i);

  const noAddress = await call('POST', '/orders', { items: [{ slug: 'fundoq-yadro', qty: 1 }], customer: customer({ address: '' }) });
  assert.equal(noAddress.status, 422);
  assert.match(noAddress.data.error, /адрес/i);

  const overLimit = await call('POST', '/orders', { items: [{ slug: 'makadamiya', qty: 40 }], customer: customer() });
  assert.equal(overLimit.status, 422);
  assert.match(overLimit.data.error, /максимум 30/i);

  const drained = await call('POST', '/orders', { items: [{ slug: 'makadamiya', qty: 30 }], customer: customer({ delivery: 'pickup', address: '' }) });
  assert.equal(drained.status, 200);
  const lastOne = await call('POST', '/orders', { items: [{ slug: 'makadamiya', qty: 4 }], customer: customer() });
  assert.equal(lastOne.status, 422);
  assert.match(lastOne.data.error, /в наличии только 3/i);
});

test('orders: успех — счёт, доставка 350 ₽ и списание остатков', async () => {
  const before = (await call('GET', '/products/fundoq-yadro')).data.stock;
  const { status, data } = await call('POST', '/orders', { items: [{ slug: 'fundoq-yadro', qty: 2 }], customer: customer() });
  assert.equal(status, 200);
  assert.match(data.orderNumber, /^OREH-\d{2}-\d{4}$/);
  assert.equal(data.subtotal, 1780);
  assert.equal(data.discount, 0);
  assert.equal(data.deliveryFee, 350);
  assert.equal(data.total, 2130);

  const after_ = (await call('GET', '/products/fundoq-yadro')).data.stock;
  assert.equal(after_, before - 2);

  const track = await call('GET', `/orders/track/${data.orderNumber}`);
  assert.equal(track.status, 200);
  assert.equal(track.data.status, 'new');
  assert.ok(track.data.timeline.length >= 1);
  assert.equal(track.data.items[0].qty, 2);
});

test('orders: самовывоз без оплаты доставки', async () => {
  const { data } = await call('POST', '/orders', {
    items: [{ slug: 'arahis-vashek', qty: 1 }],
    customer: customer({ delivery: 'pickup', address: '' }),
  });
  assert.equal(data.deliveryFee, 0);
  assert.equal(data.total, 490);
});

test('orders: бесплатная доставка от 2500 ₽', async () => {
  const { data } = await call('POST', '/orders', { items: [{ slug: 'greckii-oreh', qty: 4 }], customer: customer() });
  assert.equal(data.subtotal, 2960);
  assert.equal(data.deliveryFee, 0);
  assert.equal(data.total, 2960);
});

test('promocode: подписка выдаёт персональный код, скидка 15 % и код гасится после заказа', async () => {
  const sub = await call('POST', '/subscribe', { email: 'pupkin@example.com' });
  assert.equal(sub.status, 200);
  assert.match(sub.data.promo, /^OREH-\d{6}$/);
  assert.equal(sub.data.percent, 15);

  const again = await call('POST', '/subscribe', { email: 'pupkin@example.com' });
  assert.equal(again.data.already, true);
  assert.equal(again.data.promo, sub.data.promo);

  const bad = await call('POST', '/subscribe', { email: 'ne-pochta' });
  assert.equal(bad.status, 422);

  const check = await call('POST', '/promocode/validate', { code: sub.data.promo.toLowerCase() });
  assert.equal(check.data.percent, 15);

  const order = await call('POST', '/orders', { items: [{ slug: 'fundoq-yadro', qty: 2 }], customer: customer(), promocode: sub.data.promo });
  assert.equal(order.data.discount, 267);
  assert.equal(order.data.total, 1780 - 267 + 350);

  const reuse = await call('POST', '/orders', { items: [{ slug: 'fundoq-yadro', qty: 1 }], customer: customer(), promocode: sub.data.promo });
  assert.equal(reuse.status, 422);

  const ghost = await call('POST', '/promocode/validate', { code: 'NET-TAKOGO-KODA' });
  assert.equal(ghost.status, 404);
});

test('promocode: общий код ОРЕХИЧ15 валиден, но не принимается дважды в одном заказе', async () => {
  const check = await call('POST', '/promocode/validate', { code: 'ОРЕХИЧ15' });
  assert.equal(check.status, 200);
  assert.equal(check.data.percent, 15);
});

test('orders: трекинг несуществующего заказа возвращает 404', async () => {
  const { status } = await call('GET', '/orders/track/OREH-26-0000');
  assert.equal(status, 404);
});

/* ---------------- админ ---------------- */

test('admin: доступ только по токену, логин с неверным паролем отклоняется', async () => {
  const anon = await call('GET', '/admin/stats');
  assert.equal(anon.status, 401);

  const wrong = await call('POST', '/admin/login', { login: 'admin', password: 'ouch' });
  assert.equal(wrong.status, 401);

  const ok = await call('POST', '/admin/login', { login: 'admin', password: 'test-pass-123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.data.token.length > 20);

  const stats = await call('GET', '/admin/stats', undefined, ok.data.token);
  assert.equal(stats.status, 200);
  assert.ok(stats.data.revenue > 0);
  assert.ok(stats.data.ordersTotal >= 3);
  assert.ok(Array.isArray(stats.data.topProducts));

  const forged = await call('GET', '/admin/stats', undefined, ok.data.token.slice(0, -4) + 'xxxx');
  assert.equal(forged.status, 401);

  return ok.data.token;
});

let adminToken = (await call('POST', '/admin/login', { login: 'admin', password: 'test-pass-123' })).data.token;

test('admin: CRUD товара — создание, правка цены, архив', async () => {
  const created = await call('POST', '/admin/products', {
    name: 'Фисташка', category: 'nuts', weight_g: 300, price: 1490, stock: 25, origin: 'Иран, Рафсанджан',
  }, adminToken);
  assert.equal(created.status, 200);
  const id = created.data.id;
  assert.equal(created.data.slug, 'фисташка');

  const publicList = await call('GET', '/products?q=' + encodeURIComponent('фисташка'));
  assert.equal(publicList.data.items.length, 1);

  const patched = await call('PATCH', `/admin/products/${id}`, { price: 1290, stock: 40 }, adminToken);
  assert.equal(patched.status, 200);
  const afterPrice = await call('GET', '/products/фисташка');
  assert.equal(afterPrice.data.price, 1290);

  const archived = await call('DELETE', `/admin/products/${id}`, undefined, adminToken);
  assert.equal(archived.data.archived, true);
  assert.equal((await call('GET', '/products/фисташка')).status, 404);

  const badCreate = await call('POST', '/admin/products', { name: '' }, adminToken);
  assert.equal(badCreate.status, 422);
});

test('admin: премодерация отзывов — новый отзыв появляется только после одобрения', async () => {
  const post = await call('POST', '/reviews', {
    author: 'Пётр', city: 'Тверь', rating: 5, product_slug: 'mindal',
    text: 'Миндаль кремовый, без горечи, для пралине подошёл идеально.',
  });
  assert.equal(post.status, 200);
  assert.equal(post.data.status, 'pending');

  const publicList = await call('GET', '/reviews?limit=50');
  assert.ok(!publicList.data.items.some((r) => r.author === 'Пётр'));

  const approved = await call('PATCH', `/admin/reviews/${post.data.id}`, { status: 'approved' }, adminToken);
  assert.equal(approved.data.status, 'approved');

  const publicAfter = await call('GET', '/reviews?limit=50');
  assert.ok(publicAfter.data.items.some((r) => r.author === 'Пётр'));
});

test('admin: смена статуса заказа пишет историю и фильтр по статусу', async () => {
  const order = await call('POST', '/orders', { items: [{ slug: 'mindal', qty: 1 }], customer: customer() });
  const list = await call('GET', '/admin/orders', undefined, adminToken);
  const target = list.data.items.find((o) => o.number === order.data.orderNumber);

  const moved = await call('PATCH', `/admin/orders/${target.id}`, { status: 'roast', note: 'Партия в барабане' }, adminToken);
  assert.equal(moved.data.status, 'roast');

  const track = await call('GET', `/orders/track/${order.data.orderNumber}`);
  assert.equal(track.data.status, 'roast');
  assert.ok(track.data.timeline.some((e) => e.status === 'roast'));

  const bad = await call('PATCH', `/admin/orders/${target.id}`, { status: 'teleport' }, adminToken);
  assert.equal(bad.status, 422);
});

test('admin: подписчики и отправка невалидного JSON не роняет сервис', async () => {
  const subs = await call('GET', '/admin/subscribers', undefined, adminToken);
  assert.ok(subs.data.items.some((s) => s.email === 'pupkin@example.com'));

  const res = await fetch(`${base}/orders`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{сломанный json' });
  assert.equal(res.status, 400);
});
