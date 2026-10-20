/**
 * Calcula la clasificacion completa a partir de los partidos de todas las
 * jornadas (datos FFM). Victoria = 3 pts, empate = 1 pt.
 * Devuelve filas ordenadas: puntos, diferencia, goles a favor, nombre.
 */
function teamKey(code, name) {
  const normalized = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return normalized || (code != null ? `code:${code}` : '');
}

export function computeStandings(rounds, ourCode, upTo = null) {
  const table = new Map();

  const ensure = (code, name) => {
    const key = teamKey(code, name);
    if (!table.has(key)) {
      table.set(key, {
        teamName: name,
        isUs: code != null && String(code) === String(ourCode),
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: '',
      });
    }
    const row = table.get(key);
    if (code != null && String(code) === String(ourCode)) row.isUs = true;
    if (!row.teamName && name) row.teamName = name;
    return row;
  };

  const applyResult = (row, scored, conceded) => {
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    if (scored > conceded) {
      row.won += 1;
      row.points += 3;
      row.form += 'V';
    } else if (scored === conceded) {
      row.drawn += 1;
      row.points += 1;
      row.form += 'E';
    } else {
      row.lost += 1;
      row.form += 'D';
    }
  };

  const ordered = [...rounds]
    .filter((r) => upTo == null || r.round <= upTo)
    .sort((a, b) => a.round - b.round);

  // Primera pasada: registrar todos los equipos aunque no hayan puntuado
  for (const { games } of ordered) {
    for (const g of games || []) {
      ensure(g.homeCode, g.home);
      ensure(g.awayCode, g.away);
    }
  }

  for (const { games } of ordered) {
    for (const g of games || []) {
      if (g.homeGoals == null || g.awayGoals == null) continue;
      const home = ensure(g.homeCode, g.home);
      const away = ensure(g.awayCode, g.away);
      applyResult(home, g.homeGoals, g.awayGoals);
      applyResult(away, g.awayGoals, g.homeGoals);
    }
  }

  return Array.from(table.values())
    .map((row) => ({ ...row, form: row.form.length > 5 ? row.form.slice(-5) : row.form }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName, 'es'),
    );
}
