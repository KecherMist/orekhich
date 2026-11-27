/** @type {import('tailwindcss').Config} */
// Токены сняты с макета Figma: узел 28:256 (Desktop 1440) и 28:436 (Mobile 390), файл 4KGtbw0Izwm1HllfoZ9DLW
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF5EB',      // фон страницы (0.98, 0.961, 0.922)
        band: '#F3EBDC',       // подложка секции преимуществ
        card: '#FFFDF7',       // карточки товаров и отзывов
        hairline: '#E0D4C0',   // тонкие рамки
        ink: '#241A12',        // основной текст и тёмные секции
        ink2: '#33261B',       // карточки на тёмном
        muted: '#7A6A5A',      // вторичный текст
        faint: '#AD9C8A',      // старые цены, подписи
        creamtext: '#C8B9A6',  // вторичный текст на тёмном
        caramel: '#C1662F',    // акцент: кнопки, «Хит»
        olive: '#56704B',      // акцент: кедр, «Коллекция»
        gold: '#E3A93C',       // звёзды рейтинга, макадамия
        mixolive: '#6F7F4E',   // миксы
        darktext: '#FAF5EB',
      },
      fontFamily: {
        display: ['Literata', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['clamp(2.5rem, 4.3vw, 3.875rem)', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.75rem, 2.8vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
        h3: ['1.1875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        card: '0 1px 0 rgba(36,26,18,.05), 0 18px 40px -26px rgba(36,26,18,.35)',
        lift: '0 26px 60px -28px rgba(36,26,18,.45)',
        pill: '0 10px 24px -14px rgba(193,102,47,.55)',
      },
      borderRadius: { card: '20px', pill: '999px', tile: '14px', panel: '32px' },
      maxWidth: { wrap: '1280px' },
      spacing: { gutter: '80px' },
    },
  },
  plugins: [],
};
