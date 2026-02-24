/** USD formatter with no decimal places, using compact thousands notation. */
const usdFormatter = new Intl.NumberFormat('en-US', {
  style:                 'currency',
  currency:              'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a salary range as a USD currency string.
 *
 * Examples:
 *   formatSalary(80000, 120000) => "$80,000 - $120,000"
 *   formatSalary(80000, null)   => "$80,000+"
 *   formatSalary(null, 120000)  => "Up to $120,000"
 *   formatSalary(null, null)    => "—"
 *
 * @param min - Minimum salary in whole dollars, or null.
 * @param max - Maximum salary in whole dollars, or null.
 * @returns Formatted salary range string.
 */
export function formatSalary(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `${usdFormatter.format(min)} - ${usdFormatter.format(max)}`;
  }

  if (min !== null) {
    return `${usdFormatter.format(min)}+`;
  }

  if (max !== null) {
    return `Up to ${usdFormatter.format(max)}`;
  }

  return '—';
}
