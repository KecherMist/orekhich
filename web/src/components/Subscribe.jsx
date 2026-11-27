// Тёмная панель подписки: −15 % на первый заказ, инлайн-валидация почты и выдача промокода.

import { useState } from 'react';
import { subscribe } from '../lib/api.js';
import { isEmail } from '../lib/format.js';
import { useToast } from './Toasts.jsx';
import { IconCheck, IconCopy, IconMail, IconSpark } from './Icons.jsx';

export default function Subscribe({ config }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const trimmed = email.trim();
  const invalid = touched && trimmed.length > 0 && !isEmail(trimmed);

  async function onSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!isEmail(trimmed)) {
      toast.error('Проверьте адрес почты — нужен формат вида почта@лавка.рф');
      return;
    }
    setSending(true);
    try {
      const data = await subscribe(trimmed);
      setResult(data);
      setCopied(false);
      toast.success(data.already ? 'Вы уже в списке — промокод тот же' : 'Промокод на скидку отправлен на почту');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }

  const promo = (result && (result.promo || result.code)) || (config && config.firstOrderPromo) || 'OREH-000000';

  async function copyPromo() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(promo);
      } else {
        const helper = document.createElement('textarea');
        helper.value = promo;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        document.body.removeChild(helper);
      }
      setCopied(true);
      toast.success('Промокод скопирован');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info('Скопируйте код вручную: ' + promo);
    }
  }

  return (
    <section className="section pt-0 lg:pt-2">
      <div className="wrap">
        <div className="rounded-[24px] bg-ink px-6 py-10 shadow-lift md:px-12 md:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-pill bg-cream/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold">
                <IconSpark className="h-4 w-4" />
                первый заказ
              </span>
              <h2 className="mt-4 font-display text-h2 font-bold text-darktext">−15 % на первый заказ</h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-creamtext sm:text-[16px]">
                Оставьте почту — пришлём промокод и письмо с датой ближайшей обжарки. Раз в неделю, без рассылок
                «только сегодня».
              </p>
            </div>

            <div>
              <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
                <div className="flex-1">
                  <label htmlFor="subscribe-email" className="sr-only">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <IconMail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
                    <input
                      id="subscribe-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="ваша почта"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onBlur={() => setTouched(true)}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? 'subscribe-email-error' : undefined}
                      className={`h-12 w-full rounded-pill border bg-card pl-11 pr-4 text-[15px] text-ink transition placeholder:text-faint focus:border-caramel ${
                        invalid ? 'border-caramel' : 'border-transparent'
                      }`}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary shrink-0" disabled={sending}>
                  {sending ? 'Отправляем…' : 'Получить скидку'}
                </button>
              </form>

              {invalid ? (
                <p id="subscribe-email-error" className="mt-2 text-[13px] font-semibold text-gold">
                  Введите корректный адрес почты
                </p>
              ) : null}

              {result ? (
                <div className="anim-rise mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-cream/15 bg-ink2 px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-olive/25 text-cream" aria-hidden="true">
                    <IconCheck className="h-5 w-5" />
                  </span>
                  <p className="text-[14px] leading-snug text-creamtext">
                    {result.already ? 'Вы уже подписаны — вот ваш промокод:' : 'Промокод на скидку '}
                    <b className="font-display text-[18px] font-bold text-darktext">{promo}</b>
                    {result.percent ? ` · −${result.percent} %` : ''}
                    {result.already ? '' : ' уже в письме.'}
                  </p>
                  <button
                    type="button"
                    onClick={copyPromo}
                    aria-label="Скопировать промокод"
                    className="ml-auto inline-flex items-center gap-2 rounded-pill border border-cream/20 px-3.5 py-2 text-[13px] font-bold text-darktext transition hover:bg-cream/10"
                  >
                    {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
