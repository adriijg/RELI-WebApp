/** Dorsal de una temporada anterior, cuando no coincide con el actual. */
const HISTORICAL_JERSEYS = [
  { playerId: 1, seasonId: 1, competitionId: 3, jerseyNumber: 27 },
];

export function jerseyForSeason(playerId, seasonId, current) {
  const row = HISTORICAL_JERSEYS.find(
    (item) => item.playerId === Number(playerId) && item.seasonId === Number(seasonId),
  );
  return row ? row.jerseyNumber : current;
}

export function jerseyForCompetition(playerId, competitionId, current) {
  const row = HISTORICAL_JERSEYS.find(
    (item) => item.playerId === Number(playerId) && item.competitionId === Number(competitionId),
  );
  return row ? row.jerseyNumber : current;
}
