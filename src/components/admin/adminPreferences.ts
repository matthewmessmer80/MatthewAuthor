/**
 * Safe local storage utility for remembering administrator preferences
 * (sort order, active filter selections, search state).
 * Does not store any sensitive data.
 */

export function getAdminPreference<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(`admin_pref_${key}`);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setAdminPreference<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`admin_pref_${key}`, JSON.stringify(value));
  } catch {
    // Non-fatal if storage quota is exceeded or in privacy mode
  }
}

export function clearAdminPreference(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`admin_pref_${key}`);
  } catch {}
}
