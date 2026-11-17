import { describe, expect, it } from 'vitest';
import {
  type Release,
  featuredRelease,
  listenLinks,
  musicOrder,
  releaseStatus,
} from '../../src/lib/releases';

const release = (slug: string, date: string, extra: Partial<Release> = {}): Release => ({
  slug,
  title: slug,
  type: 'single',
  date,
  cover: '/src/assets/media/cover.jpg',
  links: {},
  ...extra,
});

describe('releaseStatus', () => {
  it('is upcoming the day before its date and out on its date', () => {
    const r = release('a', '2026-12-12');
    expect(releaseStatus(r, '2026-12-11')).toBe('upcoming');
    expect(releaseStatus(r, '2026-12-12')).toBe('out');
    expect(releaseStatus(r, '2026-12-13')).toBe('out');
  });
});

describe('featuredRelease', () => {
  it('features the release marked featured over a newer one', () => {
    const rs = [release('ep', '2013-06-17', { featured: true }), release('single', '2013-11-29')];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('ep');
  });

  it('still features an upcoming release over the one marked featured', () => {
    const rs = [release('ep', '2013-06-17', { featured: true }), release('next', '2026-12-12')];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('next');
  });

  it('features the newest of several marked featured', () => {
    const rs = [
      release('old', '2007-12-10', { featured: true }),
      release('ep', '2013-06-17', { featured: true }),
      release('single', '2013-11-29'),
    ];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('ep');
  });

  it('features the nearest upcoming release over a newer out release', () => {
    const rs = [release('old', '2026-06-01'), release('new', '2026-11-01'), release('next', '2026-12-12')];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('next');
  });

  it('features the nearest of several upcoming releases', () => {
    const rs = [release('feb', '2027-02-20'), release('dec', '2026-12-12')];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('dec');
  });

  it('features the next upcoming release once the nearest one is out', () => {
    const rs = [release('dec', '2026-12-12'), release('feb', '2027-02-20')];
    expect(featuredRelease(rs, '2026-12-12')?.slug).toBe('feb');
  });

  it('features the newest out release when none is upcoming', () => {
    const rs = [release('old', '2026-06-01'), release('new', '2026-11-01')];
    expect(featuredRelease(rs, '2026-11-17')?.slug).toBe('new');
  });

  it('returns null with no releases', () => {
    expect(featuredRelease([], '2026-11-17')).toBeNull();
  });
});

describe('musicOrder', () => {
  it('orders music: upcoming soonest first, then out newest first', () => {
    const rs = [
      release('out-old', '2025-03-01'),
      release('up-late', '2027-02-20'),
      release('out-new', '2026-11-01'),
      release('up-soon', '2026-12-12'),
    ];
    expect(musicOrder(rs, '2026-11-17').map((r) => r.slug)).toEqual([
      'up-soon',
      'up-late',
      'out-new',
      'out-old',
    ]);
  });

  it('does not reorder the input array', () => {
    const rs = [release('b', '2025-01-01'), release('a', '2026-01-01')];
    musicOrder(rs, '2026-11-17');
    expect(rs.map((r) => r.slug)).toEqual(['b', 'a']);
  });
});

describe('listenLinks', () => {
  it('lists listen links in platform order and skips missing ones', () => {
    const r = release('a', '2026-01-01', {
      presaveUrl: 'https://distrokid.com/hyperfollow/x',
      links: {
        other: { label: 'Deezer', url: 'https://deezer.com/x' },
        youtubeMusic: 'https://music.youtube.com/x',
        spotify: 'https://open.spotify.com/x',
        bandcamp: 'https://icarusdown.bandcamp.com/x',
      },
    });
    expect(listenLinks(r)).toEqual([
      { label: 'Spotify', url: 'https://open.spotify.com/x' },
      { label: 'Bandcamp', url: 'https://icarusdown.bandcamp.com/x' },
      { label: 'YouTube Music', url: 'https://music.youtube.com/x' },
      { label: 'Deezer', url: 'https://deezer.com/x' },
    ]);
  });

  it('labels Apple Music', () => {
    const r = release('a', '2026-01-01', { links: { appleMusic: 'https://music.apple.com/x' } });
    expect(listenLinks(r)).toEqual([{ label: 'Apple Music', url: 'https://music.apple.com/x' }]);
  });

  it('falls back to a single Listen link to the pre-save URL', () => {
    const r = release('a', '2026-12-12', { presaveUrl: 'https://distrokid.com/hyperfollow/x' });
    expect(listenLinks(r)).toEqual([{ label: 'Listen', url: 'https://distrokid.com/hyperfollow/x' }]);
  });

  it('returns no links when there are neither listen links nor a pre-save URL', () => {
    expect(listenLinks(release('a', '2026-12-12'))).toEqual([]);
  });
});
