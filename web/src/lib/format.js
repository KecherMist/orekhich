// Форматирование цен, дат и склонений в русской раскладке макета.

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('ru-RU');

/** 890 → «890 ₽» (без неразрывного неразрыва как у валютного формата) */
export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return rubFormatter.format(amount).replace(/\u00A0/g, '\u202F');
}

/** 1652 → «1 652» */
export function formatNumber(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return numberFormatter.format(amount);
}

/** 4.83 → «4,9» */
export function formatRating(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toFixed(1).replace('.', ',');
}

export function plural(count, one, few, many) {
  const n = Math.abs(Math.trunc(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function reviewsWord(count) {
  return plural(count, 'отзыв', 'отзыва', 'отзывов');
}

export function productsWord(count) {
  return plural(count, 'позиция', 'позиции', 'позиций');
}

export function packagesWord(count) {
  return plural(count, 'пачка', 'пачки', 'пачек');
}

export function daysWord(count) {
  return plural(count, 'день', 'дня', 'дней');
}

/** 500 → «500 г», 1200 → «1,2 кг» */
export function formatWeight(grams) {
  const g = Number(grams);
  if (!Number.isFinite(g) || g <= 0) return '—';
  if (g < 1000) return `${g} г`;
  const kg = (g / 1000).toFixed(g % 1000 === 0 ? 0 : 1).replace('.', ',');
  return `${kg} кг`;
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const fullDayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** «23 ноября» — для карточек отзывов */
export function formatDate(value) {
  const date = toDate(value);
  return date ? dayFormatter.format(date) : '';
}

/** «23 ноября 2026» — для таймлайна заказа */
export function formatFullDate(value) {
  const date = toDate(value);
  return date ? fullDayFormatter.format(date) : '';
}

/** «13:27» */
export function formatTime(value) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : '';
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;

export function isEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

const PHONE_RE = /^\+?[\d\s()-]{10,19}$/;

export function isPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 12 && PHONE_RE.test(String(value || '').trim());
}

/** «до бесплатной доставки 620 ₽» / null, когда порог пройден */
export function leftForFreeDelivery(subtotal, threshold) {
  const need = Number(threshold) - Number(subtotal);
  return need > 0 ? need : null;
}
