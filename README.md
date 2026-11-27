# Орехич — лавка орехов и мёда

Крафтовая обжарочная лавка: витрина нарисована в Figma, фронтенд собран по макету, бэкенд на Express + SQLite с тестами.

**Публичный сайт (GitHub Pages): <https://kechermist.github.io/orekhich/>**

Сайт открыт с любого устройства. Pages раздаёт только статические файлы, поэтому витрина работает в двух режимах:

| Режим | Когда | Что происходит |
|---|---|---|
| `live` | запущен Express-бэкенд (`/api` отвечает) | обычные запросы к API, заказы попадают в SQLite |
| `static` | GitHub Pages (бэкенда нет) | каталог читается из снимка `data/snapshot.json`, заказ/отзыв/подписка обрабатываются в браузере (localStorage), номер заказа и трекинг работают локально |

Режим выбирается сам: при загрузке страницы проверяется `GET /api/health` (витрина в `web/src/lib/api.js`, демо-логика в `web/src/lib/static.js`). Ответы и текст ошибок совпадают с REST-контрактом бэкенда.

## Архитектура
```
nuts-shop/
├── .github/workflows/deploy.yml   сборка и публикация на GitHub Pages
├── DESIGN_SPEC.md                 спека фронтенда: токены из макета, структура, API-контракт
├── scripts/
│   ├── deploy.sh                  детач-запуск полного стека на сервере
│   ├── export-snapshot.mjs        снимок SQLite → web/public/data/snapshot.json (для статики)
│   └── serve-static.mjs           локальный предпросмотр статичной сборки на :8091
├── server/                        Express 4 + better-sqlite3 (ESM)
│   ├── src/db.js                  схема, сид 12 товаров, промокоды, админ, norm() для поиска по-русски
│   ├── src/api.js                 REST: витрина, заказы, промокоды, отзывы, подписки, админ
│   ├── src/app.js                 сборка приложения (используется и продом, и тестами)
│   ├── src/index.js               HTTP-сервер (PORT=8090, HOST=0.0.0.0, отдаёт web/dist)
│   ├── test/api.test.mjs          16 интеграционных тестов (node:test + fetch, изолированная БД в /tmp)
│   └── data/                      shop.db (WAL) — не попадает в git
└── web/                           Vite 5 + React 18 + Tailwind 3.4 (JSX)
    ├── index.html                 Literata + Manrope, favicon-орех
    ├── tailwind.config.js         токены, снятые с макета Figma
    ├── public/data/snapshot.json  снимок каталога для демо-режима
    └── src/                       App, Header, Hero, Benefits, Catalog, ProductCard, ProductModal,
                                   NutArt (SVG-иллюстрации), Process, Reviews, ReviewsForm,
                                   Subscribe, Footer, CartDrawer, Checkout, TrackOrder, Toasts, lib/*
```

## Публикация на GitHub Pages
Workflow `deploy.yml` собирается на push в `main`: `npm ci` в `web/` → `npm run build` с
`VITE_BASE=/<repo>/` → `upload-pages-artifact` → `deploy-pages`. В репозитории один раз включается
`Settings → Pages → Source: GitHub Actions`.

Снимок каталога — обычный закоммиченный файл, обновляется локально:
```bash
cd server && node ../scripts/export-snapshot.mjs
```
Персональные промокоды и e-mail подписчиков в снимок не пишутся, только публичные промокоды.

## Запуск полного стека локально
```bash
cd server && npm install && npm run seed     # пересоздать демо-данные
cd ../web  && npm install && npm run build   # сборка статики в web/dist
cd ../server && PORT=8090 node src/index.js  # один процесс: API + статика → http://127.0.0.1:8090
```
Предпросмотр именно Pages-сборки (без API, с демо-режимом):
```bash
cd web && VITE_BASE=/orekhich/ npm run build && node ../scripts/serve-static.mjs 8091
# → http://127.0.0.1:8091/orekhich/
```

## Шрифты и кэш
Шрифты раздаются локально, без внешних CDN: `web/public/fonts/*.woff2` + сгенерированный
`web/src/fonts.css` с `unicode-range`. Восстановить: `cd web && node scripts/selfhost-fonts.mjs /tmp/fonts`
(источник — распакованные @fontsource/literata и @fontsource/manrope). Показательный факт:
у Fraunces нет кириллического поднабора, поэтому display-шрифт — Literata.
Локальный прод отдаёт `index.html` с `Cache-Control: no-cache`, хешированные бандлы `/assets/*` — 30 дней
`immutable`. На Pages кэш индексной страницы не гарантирован: после публикации проверяйте сайт с `?v=N`.

## Тесты
```bash
cd server && npm test
```
16 тестов: health, фильтры/поиск/сортировка, карточка товара и 404, лента отзывов, валидация заказа
(пустая корзина, телефон, адрес, лимит 30 пачек, исчерпанный остаток), успех заказа с доставкой 350 ₽
и списанием остатков, самовывоз без оплаты, бесплатная доставка от 2500 ₽, персональный промокод со
скидкой 15 % и его гашение, трекинг и 404, админ: токен/подделка токена, CRUD товара, премодерация
отзывов, смена статуса заказа с историей, битый JSON → 400.

## API (кратко)
`GET /api/health` · `GET /api/categories` · `GET /api/products?category&q&sort&min&max` ·
`GET /api/products/:slug` · `GET /api/reviews` · `POST /api/reviews` (премодерация) ·
`POST /api/orders` · `GET /api/orders/track/:number` · `POST /api/promocode/validate` ·
`POST /api/subscribe` (выдаёт промокод) · `POST /api/admin/login` ·
`GET /api/admin/stats|orders|products|reviews|subscribers` · `PATCH /api/admin/orders/:id` ·
`PATCH /api/admin/reviews/:id` · `POST|PATCH|DELETE /api/admin/products*`.
Ошибки всегда `{ "error": "текст" }` со статусом 400/401/404/413/422/500.
Демо-режим на Pages повторяет эти маршруты и ответы, админ-маршруты там недоступны.

## Конфигурация
`PORT` (8090), `HOST` (0.0.0.0), `STATIC_DIR` (по умолчанию `../web/dist`), `DATA_DIR` (`./data`),
`APP_SECRET` (иначе `data/secret.key`), `ADMIN_LOGIN`/`ADMIN_PASS` (при первом сиде).
`VITE_BASE` — базовый путь при сборке под Pages.

Секреты в репозиторий не коммитятся: `server/data/secret.key`, `*.db*`, `app.log`, `.env*` в `.gitignore`.

## Админ-панель
Отдельной страницы нет: API под bearer-токеном из `POST /api/admin/login`. Токен — HMAC-подписанная
сессия сроком 12 часов, пароли — scrypt с солью. Работает только при запущенном бэкенде.
