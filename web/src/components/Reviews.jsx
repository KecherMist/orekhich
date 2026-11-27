// Лента отзывов лавки: 3 карточки + средний балл из API, кнопка «Оставить отзыв».

import { useCallback, useEffect, useState } from 'react';
import { getReviews } from '../lib/api.js';
import { formatDate, formatRating, reviewsWord } from '../lib/format.js';
import ReviewsForm from './ReviewsForm.jsx';
import { IconAlert, IconArrowRight, IconStar, Stars } from './Icons.jsx';

export default function Reviews() {
  const [state, setState] = useState({ loading: true, error: '', items: [], stats: null });
  const [formOpen, setFormOpen] = useState(false);
  const [reload, setReload] = useState(0);

  const load = useCallback(async (signal) => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await getReviews(6, signal);
      setState({
        loading: false,
        error: '',
        items: Array.isArray(data.items) ? data.items : [],
        stats: data.stats || null,
      });
    } catch (error) {
      if (error.message === 'Запрос отменён') return;
      setState({ loading: false, error: error.message, items: [], stats: null });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reload]);

  const avg = state.stats ? state.stats.avg || state.stats.average : null;
  const total = state.stats ? Number(state.stats.total != null ? state.stats.total : state.stats.count) : 0;

  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[560px]">
            <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-caramel">отзывы лавки</span>
            <h2 className="mt-3 font-display text-h2 font-bold">Отзывы лавки</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-[16px]">
              Пишут люди, которые получили пачку на этой неделе. Модерируем вручную: убираем только оскорбления.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="flex items-center justify-end gap-1.5 font-display text-[26px] font-bold leading-none text-ink">
                {avg != null ? formatRating(avg) : '—'}
                <span className="text-[16px] font-bold text-faint">из 5</span>
                <IconStar className="h-5 w-5 text-gold" />
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-muted">
                {total} {reviewsWord(total)} за сезон
              </p>
            </div>
            <button type="button" onClick={() => setFormOpen(true)} className="btn btn-ghost shrink-0">
              Оставить отзыв
              <IconArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="card p-6">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton mt-4 h-3 w-full" />
                <div className="skeleton mt-2 h-3 w-[85%]" />
                <div className="skeleton mt-5 h-3 w-40" />
              </div>
            ))}
          </div>
        ) : null}

        {!state.loading && state.error ? (
          <div className="card mt-10 flex flex-wrap items-center gap-4 border-caramel/30 p-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-caramel/10 text-caramel" aria-hidden="true">
              <IconAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[17px] font-bold">Отзывы не загрузились</p>
              <p className="mt-1 text-[14px] text-muted">{state.error}</p>
            </div>
            <button type="button" onClick={() => setReload((value) => value + 1)} className="btn btn-primary ml-auto">
              Повторить
            </button>
          </div>
        ) : null}

        {!state.loading && !state.error && state.items.length === 0 ? (
          <div className="card mt-10 p-8 text-center">
            <p className="font-display text-[19px] font-bold">Отзывов пока нет</p>
            <p className="mx-auto mt-2 max-w-[42ch] text-[14px] leading-relaxed text-muted">
              Получили пачку — расскажите, как обжарка и хруст. Первый отзыв лавка поощряет скидкой.
            </p>
            <button type="button" onClick={() => setFormOpen(true)} className="btn btn-primary mx-auto mt-5">
              Оставить первый отзыв
            </button>
          </div>
        ) : null}

        {!state.loading && !state.error && state.items.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {state.items.slice(0, 3).map((review, index) => (
              <article
                key={`${review.author}-${index}`}
                className="card flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <Stars value={review.rating} className="h-[15px] w-[15px]" label={`Оценка ${review.rating} из 5`} />
                <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink">«{review.text}»</p>
                <footer className="mt-5 flex items-center gap-3 border-t border-hairline pt-4">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-caramel/15 font-display text-[14px] font-bold text-caramel"
                    aria-hidden="true"
                  >
                    {String(review.author || '?').slice(0, 1)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[12px] font-bold text-muted">{review.author}</span>
                    <span className="block text-[12px] text-faint">
                      {review.city}
                      {review.product ? ` · ${review.product}` : ''} · {formatDate(review.created_at)}
                    </span>
                  </span>
                </footer>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <ReviewsForm open={formOpen} onClose={() => setFormOpen(false)} onSent={() => setReload((value) => value + 1)} />
    </section>
  );
}
