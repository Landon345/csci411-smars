/**
 * Parse a date string as local noon to avoid UTC-offset shifting the displayed
 * date. e.g. "2026-02-27T00:00:00.000Z" → local Feb 27, not Feb 26 in UTC-N zones.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.split("T")[0] + "T12:00:00");
}

/** Format a date-only string using the browser's locale (e.g. "2/27/2026"). */
export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString();
}
