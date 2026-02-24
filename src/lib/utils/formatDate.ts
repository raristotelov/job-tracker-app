/**
 * Formats an ISO 8601 date string (or timestamptz) into a human-readable
 * display format (e.g. "Feb 22, 2026").
 *
 * @param dateString - ISO 8601 date or datetime string, or a nullish value.
 * @returns Formatted date string, or an empty string when input is falsy or unparseable.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  // Append a time component when the input is a bare date (YYYY-MM-DD) so that
  // the Date constructor treats it as local time rather than UTC midnight,
  // preventing off-by-one-day errors in timezones west of UTC.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())
    ? `${dateString}T00:00:00`
    : dateString;

  const date = new Date(normalized);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}
