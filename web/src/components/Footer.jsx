// Тёмный подвал: контакты, три колонки ссылок, юридическая строка.

import { IconArrowRight, IconMail, IconPhone, IconPin } from './Icons.jsx';

const COLUMNS = [
  {
    title: 'Каталог',
    links: [
      { label: 'Орехи', href: '#catalog' },
      { label: 'Миксы', href: '#catalog' },
      { label: 'Мёд с пасеки', href: '#catalog' },
      { label: 'Сухофрукты', href: '#catalog' },
    ],
  },
  {
    title: 'Лавка',
    links: [
      { label: 'Как устроена обжарка', href: '#roast' },
      { label: 'Отзывы покупателей', href: '#reviews' },
      { label: 'Доставка и оплата', href: '#delivery' },
      { label: 'Подписка на скидку', href: '#subscribe' },
    ],
  },
  {
    title: 'Покупателям',
    links: [
      { label: 'Отследить заказ', href: '#delivery' },
      { label: 'Оставить отзыв', href: '#reviews' },
      { label: 'Возврат без переписки', href: '#benefits' },
      { label: 'Наверх', href: '#top' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink pb-8 pt-14 lg:pt-16">
      <div className="wrap">
        <div className="grid gap-10 border-b border-cream/10 pb-10 lg:grid-cols-[1.25fr_2fr] lg:gap-16">
          <div>
            <a href="#top" className="flex items-center gap-3" aria-label="Орехич — наверх">
              <span
                className="grid h-10 w-10 place-items-center rounded-[12px] bg-caramel font-display text-[19px] font-bold text-cream"
                aria-hidden="true"
              >
                О
              </span>
              <span className="font-display text-[20px] font-bold text-darktext">Орехич</span>
            </a>
            <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-creamtext">
              Крафтовая обжарочная лавка: орехи, миксы, мёд и сухофрукты. Обжариваем малыми партиями по пятницам и
              отправляем сухими в тот же день.
            </p>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              <li>
                <a href="tel:+79775120840" className="inline-flex items-center gap-2.5 text-darktext transition hover:text-caramel">
                  <IconPhone className="h-4 w-4 text-gold" />
                  +7 977 512-08-40
                </a>
              </li>
              <li>
                <a
                  href="mailto:zakaz@orekhich.ru"
                  className="inline-flex items-center gap-2.5 text-darktext transition hover:text-caramel"
                >
                  <IconMail className="h-4 w-4 text-gold" />
                  zakaz@orekhich.ru
                </a>
              </li>
              <li className="inline-flex items-start gap-2.5 text-creamtext">
                <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                Даниловский рынок, пав. 4 · самовывоз с 10:00 до 20:00
              </li>
            </ul>
          </div>

          <nav className="grid gap-8 sm:grid-cols-3" aria-label="Ссылки в подвале">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-[14px] text-creamtext transition hover:text-darktext"
                      >
                        {link.label}
                        <IconArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-60" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[13px] text-creamtext sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Орехич · ИП Котов А. С. · ОГРН 321774600123456</p>
          <a href="#top" className="link-quiet !text-creamtext hover:!text-darktext">
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </footer>
  );
}
