import { useRef } from 'react';
import { DEFAULT_CONFIG, useCart } from '../lib/cart.js';
import NutArt from './NutArt.jsx';
import { IconArrowRight, IconClose, IconMinus, IconPlus, IconTrash, IconTruck } from './Icons.jsx';
import { cx, formatPrice, leftForFreeDelivery, packagesWord } from '../lib/format.js';
import { useOverlay } from '../lib/ui.js';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-card';

export default function CartDrawer({ onCheckout }) {
  const { lines, count, subtotal, open, closeCart, inc, dec, remove } = useCart();
  const panelRef = useRef(null);
  useOverlay(open, closeCart, panelRef);

  if (!open) return null;

  const threshold = DEFAULT_CONFIG.freeDeliveryFrom;
  const left = leftForFreeDelivery(subtotal, threshold);
  const freeDelivery = left <= 0;
  const progress = threshold > 0
    ? Math.max(0, Math.min(100, Math.round((subtotal / threshold) * 100)))
    : 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeCart();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-card shadow-lift flex flex-col"
      >
        <header className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-ink text-xl">Корзина</h2>
            <span className="text-xs text-muted">
              {count} {packagesWord(count)}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Закрыть корзину"
            className={`h-9 w-9 inline-flex items-center justify-center rounded-pill text-muted transition-colors hover:bg-band hover:text-ink ${focusRing}`}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {count === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <IconTruck className="h-10 w-10 text-hairline" />
              <p className="text-[15px] text-muted">Корзина пуста — начните с фундука</p>
              <button
                type="button"
                onClick={closeCart}
                className={`inline-flex items-center justify-center rounded-pill border border-hairline px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-band ${focusRing}`}
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.slug} className="flex items-center gap-3">
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-tile"
                    style={{ background: line.tone }}
                  >
                    <NutArt
                      art={line.art}
                      tone={line.tone}
                      accent={line.accent}
                      variant="mini"
                      className="h-14 w-14"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-ink text-[15px] font-semibold leading-snug">{line.name}</p>
                    <p className="mt-1 text-muted text-xs">
                      {formatPrice(line.price)} × {line.qty}
                    </p>
                    <div className="mt-2 inline-flex items-center border border-hairline rounded-pill">
                      <button
                        type="button"
                        onClick={() => dec(line.slug)}
                        aria-label="Уменьшить"
                        className={`h-8 w-8 inline-flex items-center justify-center text-muted transition-colors hover:text-ink ${focusRing}`}
                      >
                        <IconMinus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2ch] px-1 text-center text-[13px] font-semibold text-ink tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => inc(line.slug)}
                        aria-label="Увеличить"
                        className={`h-8 w-8 inline-flex items-center justify-center text-muted transition-colors hover:text-ink ${focusRing}`}
                      >
                        <IconPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-semibold text-ink text-[15px] tabular-nums">
                      {formatPrice(line.price * line.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(line.slug)}
                      aria-label="Удалить"
                      className={`h-8 w-8 inline-flex items-center justify-center text-faint transition-colors hover:text-caramel ${focusRing}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-hairline bg-card px-5 py-4">
          {count > 0 &&
            (freeDelivery ? (
              <div className="mb-3 flex items-center gap-2 text-[13px] text-olive">
                <IconTruck className="h-4 w-4" />
                <span className="font-semibold">Доставка бесплатна</span>
              </div>
            ) : (
              <div className="mb-3 bg-band rounded-tile p-3 text-[13px] text-ink">
                <p>До бесплатной доставки ещё {formatPrice(left)}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-pill bg-hairline">
                  <div
                    className="h-full rounded-pill bg-caramel transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}

          <dl className="mb-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-muted">Товары</dt>
              <dd className="text-[14px] font-semibold text-ink tabular-nums">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[13px] text-muted">Доставка</dt>
              <dd className="text-[13px] text-muted">
                от {formatPrice(DEFAULT_CONFIG.deliveryFee)}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onCheckout}
            disabled={count === 0}
            className={cx(
              'w-full bg-caramel text-white rounded-pill py-3 font-bold',
              'inline-flex items-center justify-center transition-colors hover:brightness-95',
              'disabled:opacity-45 disabled:pointer-events-none',
              focusRing,
            )}
          >
            <span>Оформить заказ</span>
            <IconArrowRight className="ml-2 h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            Оплата картой, СБП или наличными при получении
          </p>
        </div>
      </aside>
    </div>
  );
}
