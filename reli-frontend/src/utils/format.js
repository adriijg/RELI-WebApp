const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parseDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (ISO_DATETIME.test(trimmed) && TIMEZONE_SUFFIX.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = trimmed.match(ISO_DATE);
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isISODateTime(value) {
  return typeof value === 'string' && ISO_DATETIME.test(value.trim());
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return value ?? '—';
  return DATE_FORMATTER.format(date);
}

export function formatTime(value) {
  const date = parseDate(value);
  if (!date) return '';
  return TIME_FORMATTER.format(date);
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return value ?? '—';
  return `${DATE_FORMATTER.format(date)} ${TIME_FORMATTER.format(date)}`;
}

export function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (isISODateTime(value)) return formatDateTime(value);
  if (typeof value === 'string' && ISO_DATE_ONLY.test(value.trim())) return formatDate(value);
  return String(value);
}
