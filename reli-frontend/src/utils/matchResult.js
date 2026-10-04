// Colores por resultado: verde victoria, amarillo empate, rojo derrota.
export function getMatchOutcome(ourGoals, rivalGoals) {
  if (ourGoals == null || rivalGoals == null) return null;
  if (ourGoals > rivalGoals) return 'win';
  if (ourGoals < rivalGoals) return 'loss';
  return 'draw';
}

export function scoreTextClass(outcome) {
  if (outcome === 'win') return 'text-emerald-500';
  if (outcome === 'draw') return 'text-yellow-500';
  if (outcome === 'loss') return 'text-re-rojo';
  return 'text-muted-foreground';
}

export function scoreBadgeClass(outcome) {
  if (outcome === 'win') return 'bg-emerald-500/15 text-emerald-600';
  if (outcome === 'draw') return 'bg-yellow-500/15 text-yellow-600';
  if (outcome === 'loss') return 'bg-re-rojo/10 text-re-rojo';
  return 'bg-muted/10 text-muted-foreground';
}
