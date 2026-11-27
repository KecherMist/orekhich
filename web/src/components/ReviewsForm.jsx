// Форма отзыва: рейтинг звёздами, валидация как на бэкенде, ответ «отзыв на премодерации».

import { useEffect, useRef, useState } from 'react';
import { createReview, getProducts } from '../lib/api.js';
import { useOverlay } from '../lib/ui.js';
import { IconClose, IconStar } from './Icons.jsx';
import { useToast } from './Toasts.jsx';

const RATING_HINTS = ['совсем не понравилось', 'бывает лучше', 'нормально, беру ещё', 'вкусно и хрустко', 'как из детства'];

export default function ReviewsForm({ open, onClose, onSent }) {
  const toast = useToast();
  const panelRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ author: '', city: '', text: '', product_slug: '' });
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState('');
  const [sent, setSent] = useState(false);

  useOverlay(open, onClose, panelRef);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setApiError('');
    setErrors({});
    let alive = true;
    getProducts({ sort: 'popular' })
      .then((data) => {
        if (alive) setProducts(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (alive) setProducts([]);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate() {
    const next = {};
    if (form.author.trim().length < 2) next.author = 'Как вас подписать? Минимум 2 символа';
    if (form.text.trim().length < 20) next.text = `Расскажите подробнее — нужно ещё ${20 - form.text.trim().length} символов`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSending(true);
    setApiError('');
    try {
      await createReview({
        author: form.author.trim(),
        city: form.city.trim(),
        rating,
        text: form.text.trim(),
        product_slug: form.product_slug || undefined,
      });
      setSent(true);
      setForm({ author: '', city: '', text: '', product_slug: '' });
      setRating(5);
      toast.success('Отзыв на премодерации — появится после проверки');
      if (onSent) onSent();
    } catch (error) {
      setApiError(error.message);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }

  const shown = hovered || rating;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="anim-fade absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-sm"
        aria-label="Закрыть форму отзыва"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-form-title"
        className="anim-modal relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-panel bg-cream p-6 shadow-lift scrollbar-thin sm:rounded-panel sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-caramel">отзыв</span>
            <h3 id="reviews-form-title" className="mt-2 font-display text-[24px] font-bold leading-tight">
              Оставьте отзыв о пачке
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-pill p-2 text-muted transition hover:bg-ink/5 hover:text-ink"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-[18px] border border-olive/30 bg-olive/10 p-5">
            <p className="font-display text-[18px] font-bold text-ink">Отзыв отправлен на премодерацию</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Модератор лавки прочитает его в течение дня — после проверки он появится в витрине и в карточке товара.
            </p>
            <button type="button" onClick={onClose} className="btn btn-primary mt-4" data-autofocus>
              Понятно
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <div>
              <span className="label">Ваша оценка</span>
              <div className="flex items-center gap-1.5" onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      setRating(step);
                      setHovered(0);
                    }}
                    onMouseEnter={() => setHovered(step)}
                    aria-label={`Оценка ${step} из 5 — ${RATING_HINTS[step - 1]}`}
                    aria-pressed={rating === step}
                    className="rounded-[10px] p-1 transition hover:scale-110"
                  >
                    <IconStar className={`h-7 w-7 ${step <= shown ? 'text-gold' : 'text-hairline'}`} filled={step <= shown} />
                  </button>
                ))}
                <span className="ml-2 text-[13px] font-semibold text-muted">{RATING_HINTS[shown - 1]}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="review-author">
                  Имя
                </label>
                <input
                  id="review-author"
                  className={`field ${errors.author ? 'border-caramel' : ''}`}
                  value={form.author}
                  onChange={(event) => update('author', event.target.value)}
                  placeholder="Марина К."
                  maxLength={60}
                  aria-invalid={Boolean(errors.author)}
                />
                {errors.author ? <p className="mt-1.5 text-[12px] font-semibold text-caramel">{errors.author}</p> : null}
              </div>
              <div>
                <label className="label" htmlFor="review-city">
                  Город
                </label>
                <input
                  id="review-city"
                  className="field"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  placeholder="Москва"
                  maxLength={60}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="review-product">
                О каком товаре рассказываем
              </label>
              <select
                id="review-product"
                className="field pr-10"
                value={form.product_slug}
                onChange={(event) => update('product_slug', event.target.value)}
              >
                <option value="">Любой товар лавки</option>
                {products.map((product) => (
                  <option key={product.slug} value={product.slug}>
                    {product.name} · {product.weight_g} г
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="review-text">
                Отзыв
              </label>
              <textarea
                id="review-text"
                rows={4}
                className={`field-flat resize-y ${errors.text ? 'border-caramel' : ''}`}
                value={form.text}
                onChange={(event) => update('text', event.target.value)}
                placeholder="Как обжарка, хруст, упаковка и доставка"
                maxLength={900}
                aria-invalid={Boolean(errors.text)}
              />
              <div className="mt-1.5 flex items-center justify-between">
                {errors.text ? (
                  <p className="text-[12px] font-semibold text-caramel">{errors.text}</p>
                ) : (
                  <p className="text-[12px] text-faint">От 20 символов, без мата</p>
                )}
                <span className="text-[12px] text-faint">{form.text.trim().length} / 900</span>
              </div>
            </div>

            {apiError ? (
              <p className="rounded-[14px] border border-caramel/35 bg-caramel/10 px-4 py-3 text-[13px] font-semibold text-caramel">
                {apiError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Отправляем…' : 'Отправить отзыв'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
