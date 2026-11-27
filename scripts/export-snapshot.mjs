// Экспорт витрины в статику: снимок SQLite → web/public/data/snapshot.json
// Нужен для публичной публикации на GitHub Pages (там нет бэкенда, только файлы).
// Запуск: cd server && node ../scripts/export-snapshot.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, CONFIG } from '../server/src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'web', 'public', 'data', 'snapshot.json');

const DELIVERY = {
  courier: { label: 'Курьер по Москве в день обжарки', fee: 350 },
  cdek: { label: 'СДЭК по России', fee: 350 },
  post: { label: 'Почта России', fee: 300 },
  pickup: { label: 'Самовывоз: Даниловский рынок, пав. 4', fee: 0 },
};

const products = db
  .prepare('SELECT * FROM products WHERE is_active=1 ORDER BY rating DESC, reviews_count DESC')
  .all();

const reviews = db
  .prepare(`SELECT r.author, r.city, r.rating, r.text, r.created_at, p.slug AS product_slug, p.name AS product
    FROM reviews r LEFT JOIN products p ON p.id=r.product_id
    WHERE r.status='approved' ORDER BY r.rating DESC, r.id DESC`)
  .all();

const stats = db.prepare(`SELECT COUNT(*) total, ROUND(AVG(rating),2) avg FROM reviews WHERE status='approved'`).get();

// Только публичные промокоды: персональные коды подписчиков (и их e-mail) в статику не попадают.
const promokodes = db
  .prepare("SELECT code, percent, kind FROM promokodes WHERE kind IN ('generic','first_order') AND is_active=1 AND order_id IS NULL")
  .all();

const snapshot = {
  meta: {
    service: 'orekhich-static',
    exportedAt: new Date().toISOString(),
    note: 'Снимок витрины для статичного (демо) режима: заказы и отзывы обрабатываются локально в браузере.',
  },
  config: CONFIG,
  delivery: DELIVERY,
  products,
  reviews: { items: reviews, stats },
  promokodes,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
console.log(`snapshot: ${OUT} · товаров ${products.length} · отзывов ${reviews.length} · промокодов ${promokodes.length}`);
