import { describe, expect, it } from 'vitest';
import { TZ, formatReleaseDate, formatShowDate, isBefore, todayIn } from '../../src/lib/dates';

describe('todayIn', () => {
  it('uses Europe/Ljubljana by default', () => {
    expect(TZ).toBe('Europe/Ljubljana');
  });

  it('is still the 12th at 23:59 Ljubljana time in winter', () => {
    expect(todayIn(new Date('2026-12-12T22:59:00Z'))).toBe('2026-12-12');
  });

  it('turns to the 13th at 00:00 Ljubljana time in winter', () => {
    expect(todayIn(new Date('2026-12-12T23:00:00Z'))).toBe('2026-12-13');
  });

  it('is still the 1st at 23:59 Ljubljana summer time', () => {
    expect(todayIn(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01');
  });

  it('accepts another time zone', () => {
    expect(todayIn(new Date('2026-12-13T04:00:00Z'), 'America/New_York')).toBe('2026-12-12');
  });
});

describe('isBefore', () => {
  it('compares YYYY-MM-DD strings by calendar order', () => {
    expect(isBefore('2026-12-12', '2026-12-13')).toBe(true);
    expect(isBefore('2026-12-13', '2026-12-12')).toBe(false);
    expect(isBefore('2026-12-12', '2026-12-12')).toBe(false);
    expect(isBefore('2026-09-30', '2026-10-01')).toBe(true);
  });
});

describe('formatShowDate', () => {
  it('shows weekday, day and month in the same year', () => {
    expect(formatShowDate('2026-12-12', '2026-11-17')).toBe('Sat 12 Dec');
  });

  it('appends the year when it differs from today', () => {
    expect(formatShowDate('2027-01-09', '2026-11-17')).toBe('Sat 9 Jan 2027');
  });
});

describe('formatReleaseDate', () => {
  it('shows day and month in the same year', () => {
    expect(formatReleaseDate('2026-12-04', '2026-11-17')).toBe('4 Dec');
  });

  it('appends the year when it differs from today', () => {
    expect(formatReleaseDate('2027-02-20', '2026-11-17')).toBe('20 Feb 2027');
  });
});
