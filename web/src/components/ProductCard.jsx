// Карточка товара в сетке каталога (305×430 в макете): арт-тайл, название, мета, цена, рейтинг, кнопка.

import NutArt from './NutArt.jsx';
import { IconStar } from './Icons.jsx';
import { formatPrice, formatRating, formatWeight, reviewsWord } from '../lib/format.js';
import { useCart } from '../lib/cart.js';
import { useToast } from './Toasts.jsx';

export default function ProductCard({ product, onOpen }) {
  const { add, qtyOf } = useCart();
  const toast = useToast();
  const inCart = qtyOf(product.slug);
  const soldOut = Number(product.stock) === 0;
  const lowStock = !soldOut && Number(product.stock) > 0 && Number(product.stock) <= 45;

  function addToCart() {
    add(product, 1);
    toast.success(`${product.name} — в корзине`);
  }

  return (
    <article className="card flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(product.slug)}
          className="block w-full rounded-tile transition focus-visible:ring-2 focus-visible:ring-caramel"
          aria-label={`Открыть карточку товара «${product.name}»`}
        >
          <NutArt product={product} variant="tile" />
        </button>

        {product.badge ? (
          <span
            className="pointer-events-none absolute left-3 top-3 rounded-pill px-3 py-1 text-[11px] font-bold"
            style={{ background: `${product.accent || '#C1662F'}26`, color: product.accent || '#C1662F' }}
          >
            {product.badge}
          </span>
        ) : null}

        {inCart > 0 ? (
          <span className="pointer-events-none absolute right-3 top-3 rounded-pill bg-ink px-2.5 py-1 text-[11px] font-bold text-cream">
            {inCart} в корзине
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 font-display text-[19px] font-bold leading-snug tracking-[-0.01em]">
        <button
          type="button"
          onClick={() => onOpen(product.slug)}
          className="text-left transition hover:text-caramel"
          aria-label={`Подробнее о «${product.name}»`}
        >
          {product.name}
        </button>
      </h3>

      <p className="mt-1.5 truncate text-[13px] text-muted" title={`${product.origin} · ${formatWeight(product.weight_g)}`}>
        {product.origin} · {formatWeight(product.weight_g)}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-x-2.5 gap-y-1">
        <span className="font-display text-[21px] font-bold leading-none text-ink">{formatPrice(product.price)}</span>
        {product.old_price ? (
          <span className="pb-0.5 text-[13px] font-semibold text-faint line-through">{formatPrice(product.old_price)}</span>
        ) : null}
        {lowStock ? (
          <span className="ml-auto pb-0.5 text-[12px] font-bold text-caramel">осталось {product.stock}</span>
        ) : null}
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted">
        <IconStar className="h-3.5 w-3.5 text-gold" />
        <span className="font-semibold text-ink">{formatRating(product.rating)}</span>
        <span className="text-faint">
          · {product.reviews_count} {reviewsWord(product.reviews_count)}
        </span>
      </p>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{product.short}</p>

      <div className="sticky bottom-2 mt-4 bg-card/90 pt-1 backdrop-blur-sm md:mt-auto md:bg-transparent md:pt-0 md:backdrop-blur-none">
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          className="btn btn-primary w-full"
          aria-label={soldOut ? `${product.name}: нет в наличии` : `Добавить «${product.name}» в корзину за ${formatPrice(product.price)}`}
        >
          {soldOut ? 'Нет в наличии' : `В корзину · ${formatPrice(product.price)}`}
        </button>
      </div>
    </article>
  );
}
