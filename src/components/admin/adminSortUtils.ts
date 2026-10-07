/**
 * Date parsing and sorting utility for admin content management.
 * Guarantees that sorting is purely in-memory and non-destructive.
 */

export function parseDateToTime(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;

  // Firebase Timestamp or object with seconds
  if (typeof val === 'object') {
    if ('seconds' in val && typeof val.seconds === 'number') {
      return val.seconds * 1000;
    }
    if (typeof val.toDate === 'function') {
      try {
        return val.toDate().getTime();
      } catch {
        return 0;
      }
    }
  }

  const str = String(val).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return parsed;

  // Check year like "2024" or "2025"
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[0], 10), 0, 1).getTime();
  }

  return 0;
}

export function compareStrings(a?: string | null, b?: string | null, asc: boolean = true): number {
  const strA = (a || '').trim().toLowerCase();
  const strB = (b || '').trim().toLowerCase();
  const res = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
  return asc ? res : -res;
}

export function compareDates(a: any, b: any, desc: boolean = true): number {
  const timeA = parseDateToTime(a);
  const timeB = parseDateToTime(b);
  return desc ? timeB - timeA : timeA - timeB;
}
