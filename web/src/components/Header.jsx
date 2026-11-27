// Шапка макета: 96px, sticky, лого-тайл + навигация + телефон + корзина со счётчиком.

import { useEffect, useState } from 'react';
import { useCart } from '../lib/cart.js';
import { IconCart, IconClose, IconPhone } from './Icons.jsx';

const NAV = [
  { href: '#catalog', label: 'Каталог' },
  { href: '#roast', label: 'Обжарка' },
  { href: '#reviews', label: 'Отзывы' },
  { href: '#delivery', label: 'Доставка' },
];

export default function Header() {
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-cream/85 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'border-hairline shadow-[0_10px_30px_-26px_rgba(36,26,18,.5)]' : 'border-hairline/70'
      }`}
    >
      <div className="wrap flex h-24 items-center gap-6">
        <a href="#top" className="flex items-center gap-3" aria-label="Орехич — наверх">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-caramel font-display text-[19px] font-bold text-cream shadow-pill"
            aria-hidden="true"
          >
            О
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[20px] font-bold tracking-[-0.01em] text-ink">Орехич</span>
            <span className="hidden text-[12px] font-semibold text-muted sm:block">лавка орехов и мёда</span>
          </span>
        </a>

        <nav className="ml-4 hidden items-center gap-7 md:flex" aria-label="Разделы лавки">
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-semibold text-muted underline-offset-[6px] transition hover:text-ink hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenu((open) => !open)}
            aria-expanded={menu}
            aria-label={menu ? 'Закрыть меню разделов' : 'Открыть меню разделов'}
            className="grid h-12 w-12 place-items-center rounded-pill border border-hairline bg-card text-ink transition hover:border-ink/30 md:hidden"
          >
            {menu ? (
              <IconClose className="h-5 w-5" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            )}
          </button>
          <a
            href="tel:+79775120840"
            className="hidden items-center gap-2 text-[15px] font-bold text-ink transition hover:text-caramel lg:flex"
          >
            <IconPhone className="h-4 w-4 text-caramel" />
            +7 977 512-08-40
          </a>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Корзина: ${count} ${count === 1 ? 'позиция' : 'позиций'}`}
            className="group flex h-12 items-center gap-2.5 rounded-pill border border-hairline bg-card px-4 text-[14px] font-bold text-ink transition hover:border-ink/30 hover:shadow-card"
          >
            <IconCart className="h-5 w-5 text-ink transition group-hover:text-caramel" />
            <span className="hidden sm:inline">Корзина</span>
            <span
              key={count}
              className={`grid h-[22px] min-w-[22px] place-items-center rounded-pill px-1.5 text-[12px] font-bold ${
                count > 0 ? 'anim-pop bg-caramel text-cream' : 'bg-ink/10 text-faint'
              }`}
              aria-hidden="true"
            >
              {count}
            </span>
          </button>
        </div>
      </div>

      {menu ? (
        <nav className="border-t border-hairline bg-cream md:hidden" aria-label="Мобильная навигация">
          <div className="wrap flex flex-col py-2">
            {NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenu(false)}
                className="border-b border-hairline/60 py-3 text-[15px] font-semibold text-ink last:border-0"
              >
                {link.label}
              </a>
            ))}
            <a href="tel:+79775120840" className="py-3 text-[15px] font-bold text-caramel">
              +7 977 512-08-40
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
