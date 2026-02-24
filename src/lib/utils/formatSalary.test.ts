import { formatSalary } from './formatSalary';

describe('formatSalary', () => {
  describe('both min and max provided', () => {
    it('formats a full range as "$min - $max"', () => {
      expect(formatSalary(80000, 120000)).toBe('$80,000 - $120,000');
    });

    it('formats equal min and max values', () => {
      expect(formatSalary(100000, 100000)).toBe('$100,000 - $100,000');
    });

    it('formats small salary range', () => {
      expect(formatSalary(0, 50000)).toBe('$0 - $50,000');
    });

    it('formats large salary values with thousands separators', () => {
      expect(formatSalary(150000, 250000)).toBe('$150,000 - $250,000');
    });
  });

  describe('only min provided', () => {
    it('formats as "$min+"', () => {
      expect(formatSalary(80000, null)).toBe('$80,000+');
    });

    it('formats zero minimum as "$0+"', () => {
      expect(formatSalary(0, null)).toBe('$0+');
    });
  });

  describe('only max provided', () => {
    it('formats as "Up to $max"', () => {
      expect(formatSalary(null, 120000)).toBe('Up to $120,000');
    });

    it('formats as "Up to $0" when max is zero', () => {
      expect(formatSalary(null, 0)).toBe('Up to $0');
    });
  });

  describe('neither min nor max provided', () => {
    it('returns an em dash placeholder when both are null', () => {
      expect(formatSalary(null, null)).toBe('—');
    });
  });

  describe('currency formatting', () => {
    it('does not include decimal places', () => {
      // No cents — minimumFractionDigits and maximumFractionDigits are 0
      const result = formatSalary(80000, 120000);
      expect(result).not.toMatch(/\.\d{2}/);
    });

    it('uses USD currency symbol', () => {
      expect(formatSalary(80000, null)).toMatch(/^\$/);
    });
  });
});
