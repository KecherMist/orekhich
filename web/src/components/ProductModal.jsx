import { useEffect, useRef, useState } from 'react';
import { getProduct } from '../lib/api.js';
import { useCart } from '../lib/cart.js';
import { useToast } from './Toasts.jsx';
import NutArt from './NutArt.jsx';
import { formatPrice, formatWeight, formatNumber, formatDate, reviewsWord, cx } from '../lib/format.js';
import { IconClose, IconPlus, IconMinus, IconCheck, IconAlert } from './Icons.jsx';
import { useOverlay } from '../lib/ui.js';

const ring = 'focus-visible:ring-2 focus-visible:ring-caramel focus-visible:outline-none';
const ghostBtn = `flex items-center justify-center border border-hairline bg-card text-muted transition-colors hover:text-ink ${ring}`;
const closeBtn = `absolute right-4 top-4 z-10 h-9 w-9 rounded-pill ${ghostBtn}`;
const cartBtn = `h-8 w-8 rounded-pill ${ghostBtn}`;
const stepperBtn = 'h-9 w-9 text-muted transition-colors hover:text-ink';

function Stars({ value }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="text-[13px] text-gold" aria-hidden="true">
      {'★★★★★'.slice(0, filled)}
      <span className="text-faint">{'★★★★★'.slice(filled)}</span>
    </span>
  );
}

export default function ProductModal({ slug, onClose, onOpen }) {
  const [status, setStatus] = useState('loading');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef(null);
  const { add, qtyOf, inc, dec, openCart } = useCart();
  const toast = useToast();

  const open = Boolean(slug);
  useOverlay(open, onClose, panelRef);

  useEffect(() => {
    if (!slug) return undefined;
    const controller = new AbortController();
    setStatus('loading');
    setProduct(null);
    setError('');
    setQty(1);
    getProduct(slug, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProduct(data);
        setStatus('success');
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return;
        setError(err?.message || 'Не удалось загрузить карточку товара');
        setStatus('error');
      });
    return () => controller.abort();
  }, [slug, attempt]);

  if (!open) return null;

  const p = status === 'success' && product && product.slug ? product : null;
  const inCart = qtyOf(slug);
  const meta = p
    ? [p.origin, formatWeight(p.weight_g), p.stock > 0 ? `${formatNumber(p.stock)} шт` : 'под заказ'].filter(Boolean).join(' · ')
    : '';
  const handleAdd = () => {
    if (!p) return;
    add(p, qty);
    toast.push({ title: 'Добавлено в корзину', text: p.name, tone: 'ok' });
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm sm:p-6">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={p ? p.name : 'Карточка товара'}
        className="relative flex max-h-[90vh] w-full max-w-[980px] flex-col overflow-hidden rounded-card bg-card shadow-lift md:flex-row">
        <button type="button" onClick={onClose} aria-label="Закрыть карточку" className={closeBtn}>
          <IconClose className="h-4 w-4" />
        </button>

        {status === 'error' && !p ? (
          <div className="flex w-full flex-col gap-4 p-6">
            <div className="flex items-start gap-3 rounded-tile border border-hairline bg-cream p-4">
              <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
              <div>
                <p className="text-[15px] text-ink">{error}</p>
                <p className="mt-1 text-[13px] text-muted">Проверьте соединение и попробуйте ещё раз.</p>
              </div>
            </div>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} aria-label="Повторить загрузку карточки"
              className={`self-start rounded-pill bg-caramel px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 ${ring}`}>
              Повторить
            </button>
          </div>
        ) : null}

        {status !== 'error' && !p ? (
          <div className="flex w-full flex-col md:flex-row">
            <div className="w-full bg-band md:w-[44%]">
              <div className="h-full min-h-[280px] w-full animate-pulse bg-hairline" />
            </div>
            <div className="flex-1 space-y-4 p-6">
              <div className="h-3 w-24 animate-pulse rounded-pill bg-hairline" />
              <div className="h-6 w-2/3 animate-pulse rounded-tile bg-hairline" />
              {['w-full', 'w-4/5', 'w-3/5'].map((w) => (
                <div key={w} className={`h-4 ${w} animate-pulse rounded-tile bg-hairline`} />
              ))}
            </div>
          </div>
        ) : null}

        {p ? (
          <>
            <div className="flex w-full shrink-0 items-center justify-center p-6 md:min-h-[520px] md:w-[44%]" style={{ background: p.tone }}>
              <NutArt product={p} variant="tile" className="w-full max-w-[300px]" />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {p.badge ? (
                <span className="inline-block rounded-pill border border-hairline bg-cream px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted">{p.badge}</span>
              ) : null}
              <h3 className="mt-3 font-display text-[24px] leading-tight text-ink">{p.name}</h3>
              <p className="mt-2 text-[13px] text-muted">{meta}</p>
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="text-[24px] font-bold text-ink">{formatPrice(p.price)}</span>
                {p.old_price ? <span className="text-[15px] text-faint line-through">{formatPrice(p.old_price)}</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-semibold text-caramel">{`★ ${Number(p.rating || 0).toFixed(1)} · ${formatNumber(p.reviews_count || 0)} ${reviewsWord(p.reviews_count || 0)}`}</span>
                {p.stock > 0 ? (
                  <span className="flex items-center gap-1.5 text-[13px] text-olive"><IconCheck className="h-4 w-4" />В наличии</span>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{p.description || p.short}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-pill border border-hairline bg-cream">
                  <button type="button" className={cx(stepperBtn, 'rounded-l-pill', ring)} onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Уменьшить количество">
                    <IconMinus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-[15px] font-semibold text-ink" aria-live="polite">{qty}</span>
                  <button type="button" className={cx(stepperBtn, 'rounded-r-pill', ring)} onClick={() => setQty((n) => Math.min(99, n + 1))} aria-label="Увеличить количество">
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
                <button type="button" onClick={handleAdd} aria-label="Добавить в корзину"
                  className={`rounded-pill bg-caramel px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 ${ring}`}>
                  Добавить в корзину
                </button>
              </div>

              {inCart > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-tile border border-hairline bg-cream px-4 py-3">
                  <span className="text-[13px] text-muted">Уже в корзине: <strong className="text-ink">{formatNumber(inCart)}</strong></span>
                  <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => dec(p.slug)} aria-label="Убрать одну упаковку из корзины" className={cartBtn}><IconMinus className="h-4 w-4" /></button>
                    <button type="button" onClick={() => inc(p.slug)} aria-label="Добавить одну упаковку в корзину" className={cartBtn}><IconPlus className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : null}

              {p.reviews?.length ? (
                <div className="mt-8">
                  <h4 className="text-[13px] uppercase tracking-[0.14em] text-faint">Отзывы</h4>
                  <ul className="mt-3 space-y-4">
                    {p.reviews.slice(0, 3).map((r, i) => (
                      <li key={`${r.author}-${i}`} className="border-t border-hairline pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars value={r.rating} />
                          <span className="text-[12px] text-muted">{`${r.author}${r.city ? `, ${r.city}` : ''}`}</span>
                        </div>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/80">{r.text}</p>
                        <p className="mt-1 text-[12px] text-faint">{formatDate(r.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {p.similar?.length ? (
                <div className="mt-8">
                  <h4 className="text-[13px] uppercase tracking-[0.14em] text-faint">Похожие товары</h4>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {p.similar.slice(0, 3).map((s) => (
                      <button key={s.slug} type="button" onClick={() => onOpen(s.slug)} aria-label={`Открыть карточку ${s.name}`}
                        className="rounded-tile border border-hairline bg-cream p-3 text-left transition-colors hover:border-caramel focus-visible:ring-2 focus-visible:ring-caramel focus-visible:outline-none">
                        <NutArt product={s} variant="tile" className="h-16 w-full" />
                        <span className="mt-2 block text-[13px] font-semibold text-ink">{s.name}</span>
                        <span className="mt-1 block text-[13px] text-muted">{formatPrice(s.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
