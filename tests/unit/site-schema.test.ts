import { describe, expect, it } from 'vitest';
import {
  dateString,
  loadSite,
  optionalString,
  optionalUrl,
  showSchema,
  siteSchema,
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
