import { getMatches } from '../services/api';

export const MATCH_DURATION_MS = 150 * 60 * 1000;

export async function fetchHomeMatches() {
  const data = await getMatches({ page: 0, size: 100, sortBy: 'date', direction: 'asc' });
  return data?.content ?? (Array.isArray(data) ? data : []);
}

export function isMatchLive(match, now = Date.now()) {
  if (!match?.date) return false;
  if (match.status !== 'SCHEDULED' && match.status !== 'IN_PROGRESS') return false;
  const start = new Date(match.date).getTime();
  if (Number.isNaN(start)) return false;
  return start <= now && now - start <= MATCH_DURATION_MS;
}

export function pickFeaturedMatch(matches) {
  const now = Date.now();
  const live = matches
    .filter((m) => isMatchLive(m, now))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (live) return live;

  const future = matches
    .filter(
      (m) =>
        m.status === 'SCHEDULED' &&
        m.date &&
        new Date(m.date).getTime() >= now - 60_000
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (future.length) return future[0];

  const tbd = matches.find((m) => m.status === 'SCHEDULED' && !m.date);
  return tbd ?? null;
}

export function selectCarouselMatches(matches, featured) {
  const now = Date.now();
  return matches
    .filter(
      (m) =>
        m.status === 'SCHEDULED' &&
        m.date &&
        new Date(m.date).getTime() > now &&
        m.id !== featured?.id
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
