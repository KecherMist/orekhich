// Hero из макета: пилюля-бейдж, заголовок Literata, две кнопки, три метрики и арт-панель с «орехом».

import NutArt from './NutArt.jsx';
import { IconArrowRight, IconFire, IconStar } from './Icons.jsx';
import { formatPrice } from '../lib/format.js';

const FALLBACK = {
  slug: 'fundoq-yadro',
  name: 'Фундук ядро',
  price: 890,
  art: 'hazelnut',
  tone: '#EFE3D0',
  accent: '#C1662F',
};

const METRICS = [
  { value: '4,9 ★', label: '1 652 отзыва' },
  { value: '12 кг', label: 'в одной партии' },
  { value: '24–72 ч', label: 'доставка по России' },
];

export default function Hero({ featured }) {
  const hero = featured && featured.slug ? featured : FALLBACK;

  return (
    <section id="top" className="relative overflow-hidden pb-14 pt-10 md:pb-16 md:pt-14 lg:pb-20 lg:pt-16">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="anim-rise max-w-[620px]">
          <span className="inline-flex items-center gap-2.5 rounded-pill bg-caramel/10 px-4 py-2 text-[13px] font-bold text-caramel">
            <span className="h-2 w-2 rounded-full bg-caramel" aria-hidden="true" />
            Свежая обжарка по пятницам
          </span>

          <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.06] tracking-[-0.02em] text-ink sm:text-h1">
            Орехи, которые
            <br />
            обжаривают в пятницу
            <br className="hidden sm:block" /> и отправляют сухими
          </h1>

          <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-muted sm:text-[18px]">
            Фундук, кедр, пекан и макадамия с фермерских садов. Ростер на 12 кг, дата обжарки на каждой пачке и
            отгрузка в день заказа — без перекупа и складов.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#catalog" className="btn btn-primary w-full sm:w-auto">
              Смотреть каталог
              <IconArrowRight className="h-4 w-4" />
            </a>
            <a href="#roast" className="btn btn-ghost w-full sm:w-auto">
              Как устроена обжарка
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-5 border-t border-hairline pt-6 sm:grid-cols-3 sm:gap-0">
            {METRICS.map((metric, index) => (
              <div key={metric.label} className={index > 0 ? 'sm:border-l sm:border-hairline sm:pl-6' : ''}>
                <dt className="flex items-center gap-1.5 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
                  {metric.value.includes('★') ? (
                    <>
                      {metric.value.replace(' ★', '')}
                      <IconStar className="h-4 w-4 text-gold" />
                    </>
                  ) : (
                    metric.value
                  )}
                </dt>
                <dd className="mt-1 text-[13px] font-semibold text-muted">{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="anim-rise relative" style={{ animationDelay: '120ms' }}>
          <div className="relative mx-auto w-full max-w-[520px] rounded-panel bg-band p-6 md:p-8">
            <div className="relative mx-auto grid aspect-square w-full max-w-[420px] place-items-center rounded-full bg-caramel">
              <span className="absolute inset-5 rounded-full border border-cream/30" aria-hidden="true" />
              <span className="absolute inset-14 rounded-full border border-cream/15" aria-hidden="true" />
              <div className="relative z-10 w-[58%]" aria-hidden="true">
                <NutArt product={{ ...hero, accent: '#FAF5EB' }} variant="bare" kernelClassName="w-full" />
              </div>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/70">
                партия №{String(hero.id || 1).padStart(2, '0')}
              </span>
            </div>

            <div className="anim-float absolute -left-2 top-10 flex items-center gap-3 rounded-[16px] border border-hairline bg-card px-4 py-3 shadow-lift md:-left-6">
              <NutArt product={hero} variant="micro" />
              <span className="leading-tight">
                <span className="block text-[15px] font-bold text-ink">{hero.name}</span>
                <span className="block text-[13px] font-semibold text-caramel">{formatPrice(hero.price)}</span>
              </span>
            </div>

            <div className="anim-float-slow absolute -right-1 bottom-8 flex items-center gap-3 rounded-[16px] border border-hairline bg-card px-4 py-3 shadow-lift md:-right-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-caramel/15 text-caramel" aria-hidden="true">
                <IconFire className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Обжарка партии</span>
                <span className="block text-[15px] font-bold text-ink">150 °C · 11 мин</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
