import { formatDate } from './formatDate';

describe('formatDate', () => {
  describe('valid date strings', () => {
    it('formats a bare ISO date string (YYYY-MM-DD) without timezone shift', () => {
      // Should read the date as local midnight, not UTC midnight,
      // so the displayed day must match the input day regardless of timezone.
      const result = formatDate('2026-02-22');
      expect(result).toBe('Feb 22, 2026');
    });

    it('formats a full ISO 8601 datetime string', () => {
      const result = formatDate('2026-01-15T14:30:00.000Z');
      // The exact hour rendering is timezone-dependent; only verify month/year/structure
      expect(result).toMatch(/Jan \d+, 2026/);
    });

    it('formats January correctly', () => {
      expect(formatDate('2025-01-01')).toBe('Jan 1, 2025');
    });

    it('formats December correctly', () => {
      expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
    });

    it('formats a mid-year date', () => {
      expect(formatDate('2025-07-04')).toBe('Jul 4, 2025');
    });

    it('uses the month abbreviation format (e.g., "Feb" not "February")', () => {
      const result = formatDate('2026-02-14');
      expect(result).toMatch(/^[A-Z][a-z]{2} /);
    });

    it('includes 4-digit year', () => {
      const result = formatDate('2026-02-22');
      expect(result).toMatch(/2026$/);
    });
  });

  describe('null and undefined inputs', () => {
    it('returns empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('returns empty string for a non-date string', () => {
      expect(formatDate('not-a-date')).toBe('');
    });

    it('returns empty string for a malformed date string', () => {
      expect(formatDate('2026-13-45')).toBe('');
    });

    it('returns empty string for a random word', () => {
      expect(formatDate('hello')).toBe('');
    });
  });
});
