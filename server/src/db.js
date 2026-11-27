// Орехич — слой данных: SQLite (better-sqlite3), схема + сидинг
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'shop.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Поиск по-русски: SQLite LIKE не фолдит кириллицу, поэтому регистрируем свою нормализацию
export const fold = (value) => String(value ?? '').toLowerCase().replace(/ё/g, 'е').trim();
db.function('norm', { deterministic: true }, fold);

export const CONFIG = {
  freeDeliveryFrom: 2500,
  deliveryFee: 350,
  pickupFee: 0,
  firstOrderPromo: 'ОРЕХИЧ15',
  firstOrderPercent: 15,
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight_g INTEGER NOT NULL,
  price INTEGER NOT NULL,
  old_price INTEGER,
  badge TEXT,
  art TEXT NOT NULL,
  tone TEXT NOT NULL,
  accent TEXT NOT NULL,
  origin TEXT,
  short TEXT,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
  city TEXT NOT NULL, address TEXT NOT NULL,
  delivery TEXT NOT NULL, payment TEXT NOT NULL,
  promocode TEXT, comment TEXT,
  subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  name TEXT NOT NULL, price INTEGER NOT NULL, qty INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  author TEXT NOT NULL, city TEXT, rating INTEGER NOT NULL, text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL, promo TEXT, source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS promokodes (
  code TEXT PRIMARY KEY,
  percent INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'generic',
  is_active INTEGER NOT NULL DEFAULT 1, order_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL, pass_hash TEXT NOT NULL, salt TEXT NOT NULL,
  name TEXT, role TEXT NOT NULL DEFAULT 'manager',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;

export function hashPass(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 32).toString('hex') };
}
export function verifyPass(password, salt, hash) {
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

const PRODUCTS = [
  ['fundoq-yadro', 'Фундук ядро', 'nuts', 500, 890, 1090, 'Хит', 'hazelnut', '#EFE3D0', '#C1662F',
    'Краснодарский край, кубанский сад', 'Обжаренный, очищенный от плёнки',
    'Кубанский фундук собираем в сентябре, сушим в щадящей сушилке при 55 °C и обжариваем малыми партиями по 12 кг. Ядро снимает плёнку почти само — в пакете не остаётся мусора. Вкус: хлебный, с карамельным послевкусием.', 148, 4.9, 312],
  ['kedrovyi-oreh', 'Кедровый орех', 'nuts', 250, 1290, null, 'Коллекция', 'cedar', '#E7E3D3', '#56704B',
    'Алтай, таёжные угодья', 'Масличное ядро, ручной колки',
    'Маньчжурский кедр с алтайских отрогов. Ядро маслянистое, смолы почти нет — орех не горчит. Ручная колка: скорлупу снимаем ножом, чтобы не дробить ядро.', 86, 4.8, 204],
  ['pekan-polovinki', 'Пекан, половинки', 'nuts', 400, 1540, 1720, 'Новинка', 'pecan', '#EDE0CC', '#8A5A2B',
    'Техас, США', 'Сырой, крупные половинки',
    'Пекан называют «орехом пекан-пай» за маслянистую сладость. Половинки ровные, подходят для выпечки и сырной тарелки. Храним в вакууме при +4 °C.', 41, 4.9, 96],
  ['makadamiya', 'Макадамия', 'nuts', 300, 1890, null, 'Premium', 'macadamia', '#F0E7D6', '#E3A93C',
    'Квинсленд, Австралия', 'Вакуум, первый сорт',
    'Самый жирный орех в лавке: 76 % масла. Орех раскрываем специальным ножом — скорлупа у макадамии толстая, поэтому режем сразу по линии шва. Тает во рту.', 33, 5.0, 78],
  ['greckii-oreh', 'Грецкий орех', 'nuts', 700, 740, 920, 'Выгодно', 'walnut', '#E9DCC6', '#A9743F',
    'Узбекистан, Фергана', 'Колотый, сорт «масляный»',
    'Ферганский масляный грецкий: ядро светлое, перегородки не горчат. Колем механически и просеиваем — осколков и скорлупы в пачке минимум.', 210, 4.7, 418],
  ['miks-energiya', 'Микс «Энергия»', 'mixes', 600, 1190, null, 'Микс недели', 'mix', '#E6E6D2', '#6F7F4E',
    'Сборка лавки', '6 видов, обжарка в день отправки',
    'Фундук, миндаль, кешью, пекан, грецкий и арахис в пропорции, которую мы вывели под утреннюю кашу и офисную вазу. Обжариваем утром в пятницу, вечером — в доставке.', 64, 4.9, 231],
  ['miks-sport', 'Микс «Спорт»', 'mixes', 500, 1090, 1240, 'Опт', 'mix', '#E4E8DA', '#4E6B4F',
    'Сборка лавки', 'Без соли, крупный помол',
    'Миндаль, арахис, кешью, тыквенное семя и сушёная клюква. 24 г белка на 100 г — берём в туры и на тренировки.', 92, 4.8, 147],
  ['mindal', 'Миндаль', 'nuts', 500, 990, null, null, 'almond', '#F1E4D4', '#B98A4E',
    'Калифорния, Центральная долина', 'Бланшированный, первый сбор',
    'Снимаем кожицу паром перед сушкой — миндаль остаётся кремовым и не горчит при обжарке. Идеален для пралине и молока.', 175, 4.8, 288],
  ['keshyu', 'Кешью', 'nuts', 400, 1340, 1490, null, 'cashew', '#F2EAD8', '#C9A05A',
    'Вьетнам, Ба Риа – Вунгтау', 'Первый отбор, W240',
    'Кешью W240 — целые ядра без обломов. Обжариваем сухим способом, без масла: орех остаётся матовым и не солёным.', 118, 4.9, 176],
  ['arahis-vashek', 'Арахис в шелухе', 'nuts', 700, 490, null, null, 'peanut', '#EDE2C8', '#B07A3C',
    'Краснодарский край', 'Сырой, в сетке',
    'Краснодарский арахис в сетке — для домашней обжарки и арахисовой пасты. moisture 8 %, не плесневелый, проверяем каждую партию.', 260, 4.6, 134],
  ['med-kedrovyi', 'Кедровый мёд', 'honey', 500, 1150, null, 'Пасека', 'honey', '#F3E3C0', '#D69A2C',
    'Алтай, Улаганский район', 'Тёмный, жидкий, 2025',
    'С качалок в кедровой тайге, июльское взятие. Тёмный, с хвойной ноткой и долгой сладостью. Не откачиваем перегретым — 34 °C максимум.', 57, 5.0, 89],
  ['chernosliv-vyalenyy', 'Чернослив вяленый', 'dried', 600, 690, 790, null, 'dried', '#EADFD0', '#7A4A2E',
    'Иран, Урмия', 'Без сахара и глицерина',
    'Вялим сами: 40 дней при 45 °C, без сахара и масла для блеска. Косточка удаляется вручную.', 129, 4.7, 162],
];

const REVIEWS = [
  ['fundoq-yadro', 'Марина К.', 'Москва', 5, 'Фундук как из детства: пахнет хлебом и солнцем. Обжарка ровно в меру, ничего не пережжено. Взяла вторую пачку сразу.', 'approved'],
  ['miks-energiya', 'Артём Д.', 'Казань', 5, 'Беру микс в офис на команду — разбирают за один день. Дата обжарки на пачке, это подкупает.', 'approved'],
  ['kedrovyi-oreh', 'Ольга В.', 'Санкт-Петербург', 5, 'Кедровый орех чистый, без пустых ядер. Доставка за день, упаковка как новогодний подарок.', 'approved'],
  ['greckii-oreh', 'Ильдар С.', 'Уфа', 4, 'Грецкий почти без осколков, но половинки мелкие. Вкус хороший, не горчит.', 'approved'],
  ['makadamiya', 'Екатерина Л.', 'Екатеринбург', 5, 'Макадамия тает во рту, вакуум открытый — всё хрустит. Дорого, но за 300 г норм.', 'approved'],
  ['med-kedrovyi', 'Сергей П.', 'Новосибирск', 5, 'Мёд настоящий, засахарился к январю как и должен. Значит не палили.', 'approved'],
];

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (count > 0) return false;
  const insProduct = db.prepare(`INSERT INTO products
    (slug,name,category,weight_g,price,old_price,badge,art,tone,accent,origin,short,description,stock,rating,reviews_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insReview = db.prepare(`INSERT INTO reviews (product_id,author,city,rating,text,status) VALUES (?,?,?,?,?,?)`);
  const tx = db.transaction(() => {
    for (const p of PRODUCTS) insProduct.run(...p);
    db.prepare('INSERT OR IGNORE INTO promokodes (code, percent, kind) VALUES (?,?,?)')
      .run(CONFIG.firstOrderPromo, CONFIG.firstOrderPercent, 'first_order');
    const bySlug = {};
    for (const r of db.prepare('SELECT id, slug FROM products').all()) bySlug[r.slug] = r.id;
    for (const [slug, author, city, rating, text, status] of REVIEWS) insReview.run(bySlug[slug], author, city, rating, text, status);
    const adminPass = process.env.ADMIN_PASS || 'oreh1ch-admin';
    const { salt, hash } = hashPass(adminPass);
    db.prepare('INSERT OR IGNORE INTO admins (login, pass_hash, salt, name, role) VALUES (?,?,?,?,?)')
      .run(process.env.ADMIN_LOGIN || 'admin', hash, salt, 'Виталий', 'owner');
  });
  tx();
  return true;
}

db.exec(SCHEMA);
const seeded = seed();
if (process.argv.includes('--reseed')) {
  db.exec('DELETE FROM order_items; DELETE FROM order_events; DELETE FROM orders; DELETE FROM reviews; DELETE FROM subscribers; DELETE FROM promokodes; DELETE FROM products; DELETE FROM admins;');
  seed();
  console.log('reseeded');
}

export function secretKey() {
  const file = path.join(DATA_DIR, 'secret.key');
  if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  return fs.readFileSync(file, 'utf8').trim();
}

console.log(`sqlite: ${DB_PATH} ${seeded ? '(seeded ' + PRODUCTS.length + ' товаров, ' + REVIEWS.length + ' отзывов)' : '(existing db)'}`);
