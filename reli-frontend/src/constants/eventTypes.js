export const EVENT_TYPE_LABELS = {
  INFO: 'Información',
  TRAINING: 'Entrenamiento',
  SOCIAL: 'Social',
  MEETING: 'Reunión',
};

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
