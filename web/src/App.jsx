// «Орехич» — сборка страницы по макету Figma 28:256: порядок секций, провайдеры состояния, оверлеи.

import { useCallback, useEffect, useState } from 'react';
import { CartProvider, DEFAULT_CONFIG, useCart } from './lib/cart.js';
import { getProducts } from './lib/api.js';
import { scrollToAnchor } from './lib/ui.js';
import { ToastProvider } from './components/Toasts.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Benefits from './components/Benefits.jsx';
import Catalog from './components/Catalog.jsx';
import Process from './components/Process.jsx';
import Reviews from './components/Reviews.jsx';
import ReviewsForm from './components/ReviewsForm.jsx';
import Subscribe from './components/Subscribe.jsx';
import TrackOrder from './components/TrackOrder.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Checkout from './components/Checkout.jsx';

function Shop() {
  const { closeCart, refresh } = useCart();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [featured, setFeatured] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [trackNumber, setTrackNumber] = useState('');

  // Один общий запрос: обновляет цены/остатки в корзине и даёт товар для hero-панели.
  useEffect(() => {
    const controller = new AbortController();
    getProducts({ sort: 'popular' }, controller.signal)
      .then((payload) => {
        const items = payload?.items || [];
        if (!items.length) return;
        refresh(items);
        setFeatured(items.find((item) => item.slug === 'fundoq-yadro') || items[0]);
        if (payload.config) setConfig((prev) => ({ ...prev, ...payload.config }));
      })
      .catch(() => { /* витрина сама покажет ошибку в своей секции */ });
    return () => controller.abort();
  }, [refresh]);

  const openCheckout = useCallback(() => {
    closeCart();
    setCheckoutOpen(true);
  }, [closeCart]);

  const handleOrderPlaced = useCallback((number) => {
    setCheckoutOpen(false);
    if (number) {
      setTrackNumber(number);
      window.setTimeout(() => scrollToAnchor('track'), 60);
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <a href="#catalog" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
        Перейти к каталогу
      </a>

      <Header />

      <main>
        <Hero featured={featured} />
        <Benefits />
        <Catalog onConfig={setConfig} />
        <Process />
        <Reviews />

        <section className="section bg-band">
          <div className="wrap flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Обратная связь</p>
              <h2 className="mt-2 font-display text-h2 text-ink">Расскажите, как вам орехи</h2>
              <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted">
                Отзывы читают обжарщики: если партия ушла суховатой или, наоборот, идеально — мы это учтём
                в следующем барабане. Модерация занимает один рабочий день.
              </p>
            </div>
            <button type="button" className="btn btn-ghost shrink-0" onClick={() => setReviewOpen(true)}>
              Оставить отзыв
            </button>
          </div>
        </section>

        <div id="delivery" className="scroll-mt-24">
          <TrackOrder number={trackNumber} onNumberChange={setTrackNumber} />
        </div>

        <Subscribe config={config} />
      </main>

      <Footer />

      <CartDrawer onCheckout={openCheckout} />
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onDone={handleOrderPlaced} />
      <ReviewsForm open={reviewOpen} onClose={() => setReviewOpen(false)} onSent={() => setReviewOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <Shop />
      </CartProvider>
    </ToastProvider>
  );
}
