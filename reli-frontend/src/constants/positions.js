export const POSITION_LABELS = {
  PORTERO: 'Portero',
  CIERRE: 'Cierre',
  ALA: 'Ala',
  PIVOT: 'Pívot',
};

export const POSITION_OPTIONS = Object.entries(POSITION_LABELS).map(([value, label]) => ({
  value,
  label,
}));
