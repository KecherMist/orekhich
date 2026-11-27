import { useEffect, useRef, useState } from 'react'
import { createOrder, validatePromocode } from '../lib/api.js'
import { useCart, DEFAULT_CONFIG } from '../lib/cart.js'
import { useToast } from './Toasts.jsx'
import { useOverlay } from '../lib/ui.js'
import { isEmail, isPhone, formatPrice, cx } from '../lib/format.js'
import { IconClose, IconCheck, IconAlert, IconArrowRight } from './Icons.jsx'
const POST_FEE = 300
const inputCls = 'w-full rounded-tile border border-hairline bg-cream px-4 py-3 text-ink placeholder:text-faint focus-visible:ring-2 focus-visible:ring-caramel'
const DELIVERY_OPTIONS = [
  { key: 'courier', title: 'Курьер по Москве', note: 'Завтра с 10:00 до 18:00' },
  { key: 'cdek', title: 'СДЭК по России', note: 'ПВЗ или курьер, 3–7 дней' },
  { key: 'post', title: 'Почта России', note: 'Отправка на следующий день' },
  { key: 'pickup', title: 'Самовывоз, Даниловский рынок пав. 4', note: 'Готово к прилавку через 2 часа' },
]
const PAYMENT_OPTIONS = [{ key: 'card', label: 'Карта' }, { key: 'sbp', label: 'СБП' }, { key: 'cash', label: 'Наличными' }]
function feeFor(key) { return key === 'pickup' ? DEFAULT_CONFIG.pickupFee : key === 'post' ? POST_FEE : DEFAULT_CONFIG.deliveryFee }
function Row({ label, value, tone }) {
  return <div className="flex justify-between"><dt className={tone === 'muted' ? 'text-muted' : 'text-ink'}>{label}</dt><dd className={tone === 'olive' ? 'text-olive' : 'text-ink'}>{value}</dd></div>
}
function Field({ label, required, error, textarea, rows = 3, value, onChange, ...rest }) {
  const cls = cx(inputCls, error && 'border-caramel')
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}{required && ' *'}</span>
      {textarea
        ? <textarea rows={rows} value={value} onChange={onChange} className={cls} {...rest} />
        : <input value={value} onChange={onChange} aria-invalid={Boolean(error)} className={cls} {...rest} />}
      {error && <span className="mt-1 block text-caramel text-xs">{error}</span>}
    </label>
  )
}
export default function Checkout({ open, onClose, onDone }) {
  const { lines, subtotal, count, clear, closeCart } = useCart()
  const toast = useToast()
  const panelRef = useRef(null)
  useOverlay(open, onClose, panelRef)
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', email: '', comment: '' })
  const [delivery, setDelivery] = useState('courier')
  const [payment, setPayment] = useState('card')
  const [code, setCode] = useState('')
  const [promo, setPromo] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  useEffect(() => { if (open) closeCart() }, [open, closeCart])
  if (!open) return null
  const isPickup = delivery === 'pickup'
  const deliveryFee = feeFor(delivery)
  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0
  const total = Math.max(subtotal - discount, 0) + deliveryFee
  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }
  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Укажите имя, минимум 2 символа'
    if (!isPhone(form.phone)) next.phone = 'Телефон в формате +7 900 000-00-00'
    if (!isPickup && form.address.trim().length < 6) next.address = 'Адрес доставки, минимум 6 символов'
    if (form.email.trim() && !isEmail(form.email)) next.email = 'Проверьте формат e-mail'
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const checkPromo = async () => {
    const value = code.trim().toUpperCase()
    if (!value) return
    try {
      const res = await validatePromocode(value)
      setPromo({ code: res.code || value, percent: res.percent ?? DEFAULT_CONFIG.firstOrderPercent })
      setFormError('')
    } catch (err) {
      toast.push({ tone: 'error', title: err.message })
    }
  }
  const submitOrder = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!validate()) return
    setSending(true)
    try {
      const res = await createOrder({
        items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
        customer: { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), address: isPickup ? '' : form.address.trim(), delivery, payment, email: form.email.trim(), comment: form.comment.trim() },
        promocode: promo ? promo.code : code.trim().toUpperCase(),
      })
      setSubmitted(res); clear()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSending(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Оформление заказа" className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-card bg-card p-6 shadow-lift md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-h2 text-ink">{submitted ? 'Спасибо за заказ' : 'Оформление заказа'}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть оформление" className="text-muted hover:text-ink"><IconClose className="h-5 w-5" /></button>
        </div>
        {submitted ? (
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive/10"><IconCheck className="h-8 w-8 text-olive" /></span>
            <p className="mt-4 font-semibold text-ink">Заказ {submitted.orderNumber} принят</p>
            <p className="mt-2 text-muted">Обжариваем орехи за 2 часа. Статус придёт на {form.email.trim() || 'указанный телефон'}.</p>
            <p className="mt-5 text-3xl font-bold text-ink">{formatPrice(submitted.total)}</p>
            <dl className="mx-auto mt-4 max-w-sm space-y-1 text-sm">
              <Row label="Товары" value={formatPrice(submitted.subtotal)} />
              {submitted.discount > 0 && <Row label="Скидка" value={`−${formatPrice(submitted.discount)}`} tone="olive" />}
              <Row label="Доставка" value={submitted.deliveryFee ? formatPrice(submitted.deliveryFee) : 'бесплатно'} tone="muted" />
            </dl>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => onDone(submitted.orderNumber)} className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-cream">Следить за статусом <IconArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={onClose} className="flex-1 rounded-pill border border-hairline px-6 py-3 font-bold text-ink">Продолжить покупки</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitOrder} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Имя" required value={form.name} onChange={setField('name')} error={errors.name} placeholder="Как к вам обращаться" />
              <Field label="Телефон" required value={form.phone} onChange={setField('phone')} error={errors.phone} placeholder="+7 900 000-00-00" />
              <Field label="Город" value={form.city} onChange={setField('city')} placeholder="Москва" />
              <Field label="E-mail" value={form.email} onChange={setField('email')} error={errors.email} placeholder="для чека и номера заказа" />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Доставка</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <label key={option.key} className={cx('cursor-pointer rounded-tile border p-4', delivery === option.key ? 'border-caramel bg-cream' : 'border-hairline')}>
                    <input type="radio" name="delivery" value={option.key} checked={delivery === option.key} onChange={() => setDelivery(option.key)} className="sr-only" />
                    <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-ink">{option.title}</span><span className="text-sm text-muted">{feeFor(option.key) ? formatPrice(feeFor(option.key)) : 'бесплатно'}</span></span>
                    <span className="mt-1 block text-xs text-faint">{option.note}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {!isPickup && <Field label="Адрес доставки" required value={form.address} onChange={setField('address')} error={errors.address} placeholder="Улица, дом, квартира" />}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Оплата</legend>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <button key={option.key} type="button" onClick={() => setPayment(option.key)} className={cx('rounded-pill border px-4 py-2 text-sm', payment === option.key ? 'border-ink bg-ink font-bold text-cream' : 'border-hairline text-muted')}>{option.label}</button>
                ))}
              </div>
            </fieldset>
            <div>
              <span className="mb-1 block text-sm font-semibold text-ink">Промокод</span>
              {promo ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-pill bg-olive/10 px-4 py-2 text-sm font-semibold text-olive">−{promo.percent} % {promo.code}</span>
                  <button type="button" onClick={() => { setPromo(null); setCode('') }} className="text-sm text-muted underline">Сбросить</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input value={code} onChange={(event) => setCode(event.target.value)} placeholder={DEFAULT_CONFIG.firstOrderPromo} className={cx(inputCls, 'max-w-[220px]')} />
                  <button type="button" onClick={checkPromo} className="rounded-pill border border-hairline px-4 py-3 text-sm font-bold text-ink">Проверить</button>
                  <span className="text-xs text-faint">Первый заказ −{DEFAULT_CONFIG.firstOrderPercent} %</span>
                </div>
              )}
            </div>
            <Field label="Комментарий" textarea rows={3} value={form.comment} onChange={setField('comment')} placeholder="Домофон, время звонка, гравировка" />
            <div className="rounded-tile border border-hairline bg-cream p-4">
              <p className="mb-2 text-sm font-semibold text-ink">Состав заказа · {count} шт</p>
              <ul className="space-y-1 text-sm text-muted">
                {lines.map((line) => (
                  <li key={line.slug} className="flex justify-between gap-3"><span>{line.name} × {line.qty}</span><span className="text-ink">{formatPrice(line.price * line.qty)}</span></li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 border-t border-hairline pt-3 text-sm">
                <Row label="Товары" value={formatPrice(subtotal)} tone="muted" />
                {discount > 0 && <Row label="Скидка" value={`−${formatPrice(discount)}`} tone="olive" />}
                <Row label="Доставка" value={deliveryFee ? formatPrice(deliveryFee) : 'бесплатно'} tone="muted" />
              </dl>
              <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-base font-bold text-ink"><span>Итого</span><span>{formatPrice(total)}</span></div>
            </div>
            {formError && <p className="flex items-start gap-2 rounded-tile border border-caramel/30 bg-caramel/5 p-3 text-caramel text-sm"><IconAlert className="mt-0.5 h-4 w-4 shrink-0" /> {formError}</p>}
            <button type="submit" disabled={sending || lines.length === 0} className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-cream disabled:opacity-60">
              {sending ? 'Отправляем…' : <>Подтвердить заказ <IconArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
