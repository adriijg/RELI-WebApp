import { getMatches } from '../services/api';

export const MATCH_DURATION_MS = 150 * 60 * 1000;

const CACHE_KEY = 're-home-matches-v2';
const CACHE_TTL = 60_000; // 1 min
let memoryCache = null;
let memoryAt = 0;

export async function fetchHomeMatches() {
  const now = Date.now();
  // memoria instantánea
  if (memoryCache && now - memoryAt < CACHE_TTL) return memoryCache;
  // sessionStorage para recarga instantánea
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.at && now - parsed.at < CACHE_TTL && Array.isArray(parsed.data)) {
        memoryCache = parsed.data;
        memoryAt = parsed.at;
        // revalida en background sin bloquear
        getMatches({ page: 0, size: 500, sortBy: 'date', direction: 'desc' }).then((data) => {
          const list = data?.content ?? (Array.isArray(data) ? data : []);
          memoryCache = list;
          memoryAt = Date.now();
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: memoryAt, data: list }));
        }).catch(() => {});
        return parsed.data;
      }
    }
  } catch {}
  const data = await getMatches({ page: 0, size: 500, sortBy: 'date', direction: 'desc' });
  const list = data?.content ?? (Array.isArray(data) ? data : []);
  memoryCache = list;
  memoryAt = now;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: now, data: list })); } catch {}
  return list;
}

export function isMatchLive(match, now = Date.now()) {
  if (!match?.date) return false;
  if (match.status === 'IN_PROGRESS') return true;
  if (match.status !== 'SCHEDULED') return false;
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
