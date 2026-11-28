// Смоук-тест демо-режима (статический роутер web/src/lib/static.js).
// Запуск: node scripts/test-static.mjs   (из корня репозитория)
// Проверяет, что витрина на GitHub Pages отвечает в том же REST-контракте, что и server/src/api.js.
import { readFileSync } from 'node:fs';

const snapshotUrl = new URL('../web/public/data/snapshot.json', import.meta.url);
const snapshot = readFileSync(snapshotUrl, 'utf8');

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = globalThis;
globalThis.fetch = async (url) => {
  const href = String(url);
  if (href.includes('data/snapshot.json')) {
    return new Response(snapshot, { headers: { 'content-type': 'application/json' } });
  }
  return new Response('{"error":"no backend in tests"}', { status: 404, headers: { 'content-type': 'application/json' } });
};

const { staticApi } = await import(new URL('../web/src/lib/static.js', import.meta.url).pathname);

let failed = 0;
const t = async (name, fn) => {
  try {
    console.log(`ok   ${name}: ${await fn()}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${name}: ${err.message}`);
  }
};
const code = async (fn) => {
  try { await fn(); return 'ожидали ошибку, получил ответ'; }
  catch (err) { return `отклонён ${err.status}: ${err.message}`; }
};

const products = await staticApi('/products');
const snap = JSON.parse(snapshot);
const nut = snap.products.find((p) => p.slug === 'fundoq-yadro');
const buyer = { name: 'Мария', phone: '+7 903 111-22-33', city: 'Москва', address: 'ул. Ленина, 12', delivery: 'courier', payment: 'card' };
const order = (customer, items, promocode) => staticApi('/orders', { method: 'POST', body: JSON.stringify({ customer, items, promocode }) });

await t('каталог', () => `${products.items.length} шт, первый «${products.items[0].name}», бесплатная доставка от ${products.config.freeDeliveryFrom} ₽`);
await t('фильтр + сортировка', async () => {
  const r = await staticApi('/products?category=nuts&sort=price-desc');
  return `category=nuts цены ${r.items.map((i) => i.price).join(', ')}`;
});
await t('поиск', async () => `нашёл ${(await staticApi('/products?q=фундук')).items.length} шт по запросу «фундук»`);
await t('товар по slug', async () => {
  const r = await staticApi('/products/fundoq-yadro');
  return `«${r.name}», отзывов ${r.reviews.length}, похожих ${r.similar.length}`;
});
await t('несуществующий товар', () => code(async () => { await staticApi('/products/net-takogo'); return 'ответ'; }));

const first = await order(buyer, [{ slug: 'fundoq-yadro', qty: 2 }], 'ОРЕХИЧ15');
await t('заказ с промокодом', () => `${first.orderNumber}: ${first.subtotal} − ${first.discount} + доставка ${first.deliveryFee} = ${first.total} (${first.status})`);
await t('промокод повторно', () => code(() => order(buyer, [{ slug: 'fundoq-yadro', qty: 1 }], 'ОРЕХИЧ15')));
await t('самовывоз без адреса', async () => {
  const o = await order({ ...buyer, delivery: 'pickup', address: '' }, [{ slug: 'med-kedrovyi', qty: 1 }]);
  return `доставка ${o.deliveryFee} ₽, итого ${o.total} ₽`;
});
await t('бесплатная доставка от 2500 ₽', async () => {
  const o = await order(buyer, [{ slug: 'fundoq-yadro', qty: 6 }]);
  return `корзина ${o.subtotal} ₽ → доставка ${o.deliveryFee} ₽`;
});
await t('телефон', () => code(() => order({ ...buyer, phone: '123' }, [{ slug: 'fundoq-yadro', qty: 1 }])));
await t('адрес', () => code(() => order({ ...buyer, address: 'кл' }, [{ slug: 'fundoq-yadro', qty: 1 }])));
await t('корзина пустая', () => code(() => order(buyer, [])));
await t('остатки на складе', () => `fundoq-yadro: ${nut.stock} → ${store.get('orekhich.static.stock') ? JSON.parse(store.get('orekhich.static.stock'))['fundoq-yadro'] : 'нет'}`);
await t('трекинг заказа', async () => {
  const r = await staticApi(`/orders/track/${first.orderNumber}`);
  return `${r.number} · ${r.status} · ${r.items.map((i) => `${i.name}×${i.qty}`).join(', ')} · ${r.timeline.map((e) => e.status).join('>')}`;
});
await t('трекинг чужого номера', () => code(async () => { await staticApi('/orders/track/OREH-00-0000'); return 'ответ'; }));
await t('подписка', async () => {
  const r = await staticApi('/subscribe', { method: 'POST', body: JSON.stringify({ email: 'new@buyer.ru' }) });
  return `${r.promo} на ${r.percent} % — ${r.message}`;
});
await t('подписка повторно', async () => {
  const r = await staticApi('/subscribe', { method: 'POST', body: JSON.stringify({ email: 'new@buyer.ru' }) });
  return `already=${r.already}, промокод тот же ${r.promo}`;
});
await t('подписка с кривым e-mail', () => code(async () => { await staticApi('/subscribe', { method: 'POST', body: JSON.stringify({ email: 'net-sobaki' }) }); return 'ответ'; }));
await t('отзыв', async () => {
  const r = await staticApi('/reviews', { method: 'POST', body: JSON.stringify({ author: 'Пётр', city: 'Тула', rating: 5, text: 'Фундук свежий, обжарка ровная, пакет с клапаном.', product_slug: 'fundoq-yadro' }) });
  return `id ${r.id}, статус ${r.status}`;
});
await t('отзыв короче 20 символов', () => code(async () => { await staticApi('/reviews', { method: 'POST', body: JSON.stringify({ author: 'Пётр', rating: 5, text: 'вкусно' }) }); return 'ответ'; }));
await t('несреализованный эндпоинт', () => code(async () => { await staticApi('/payload', { method: 'POST', body: '{}' }); return 'ответ'; }));

console.log(failed ? `\n${failed} провалов` : '\nдемо-режим: всё чисто');
process.exit(failed ? 1 : 0);
