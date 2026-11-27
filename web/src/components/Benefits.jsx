// Лента преимуществ: 4 колонки на подложке band, номера карамелью.

import { IconClock, IconFire, IconLeaf, IconShield } from './Icons.jsx';

const BENEFITS = [
  {
    num: '01',
    title: 'Обжарка малыми партиями',
    text: 'По 12 кг в ростере: каждое ядро прокалилось ровно, ничего не пережжено и не горчит.',
    Icon: IconFire,
  },
  {
    num: '02',
    title: 'Дата обжарки на пачке',
    text: 'Пишем дату и номер партии на крафтовом пакете с клапаном — видно, когда орехи сели в ростер.',
    Icon: IconLeaf,
  },
  {
    num: '03',
    title: 'Отгрузка в день заказа',
    text: 'Заказы, оформленные до 15:00, уезжают со склада в тот же день, курьером или в пункт выдачи.',
    Icon: IconClock,
  },
  {
    num: '04',
    title: 'Возврат, если не понравится',
    text: 'Не пришли хрустящими или не подошли по вкусу — вернём деньги без переписки и экспертиз.',
    Icon: IconShield,
  },
];

export default function Benefits() {
  return (
    <section className="border-y border-hairline bg-band py-12 lg:py-[52px]" aria-label="Почему у нас берут орехи">
      <div className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {BENEFITS.map((item, index) => {
          const Icon = item.Icon;
          return (
            <article
              key={item.num}
              className={`flex gap-4 lg:px-7 ${index === 0 ? 'lg:pl-0' : 'lg:border-l lg:border-hairline'} ${
                index === BENEFITS.length - 1 ? 'lg:pr-0' : ''
              }`}
            >
              <div>
                <span className="text-[13px] font-bold tracking-[0.12em] text-caramel">{item.num}</span>
                <h3 className="mt-2 flex items-center gap-2 font-display text-[17px] font-bold leading-snug text-ink">
                  <Icon className="h-4 w-4 shrink-0 text-olive" />
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-muted">{item.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
