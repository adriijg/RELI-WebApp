const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

export function isISODateTime(value) {
  return typeof value === 'string' && ISO_DATETIME.test(value);
}

export function formatDate(value) {
  if (!isISODateTime(value)) return value ?? '—';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!isISODateTime(value)) return value ?? '—';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (isISODateTime(value)) return formatDateTime(value);
  return String(value);
}
