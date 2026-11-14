// Tiny localStorage "fetched recently?" helper. Used to skip repeat Firestore
// reads of rarely-changing data (catalog toggles, settings, leaderboard)
// when a student reloads or re-opens a page within the freshness window.
const PREFIX = 'hcq_fetched_';

export const CATALOG_TTL_MS = 15 * 60 * 1000;

export const isFresh = (key: string, ttlMs: number = CATALOG_TTL_MS): boolean => {
  try {
    const at = Number(localStorage.getItem(PREFIX + key) || 0);
    return at > 0 && Date.now() - at < ttlMs;
  } catch {
    return false;
  }
};

export const markFetched = (key: string): void => {
  try {
    localStorage.setItem(PREFIX + key, String(Date.now()));
  } catch {
    // ignore
  }
};
