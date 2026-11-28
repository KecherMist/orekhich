import { useEffect, useRef, useState } from 'react'
import { trackOrder } from '../lib/api.js'
import { formatPrice, formatDate, cx } from '../lib/format.js'
import { IconClock, IconAlert, IconCheck } from './Icons.jsx'

// Ключи совпадают со статусами заказов в базе лавки: new → roast → packing → shipping → done.
const STEPS = [
  { key: 'new', label: 'Заказ принят' },
  { key: 'roast', label: 'В обжарке' },
  { key: 'packing', label: 'Упакован' },
  { key: 'shipping', label: 'В пути' },
  { key: 'done', label: 'Доставлен' },
]

const STATUS_ORDER = STEPS.map((step) => step.key)
const STATUS_LABELS = { cancelled: 'Отменён' }

const inputCls =
  'w-full rounded-tile border border-hairline bg-cream px-4 py-3 text-ink placeholder:text-faint focus-visible:ring-2 focus-visible:ring-caramel'

function stepLabel(key) {
  const step = STEPS.find((item) => item.key === key)
  return step ? step.label : (STATUS_LABELS[key] || key)
}

function reachedIndex(data) {
  const done = (data.timeline || []).map((row) => row.status)
  const byStatus = STATUS_ORDER.indexOf(data.status)
  const byTimeline = done.reduce((max, key) => Math.max(max, STATUS_ORDER.indexOf(key)), -1)
  return Math.max(byStatus, byTimeline)
}

export default function TrackOrder({ number, onNumberChange }) {
  const [value, setValue] = useState(number || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const appliedRef = useRef('')

  const run = async (raw) => {
    const query = String(raw || '').trim().toUpperCase()
    if (!query) return
    setLoading(true)
    setError('')
    try {
      const res = await trackOrder(query)
      setData(res)
    } catch (err) {
      setData(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const incoming = String(number || '').trim().toUpperCase()
    if (!incoming || incoming === appliedRef.current) return
    appliedRef.current = incoming
    setValue(String(number))
    run(incoming)
  }, [number])

  const submit = (event) => {
    event.preventDefault()
    const query = value.trim().toUpperCase()
    if (!query) {
      setError('Введите номер заказа, например OREH-26-0042')
      return
    }
    appliedRef.current = query
    if (onNumberChange) onNumberChange(query)
    run(query)
  }

  const reached = data ? reachedIndex(data) : -1
  const doneNotes = data?.timeline || []

  return (
    <section id="track" className="bg-cream">
      <div className="mx-auto max-w-wrap px-6 py-16 md:px-10">
        <h2 className="font-display text-h2 text-ink">Где мой заказ</h2>
        <p className="mt-2 text-muted">Введите номер из письма, например OREH-26-0042</p>

        <form onSubmit={submit} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Номер заказа</span>
            <input className={inputCls} value={value} onChange={(event) => setValue(event.target.value)} placeholder="OREH-26-0042" />
          </label>
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-cream disabled:opacity-60">
            <IconClock className="h-4 w-4" /> {loading ? 'Ищем…' : 'Проверить'}
          </button>
        </form>

        {loading && (
          <div className="mt-8 max-w-xl space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-tile bg-hairline" />
            <div className="h-4 w-full animate-pulse rounded-tile bg-hairline" />
            <div className="h-4 w-1/2 animate-pulse rounded-tile bg-hairline" />
          </div>
        )}

        {!loading && error && (
          <p className="mt-8 flex max-w-xl items-start gap-2 rounded-tile border border-caramel/30 bg-caramel/5 p-3 text-caramel text-sm">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        {!loading && data && (
          <div className="mt-8 grid gap-6 rounded-card border border-hairline bg-card p-6 md:grid-cols-[1.2fr_1fr] md:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-ink">Заказ {data.orderNumber || data.number || value.trim().toUpperCase()}</span>
                <span className={cx('rounded-pill px-3 py-1 text-sm font-semibold', data.status === 'cancelled' ? 'bg-caramel/10 text-caramel' : 'bg-olive/10 text-olive')}>{stepLabel(data.status)}</span>
              </div>

              <ol className="mt-6 space-y-5">
                {STEPS.map((step, index) => {
                  const entry = doneNotes.find((row) => row.status === step.key)
                  const passed = index <= reached
                  return (
                    <li key={step.key} className="relative flex gap-3 pl-1">
                      {index < STEPS.length - 1 && (
                        <span className={cx('absolute left-[5px] top-4 h-full w-px', index < reached ? 'bg-caramel' : 'bg-hairline')} />
                      )}
                      <span className={cx('mt-1 h-3 w-3 shrink-0 rounded-full', passed ? 'bg-caramel' : 'bg-hairline')} />
                      <span className="min-w-0">
                        <span className={cx('flex items-center gap-2 text-sm font-semibold', passed ? 'text-ink' : 'text-faint')}>
                          {step.label}
                          {step.key === 'done' && passed && <IconCheck className="h-4 w-4 text-olive" />}
                        </span>
                        {entry?.note && <span className="mt-0.5 block text-sm text-muted">{entry.note}</span>}
                        {entry?.created_at && <span className="mt-0.5 block text-xs text-faint">{formatDate(entry.created_at)}</span>}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="rounded-tile border border-hairline bg-cream p-4">
              <p className="mb-2 text-sm font-semibold text-ink">Состав заказа</p>
              <ul className="space-y-1 text-sm text-muted">
                {(data.items || []).map((item) => (
                  <li key={item.slug || item.name} className="flex justify-between gap-3">
                    <span>{item.name} × {item.qty}</span>
                    {item.price != null && <span className="text-ink">{formatPrice(item.price * item.qty)}</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-hairline pt-3 text-base font-bold text-ink">
                <span>Итого</span>
                <span>{formatPrice(data.total)}</span>
              </p>
              {data.deliveryFee != null && <p className="mt-2 text-xs text-faint">Доставка: {data.deliveryFee ? formatPrice(data.deliveryFee) : 'бесплатно'}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
