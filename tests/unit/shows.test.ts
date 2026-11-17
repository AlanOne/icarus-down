import { describe, expect, it } from 'vitest';
import { todayIn } from '../../src/lib/dates';
import { type Show, upcomingShows } from '../../src/lib/shows';

const show = (slug: string, date: string, venue = 'Kino Šiška'): Show => ({
  slug,
  date,
  venue,
  city: 'Ljubljana',
});

describe('upcomingShows', () => {
  it('keeps a show for the whole of its date and drops it the day after', () => {
    const shows = [show('a', '2026-12-12')];
    expect(upcomingShows(shows, '2026-12-12').map((s) => s.slug)).toEqual(['a']);
    expect(upcomingShows(shows, '2026-12-13')).toEqual([]);
  });

  it('sorts by date, then venue', () => {
    const shows = [
      show('late', '2027-01-09', 'Orto Bar'),
      show('b', '2026-12-12', 'Pekarna'),
      show('a', '2026-12-12', 'MC Celje'),
    ];
    expect(upcomingShows(shows, '2026-11-17').map((s) => s.slug)).toEqual(['a', 'b', 'late']);
  });

  it('does not reorder the input array', () => {
    const shows = [show('b', '2026-12-20'), show('a', '2026-12-12')];
    upcomingShows(shows, '2026-11-17');
    expect(shows.map((s) => s.slug)).toEqual(['b', 'a']);
  });

  it('returns [] for no shows', () => {
    expect(upcomingShows([], '2026-11-17')).toEqual([]);
  });

  it('a New York visitor at 23:00 local on 12 Dec sees the same list as Ljubljana', () => {
    // 2026-12-13T04:00Z is 23:00 on the 12th in New York, 05:00 on the 13th in Ljubljana.
    const shows = [show('a', '2026-12-12'), show('b', '2026-12-13')];
    const today = todayIn(new Date('2026-12-13T04:00:00Z'));
    expect(upcomingShows(shows, today).map((s) => s.slug)).toEqual(['b']);
  });
});
