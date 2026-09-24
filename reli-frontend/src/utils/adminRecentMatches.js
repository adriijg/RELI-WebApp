const STORAGE_KEY = 'reli-admin-recent-matches-v1';
const MAX_RECENT = 10;

function readRecentMatches() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function rememberAdminMatch(match) {
  if (!match?.id) return;
  const current = readRecentMatches().filter((item) => String(item.id) !== String(match.id));
  const entry = { ...match, lastManagedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current].slice(0, MAX_RECENT)));
}

export function getRecentAdminMatches() {
  return readRecentMatches();
}
