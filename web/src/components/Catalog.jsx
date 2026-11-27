// Каталог: чипы категорий, поиск с debounce, сортировка, диапазон цены, skeleton, пустое состояние и ошибка.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCategories, getProducts } from '../lib/api.js';
import { useDebounced } from '../lib/ui.js';
import { DEFAULT_CONFIG, useCart } from '../lib/cart.js';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import { IconAlert, IconArrowRight, IconChevronDown, IconClose, IconSearch } from './Icons.jsx';
import { formatNumber, formatPrice, productsWord } from '../lib/format.js';

const SORTS = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'new', label: 'Новинки недели' },
];

function SkeletonCard() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="skeleton h-[170px] rounded-tile" />
      <div className="skeleton mt-4 h-4 w-3/5" />
      <div className="skeleton mt-2.5 h-3 w-4/5" />
      <div className="skeleton mt-4 h-5 w-24" />
      <div className="skeleton mt-4 h-11 w-full rounded-pill" />
    </div>
  );
}

export default function Catalog({ onConfig }) {
  const cart = useCart();
  const searchRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [rawQuery, setRawQuery] = useState('');
  const [sort, setSort] = useState('popular');
  const [rawMin, setRawMin] = useState('');
  const [rawMax, setRawMax] = useState('');
  const [state, setState] = useState({ loading: true, error: '', items: [], total: 0 });
  const [selected, setSelected] = useState('');
  const [reload, setReload] = useState(0);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const query = useDebounced(rawQuery, 300);
  const minPrice = useDebounced(rawMin.replace(/\D/g, ''), 400);
  const maxPrice = useDebounced(rawMax.replace(/\D/g, ''), 400);

  const filtersActive = category !== 'all' || Boolean(query) || Boolean(minPrice) || Boolean(maxPrice);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then((items) => setCategories(items))
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    getProducts(
      {
        category,
        q: query,
        sort,
        min: minPrice,
        max: maxPrice,
      },
      controller.signal,
    )
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        setState({ loading: false, error: '', items, total: Number(data.total) || items.length });
        if (data.config) {
          setConfig((prev) => ({ ...prev, ...data.config }));
          if (onConfig) onConfig({ ...DEFAULT_CONFIG, ...data.config });
        }
        cart.refresh(items);
      })
      .catch((error) => {
        if (error.message === 'Запрос отменён') return;
        setState({ loading: false, error: error.message, items: [], total: 0 });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, minPrice, maxPrice, reload]);

  const knownTotal = useMemo(() => categories.reduce((sum, item) => sum + (item.count || 0), 0), [categories]);
  const catalogSize = Math.max(knownTotal, state.total);
  const others = Math.max(0, catalogSize - state.total);

  const resetFilters = useCallback(() => {
    setCategory('all');
    setRawQuery('');
    setRawMin('');
    setRawMax('');
    setSort('popular');
    if (searchRef.current) searchRef.current.focus();
  }, []);

  return (
    <section id="catalog" className="section">
      <div className="wrap">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[600px]">
            <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-caramel">витрина</span>
            <h2 className="mt-3 font-display text-h2 font-bold">Каталог лавки</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-[16px]">
              Двенадцать позиций: орехи, миксы, мёд с алтайской пасеки и сухофрукты. Всё обжарено на этой неделе,
              вес указан уже без скорлупы.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="group inline-flex items-center gap-2 self-start text-[14px] font-bold text-ink transition hover:text-caramel md:self-auto"
          >
            Весь каталог
            <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-y border-hairline py-5">
          <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Фильтр по категориям">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`chip ${category === 'all' ? 'chip-active' : ''}`}
              aria-pressed={category === 'all'}
            >
              Все
              <span className="text-[12px] font-bold opacity-60">{catalogSize || ''}</span>
            </button>
            {categories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={`chip ${category === item.slug ? 'chip-active' : ''}`}
                aria-pressed={category === item.slug}
              >
                {item.name}
                <span className="text-[12px] font-bold opacity-60">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
              <label htmlFor="catalog-search" className="sr-only">
                Поиск по названию, описанию и региону
              </label>
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
              <input
                id="catalog-search"
                ref={searchRef}
                type="search"
                value={rawQuery}
                onChange={(event) => setRawQuery(event.target.value)}
                placeholder="фундук, микс, Алтай…"
                className="field pl-11 pr-10"
              />
              {rawQuery ? (
                <button
                  type="button"
                  onClick={() => setRawQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="relative">
              <label htmlFor="catalog-sort" className="sr-only">
                Сортировка
              </label>
              <select id="catalog-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="field w-[210px] pr-11">
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-[110px]">
                <label htmlFor="catalog-min" className="sr-only">
                  Цена от
                </label>
                <input
                  id="catalog-min"
                  type="text"
                  inputMode="numeric"
                  value={rawMin}
                  onChange={(event) => setRawMin(event.target.value.replace(/\D/g, ''))}
                  placeholder="от"
                  className="field pr-7 text-right"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-faint">₽</span>
              </div>
              <span className="text-[13px] text-faint">—</span>
              <div className="relative w-[110px]">
                <label htmlFor="catalog-max" className="sr-only">
                  Цена до
                </label>
                <input
                  id="catalog-max"
                  type="text"
                  inputMode="numeric"
                  value={rawMax}
                  onChange={(event) => setRawMax(event.target.value.replace(/\D/g, ''))}
                  placeholder="до"
                  className="field pr-7 text-right"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-faint">₽</span>
              </div>
            </div>

            <p className="ml-auto text-[13px] font-semibold text-muted">
              {state.loading ? 'Загружаем…' : `${formatNumber(state.total)} ${productsWord(state.total)}`}
              {filtersActive && !state.loading ? ` из ${catalogSize}` : ''}
            </p>
          </div>
        </div>

        {state.loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {!state.loading && state.error ? (
          <div className="card mt-8 flex flex-wrap items-center gap-4 border-caramel/30 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-caramel/10 text-caramel" aria-hidden="true">
              <IconAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[19px] font-bold">Каталог не загрузился</p>
              <p className="mt-1 text-[14px] text-muted">{state.error}</p>
            </div>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="btn btn-primary ml-auto"
              aria-label="Повторить загрузку каталога"
            >
              Попробовать снова
            </button>
          </div>
        ) : null}

        {!state.loading && !state.error && state.items.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-band text-muted" aria-hidden="true">
              <IconSearch className="h-6 w-6" />
            </span>
            <p className="mt-5 font-display text-[21px] font-bold">Ничего не нашлось</p>
            <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-muted">
              В лавке {catalogSize} {productsWord(catalogSize)}, но под фильтры не подошла ни одна пачка.
              Сбросьте фильтры — покажем весь каталог.
            </p>
            <button type="button" onClick={resetFilters} className="btn btn-primary mt-6" aria-label="Сбросить фильтры каталога">
              Сбросить фильтры
            </button>
          </div>
        ) : null}

        {!state.loading && !state.error && state.items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {state.items.map((product) => (
              <ProductCard key={product.slug} product={product} onOpen={setSelected} />
            ))}
          </div>
        ) : null}

        {!state.loading && !state.error && state.items.length > 0 && others > 0 ? (
          <p className="mt-8 flex flex-wrap items-center gap-2 border-t border-hairline pt-5 text-[14px] text-muted">
            и ещё {formatNumber(others)} {productsWord(others)} в других категориях
            <button type="button" onClick={resetFilters} className="link-quiet !text-caramel">
              показать весь каталог
            </button>
          </p>
        ) : null}

        {!state.loading && !state.error && state.items.length > 0 && others === 0 ? (
          <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline pt-5 text-[14px] text-muted">
            Показаны все {formatNumber(catalogSize)} {productsWord(catalogSize)} лавки.
            <span className="text-faint">
              ближайшая обжарка: пятница · бесплатная доставка от {formatPrice((config && config.freeDeliveryFrom) || 2500)}
            </span>
          </p>
        ) : null}
      </div>

      <ProductModal slug={selected} onClose={() => setSelected('')} onOpen={setSelected} />
    </section>
  );
}
