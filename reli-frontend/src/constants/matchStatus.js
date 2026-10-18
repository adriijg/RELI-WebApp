export const STATUS_LABELS = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
  POSTPONED: 'Aplazado',
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
