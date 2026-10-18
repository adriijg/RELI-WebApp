export const COMPETITION_TYPE_LABELS = {
  LIGA: 'Liga',
  COPA: 'Copa',
};

export const COMPETITION_TYPE_OPTIONS = Object.entries(COMPETITION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
