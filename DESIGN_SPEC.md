# «Орехич» — спека фронтенда (реализация макета Figma)

Макет: Figma-файл `4KGtbw0Izwm1HllfoZ9DLW`, фреймы `28:256` (Desktop 1440, все секции) и `28:436` (Mobile 390, hero).
Токены уже перенесены в `web/tailwind.config.js`, шрифты подключены в `web/index.html`. **Не менять** `index.html`, `tailwind.config.js`, `postcss.config.js`, `vite.config.js`, `package.json`, `server/**`.

## Стек
Vite 5 + React 18 + Tailwind 3.4, чистый JS/JSX (без TypeScript), **новые npm-зависимости запрещены** (только react, react-dom, уже установлены). Никаких внешних картинок и CDN — иллюстрации товаров рисуются средствами CSS/SVG.

## Дизайн-токены (см. tailwind.config.js)
- Фон `cream #FAF5EB`, лента `band #F3EBDC`, карточка `card #FFFDF7`, рамка `hairline #E0D4C0`.
- Текст `ink #241A12`, вторичный `muted #7A6A5A`, старый/приглушённый `faint #AD9C8A`, на тёмном `creamtext #C8B9A6` / `darktext #FAF5EB`, тёмная карточка `ink2 #33261B`.
- Акценты: `caramel #C1662F` (главная кнопка), `olive #56704B`, `gold #E3A93C` (звёзды), `mixolive #6F7F4E`.
- Шрифты: заголовки `font-display` (Literata, 700), текст `font-sans` (Manrope).
- Типографика: h1 `text-h1` (до 62px, lh 1.04, ls −0.02em), h2 `text-h2` (до 40px), заголовок карточки 19/700, тело 15–18, мета 12–13.
- Радиусы: карточка 20px, кнопка pill, арт-тайл 14px, большие панели 32px. Тени: `shadow-card`, `shadow-lift`.
- Горизотступы: `max-w-wrap mx-auto px-6 md:px-10 lg:px-20` (80px на десктопе).

## Структура страницы (порядок и высота как в макете)
1. **Header** (h 96px, sticky, фон cream/blur, нижняя граница hairline): слева лого-тайл 40px `caramel` с буквой «О» + «Орехич»; центр — навигация «Каталог / Обжарка / Отзывы / Доставка»; справа телефон `+7 977 512-08-40` и кнопка-корзина с счётчиком.
2. **Hero** (2 колонки, верхняя отсечка 620px): слева бейдж-пилюля «Свежая обжарка по пятницам» (`bg-caramel/10 text-caramel`), h1 «Орехи, которые<br>обжаривают в пятницу<br>и отправляют сухими», подзаголовок 18px muted, две кнопки (primary `bg-caramel text-white`, ghost `border-ink/20 text-ink`), ниже 3 метрики в ряд: «4.9 ★ · 1 652 отзыва», «12 кг в партии», «24–72 ч доставка». Справа — панель-арт `bg band`, внутри большой круг `caramel` + 2 плавающие карточки: «Фундук ядро · 890 ₽» и «Обжарка: 150 °C · 11 мин».
3. **Benefits** (лента `bg-band`, 4 колонки, h 200px): номер «01…04» (13px, `caramel`), тайтл 17/700, текст 14/muted: «Обжарка малыми партиями», «Дата обжарки на пачке», «Отгрузка в день заказа», «Возврат, если не понравится».
4. **Catalog**: h2 «Каталог лавки» + подзаголовок, справа ссылка «Весь каталог →». Чипы фильтров по категориям (пилюли, активный — `bg-ink text-cream`), поиск и сортировка. Сетка 4×1 на десктопе (карточка 305×430): арт-тайл 265×170 с кругом 110px, бейдж, название, мета «регион · вес», цена 21/700 + старая цена/остаток, рейтинг «★ 4.9 · 312 отзыва», кнопка «В корзину · 890 ₽». Ниже — строка «и ещё 8 позиций в каталоге…».
5. **Roast Process** (тёмная секция `bg-ink`, h 440px): h2 `darktext` «Как устроена обжарка», подзаголовок `creamtext`, 4 карточки `bg-ink2` r18: номер `gold`, заголовок `darktext`, текст `creamtext`.
6. **Reviews** (h 460px): h2 «Отзывы лавки», справа «4.9 из 5 · 1 652 отзыва», 3 карточки `bg-card border-hairline` r18: звёзды `gold`, текст отзыва 14, автор 12/600 muted.
7. **Subscribe CTA** (тёмная панель 1280×220 r24): h2 «−15 % на первый заказ», подпись `creamtext`, инпут (белая пилюля) + кнопка `bg-caramel` «Получить скидку». После успешной подписки показать выданный промокод.
8. **Footer** (тёмный, h 324px): лого + «Орехич», описание, телефон/почта, адрес «Даниловский рынок, пав. 4», 3 колонки ссылок, строка «© 2026 Орехич · ИП Котов А. С. · ОГРН 321774600123456» + «Политика конфиденциальности».

Адаптив: ≤1024 — 2 колонки в каталоге, hero в одну колонку; ≤768 — 1 колонка, sticky-панель «В корзину»; ≤390 как фрейм `28:436` (h1 34px, кнопки на всю ширину).

## Иллюстрации товаров (без фото)
Для каждого товара рисовать «орех» из его полей `tone` (фон тайла) и `accent` (цвет ядра) — инлайн-стили из API, например:
```jsx
<div style={{ background: p.tone }} className="h-[170px] rounded-tile relative">
  <svg viewBox="0 0 120 120" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px]">…</svg>
</div>
```
Набор форм по ключу `p.art`: `hazelnut`, `cedar`, `pecan`, `macadamia`, `walnut`, `mix`, `almond`, `cashew`, `peanut`, `honey`, `prune`. Реализовать 2–3 варианта формы (круглое ядро, капля, вытянутый овал) + вариант «микс» из 5 мелких ядер и «мёд» (банка). Формы — простые SVG-фигуры с `fill={p.accent}` и бликом `white/25`.

## API-контракт (бэкенд уже работает, base `/api`)
- `GET /api/health` → `{ok, service, products, time}`
- `GET /api/categories` → `{items:[{slug,name,count}]}`
- `GET /api/products?category=&q=&sort=popular|price-asc|price-desc|new|rating&min=&max=` → `{items:[Product], total, config:{freeDeliveryFrom:2500,deliveryFee:350,pickupFee:0,firstOrderPromo:'ОРЕХИЧ15',firstOrderPercent:15}}`
- `GET /api/products/:slug` → `Product & {reviews:[{author,city,rating,text,created_at}], similar:[Product]}`
- `GET /api/reviews?limit=` → `{items, stats:{avg,count}` }
- `POST /api/reviews` `{author,city,rating,product_slug,text}` → `{id,status:'pending'}`
- `POST /api/orders` `{items:[{slug,qty}], customer:{name,phone,city,address,delivery:'courier|cdek|post|pickup',payment:'card|cash|sbp',email?,comment?}, promocode?}` → `{orderNumber, subtotal, discount, deliveryFee, total, status:'new'}`
  - `pickup` ⇒ `deliveryFee 0`, адрес не нужен; ошибка ⇒ HTTP 422 `{error:"текст"}` (тот же формат у 401/404/400)
- `POST /api/promocode/validate` `{code}` → `{code,percent}` | 404
- `GET /api/orders/track/:number` → `{number,status,timeline:[{status,note,created_at}],items,total}`
- `POST /api/subscribe` `{email}` → `{promo:'OREH-123456',percent:15,already?:true}`
- Product: `{id,slug,name,category,weight_g,price,old_price,badge,art,tone,accent,origin,short,description,stock,rating,reviews_count}`

## Функциональность
- **Корзина**: состояние в React + `localStorage['orekhich.cart']` (массив `{slug,qty}`), счётчик в шапке, drawer справа (оверлей, Esc, блокировка скролла), +/− количества, удаление, подытог, плашка «до бесплатной доставки X ₽» (считать от `config.freeDeliveryFrom`), кнопка «Оформить».
- **Checkout** (модалка, 2 шага): форма получателя (валидация как на бэкенде, показывать `error` из ответа), выбор способа доставки с ценой, оплата, промокод (проверка через `/promocode/validate`, чип со скидкой), предпросмотр суммы; после успеха — экран с номером заказа и кнопкой «Отследить».
- **Трекинг**: виджет «Статус заказа» (input номера → `/orders/track/:number` → таймлайн new → paid → roast → packed → shipped → delivered).
- **Каталог**: чипы категорий, поиск (debounce 300 мс, `q=`), сортировка (select), диапазон цены (`min`/`max`), skeleton-загрузка, пустое состояние «Ничего не нашлось» + кнопка сброса, счётчик «N позиций».
- **Карточка товара**: модалка с описанием, характеристиками (вес, регион, остаток), списком отзывов и блоком похожих товаров.
- **Подписка**: inline-валидация e-mail, показ выданного промокода с копированием в буфер.
- **Отзыв**: форма «Оставить отзыв» (рейтинг звёздами) → после отправки уведомление «отзыв на премодерации».
- **Тосты** об ошибках/успехе (свой компонент, 4 сек), `aria-label` на всех кнопках-иконках, `label` у полей, `:focus-visible` обводка `caramel`, уважать `prefers-reduced-motion`.
- Все запросы — через обёртку `api()` в `src/lib/api.js` (возвращает данные, бросает `Error(message)` из `{error}`).

## Файлы (создать в `web/src`)
`main.jsx`, `App.jsx`, `index.css` (@tailwind base/components/utilities + базовые стили), `lib/api.js`, `lib/cart.js` (context+reducer), `lib/format.js` (цена `Intl.NumberFormat('ru-RU')`, даты), `components/`: `Header.jsx`, `Hero.jsx`, `Benefits.jsx`, `Catalog.jsx`, `ProductCard.jsx`, `ProductModal.jsx`, `NutArt.jsx`, `Process.jsx`, `Reviews.jsx`, `ReviewsForm.jsx`, `Subscribe.jsx`, `Footer.jsx`, `CartDrawer.jsx`, `Checkout.jsx`, `TrackOrder.jsx`, `Toasts.jsx`, `Icons.jsx`.
Размер бандла после сборки: JS ≲ 250 kB gzip, CSS ≲ 40 kB; без предупреждений Vite.

## Что проверить перед сдачей
1. `cd web && npm run build` — exit code 0, есть `dist/index.html` + assets.
2. `npm run dev` не обязателен; при желании — curl-проверка собранного `dist`.
3. Отчёт: список созданных файлов, размер бандла, что реализовано, чего не сделано.
