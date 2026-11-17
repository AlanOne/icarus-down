import { describe, expect, it } from 'vitest';
import {
  dateString,
  loadSite,
  optionalString,
  optionalUrl,
  showSchema,
  releaseSchema,
  siteSchema,
  videoSchema,
} from '../../src/lib/site-schema';

describe('optional fields', () => {
  it('treats empty-string optional fields as absent', () => {
    const show = showSchema.parse({ date: '2026-12-12', venue: 'Kino Šiška', city: 'Ljubljana', ticketUrl: '', note: '', country: '' });
    expect(show.ticketUrl).toBeUndefined();
    expect(show.note).toBeUndefined();
    expect(show.country).toBeUndefined();
    expect('ticketUrl' in show && show.ticketUrl !== undefined).toBe(false);
  });

  it('accepts a missing optional field', () => {
    expect(optionalString.parse(undefined)).toBeUndefined();
    expect(optionalUrl.parse(undefined)).toBeUndefined();
  });

  it('keeps a real optional value', () => {
    expect(optionalString.parse('free entry')).toBe('free entry');
    expect(optionalUrl.parse('https://tickets.example.com/x')).toBe('https://tickets.example.com/x');
  });

  it('rejects a non-URL ticket link', () => {
    expect(() =>
      showSchema.parse({ date: '2026-12-12', venue: 'Kino Šiška', city: 'Ljubljana', ticketUrl: 'at the door' }),
    ).toThrow();
  });
});

describe('dateString', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(dateString.parse('2026-12-12')).toBe('2026-12-12');
  });

  it('normalizes a date that YAML parsed into a Date', () => {
    // `date: 2026-12-12` unquoted in frontmatter becomes a Date at UTC midnight.
    expect(dateString.parse(new Date('2026-12-12T00:00:00Z'))).toBe('2026-12-12');
  });

  it('rejects a malformed date', () => {
    expect(() => dateString.parse('12.12.2026')).toThrow();
  });
});

describe('site data', () => {
  it('parses the committed site.json', () => {
    const site = loadSite();
    expect(site.band.name).toBe('Icarus Down');
    expect(site.press.photos.length).toBeGreaterThan(0);
  });

  it('treats empty-string social links as absent', () => {
    const site = siteSchema.parse({
      band: { name: 'X', shortBio: 'a', longBio: 'b', heroPhoto: '/src/assets/media/x.jpg' },
      press: { photos: [], bookingEmail: 'booking@example.com', bookingPhone: '', fullResKitUrl: '', techRider: '' },
      social: { instagram: '', tiktok: '' },
      shareImage: '/src/assets/media/x.jpg',
    });
    expect(site.social.instagram).toBeUndefined();
    expect(site.press.bookingPhone).toBeUndefined();
    expect(site.press.fullResKitUrl).toBeUndefined();
    expect(site.press.techRider).toBeUndefined();
  });
});

describe('what Pages CMS might save', () => {
  const minimal = {
    band: { name: 'X', heroPhoto: '/src/assets/media/x.jpg' },
    press: { bookingEmail: 'booking@example.com' },
    social: {},
    shareImage: '/src/assets/media/x.jpg',
  };

  it('accepts missing bios as empty', () => {
    const site = siteSchema.parse(minimal);
    expect(site.band.shortBio).toBe('');
    expect(site.band.longBio).toBe('');
  });

  it('accepts null lists and objects as empty', () => {
    const site = siteSchema.parse({
      ...minimal,
      band: { ...minimal.band, shortBio: null, longBio: null },
      press: { ...minimal.press, photos: null, techRider: null },
      social: { other: null, instagram: null },
    });
    expect(site.press.photos).toEqual([]);
    expect(site.social.other).toEqual([]);
    expect(site.band.shortBio).toBe('');
  });

  it('reads the featured switch, off when missing', () => {
    const base = { title: 'T', type: 'ep', date: '2013-06-17', cover: '/c.jpg' };
    expect(releaseSchema.parse({ ...base, featured: true }).featured).toBe(true);
    expect(releaseSchema.parse(base).featured).toBe(false);
    expect(releaseSchema.parse({ ...base, featured: null }).featured).toBe(false);
  });

  it('accepts null release links', () => {
    const r = releaseSchema.parse({ title: 'T', type: 'single', date: '2026-12-12', cover: '/c.jpg', links: null });
    expect(r.links).toEqual({});
    const r2 = releaseSchema.parse({ title: 'T', type: 'single', date: '2026-12-12', cover: '/c.jpg', links: { other: null } });
    expect(r2.links.other).toBeUndefined();
  });

  it('adds https:// to a link pasted without it', () => {
    expect(optionalUrl.parse('instagram.com/icarusdown')).toBe('https://instagram.com/icarusdown');
    expect(optionalUrl.parse('www.facebook.com/icarusdown/')).toBe('https://www.facebook.com/icarusdown/');
    expect(videoSchema.parse({ title: 'V', url: 'youtu.be/dQw4w9WgXcQ', date: '2026-01-01' }).url).toBe('https://youtu.be/dQw4w9WgXcQ');
  });

  it('still rejects text that is not a link', () => {
    expect(() => optionalUrl.parse('at the door')).toThrow();
    expect(() => optionalUrl.parse('tba')).toThrow();
  });
});

describe('social links', () => {
  it('accepts X, SoundCloud, Apple Music and YouTube Music links', () => {
    const site = siteSchema.parse({
      band: { name: 'X', heroPhoto: '/x.jpg' },
      press: { bookingEmail: 'booking@example.com' },
      social: {
        x: 'https://x.com/downicarusdown',
        soundcloud: 'https://soundcloud.com/icarusdown',
        appleMusic: 'https://music.apple.com/artist/377093146',
        youtubeMusic: 'https://music.youtube.com/channel/UCzfoJmU-sCNtaBx_LfwlWlg',
      },
      shareImage: '/x.jpg',
    });
    expect(site.social.x).toBe('https://x.com/downicarusdown');
    expect(site.social.soundcloud).toBe('https://soundcloud.com/icarusdown');
    expect(site.social.appleMusic).toBe('https://music.apple.com/artist/377093146');
    expect(site.social.youtubeMusic).toBe('https://music.youtube.com/channel/UCzfoJmU-sCNtaBx_LfwlWlg');
  });
});

describe('hero slideshow photos', () => {
  const base = {
    band: { name: 'X', heroPhoto: '/a.jpg' },
    press: { bookingEmail: 'booking@example.com' },
    social: {},
    shareImage: '/a.jpg',
  };

  it('reads a list of photos for the slideshow', () => {
    const site = siteSchema.parse({ ...base, band: { ...base.band, heroPhotos: ['/b.jpg', '/c.jpg'] } });
    expect(site.band.heroPhotos).toEqual(['/b.jpg', '/c.jpg']);
  });

  it('treats a missing or empty list as none, and drops blank entries', () => {
    expect(siteSchema.parse(base).band.heroPhotos).toEqual([]);
    expect(siteSchema.parse({ ...base, band: { ...base.band, heroPhotos: null } }).band.heroPhotos).toEqual([]);
    expect(siteSchema.parse({ ...base, band: { ...base.band, heroPhotos: ['/b.jpg', ''] } }).band.heroPhotos).toEqual(['/b.jpg']);
  });
});

