// Тёмная секция «Как устроена обжарка»: 4 карточки bg-ink2, номера золотом.

const STEPS = [
  {
    num: '01',
    title: 'Отбор и сушка',
    text: 'Ядра калибруем по размеру и сушим при 55 °C до влажности 4 % — так орех хрустит, а не размокает.',
  },
  {
    num: '02',
    title: 'Обжарка 150 °C · 11 мин',
    text: 'Ростер на 12 кг, мешаем вручную и снимаем партию по цвету ядра, а не по таймеру.',
  },
  {
    num: '03',
    title: 'Остывание на противне',
    text: 'Сразу рассыпаем партию на холодный противень: жар уходит, ядро остаётся сухим и хрустящим.',
  },
  {
    num: '04',
    title: 'Пачка и отгрузка',
    text: 'Крафтовый пакет с клапаном, дата обжарки и партия на этикетке. Заказ до 15:00 уезжает сегодня.',
  },
];

export default function Process() {
  return (
    <section id="roast" className="section bg-ink py-16 lg:py-[80px]">
      <div className="wrap">
        <div className="max-w-[640px]">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold">цех обжарки</span>
          <h2 className="mt-3 font-display text-h2 font-bold text-darktext">Как устроена обжарка</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-creamtext sm:text-[17px]">
            Четыре шага от сада до пачки: без перекупа, без перевалки на склад и без «ароматизаторов».
            Партию варим в пятницу — в воскресенье она уже в пути.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((step) => (
            <li
              key={step.num}
              className="rounded-[18px] border border-cream/10 bg-ink2 p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/35"
            >
              <span className="font-display text-[26px] font-bold leading-none text-gold">{step.num}</span>
              <h3 className="mt-4 font-display text-[18px] font-bold leading-snug text-darktext">{step.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-creamtext">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-cream/10 pt-6 text-[13px] font-semibold text-creamtext">
          <span>Температура ростера: 150 °C</span>
          <span>Время партии: 11 минут</span>
          <span>Вес партии: 12 кг</span>
          <span>Влажность ядра: 4 %</span>
        </div>
      </div>
    </section>
  );
}
