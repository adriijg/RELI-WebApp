export const MATCH_PHASE_LABELS = {
  LIGUILLA: 'Liguilla',
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

export const MATCH_PHASE_ORDER = [
  'LIGUILLA',
  'DIECISEISAVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIFINAL',
  'FINAL',
];

export const MATCH_PHASE_OPTIONS = MATCH_PHASE_ORDER.map((value) => ({
  value,
  label: MATCH_PHASE_LABELS[value],
}));
