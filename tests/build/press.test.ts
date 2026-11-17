import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, contentEntries, htmlFiles, page } from './helpers';

const doc = page('press/index.html');
const site = JSON.parse(readFileSync(join(process.cwd(), 'src/data/site.json'), 'utf8'));
const blank = (v: unknown) => v === undefined || v === null || v === '';

describe('press page', () => {
  it('has one h1 "Press & Booking", its own title and description', () => {
    const h1s = doc.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent?.trim()).toBe('Press & Booking');
    expect(doc.querySelector('meta[property="og:title"]')?.getAttribute('content')).toMatch(/press/i);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://alanone.github.io/icarus-down/press/');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).not.toBe(
      page('index.html').querySelector('meta[name="description"]')?.getAttribute('content'),
    );
  });

  it('marks Press as the current page in the nav', () => {
    expect(doc.querySelector('header nav a[aria-current="page"]')?.getAttribute('href')).toBe('/icarus-down/press/');
  });

  it('press page lists every seeded press photo with a download link', () => {
    const items = doc.querySelectorAll('.press-photos li');
    expect(items.length).toBe(site.press.photos.length);
    items.forEach((li, i) => {
      const photo = site.press.photos[i];
      expect(li.textContent).toContain(photo.caption);
      if (!blank(photo.credit)) expect(li.textContent).toContain(photo.credit);
      const a = li.querySelector('a[download]')!;
      expect(a, `photo ${i} download link`).not.toBeNull();
      const href = a.getAttribute('href')!;
      expect(href).toMatch(/^\/icarus-down\//);
      expect(existsSync(join(DIST, href.replace(/^\/icarus-down\//, ''))), href).toBe(true);
      expect(a.textContent).toMatch(/Download/);
    });
  });

  it('offers the original, full-size file for download', () => {
    // The download is the file as uploaded, not a resized web thumbnail.
    const first = doc.querySelector('.press-photos a[download]')!.getAttribute('href')!;
    const bytes = readFileSync(join(DIST, first.replace(/^\/icarus-down\//, ''))).length;
    expect(bytes).toBeGreaterThan(50_000);
  });

  it('omits the full-resolution link and phone when they are empty', () => {
    const fullRes = [...doc.querySelectorAll('a')].find((a) => /full-resolution/i.test(a.textContent ?? ''));
    expect(Boolean(fullRes)).toBe(!blank(site.press.fullResKitUrl));
    expect(Boolean(doc.querySelector('a[href^="tel:"]'))).toBe(!blank(site.press.bookingPhone));
  });

  it('links the tech rider under /icarus-down/files/', () => {
    const rider = [...doc.querySelectorAll('a')].find((a) => /tech rider/i.test(a.textContent ?? ''));
    expect(rider?.getAttribute('href')).toBe(`/icarus-down${site.press.techRider}`);
    expect(existsSync(join(DIST, site.press.techRider))).toBe(true);
  });

  it('gives the booking email', () => {
    expect(doc.querySelector('main a[href^="mailto:"]')?.getAttribute('href')).toBe(`mailto:${site.press.bookingEmail}`);
  });

  it('shows the long bio and every member', () => {
    const firstPara = site.band.longBio.split(/\n\s*\n/)[0].trim();
    expect(doc.body.textContent).toContain(firstPara);
    for (const m of contentEntries('members')) expect(doc.body.textContent).toContain(m.name as string);
  });
});

describe('whole site', () => {
  it('every root-relative href/src in all pages starts with /icarus-down/', () => {
    // The Task 1 check in output.test.ts covers every page; make sure the press page is one of them.
    const pages = htmlFiles().map((f) => f.slice(DIST.length + 1).replace(/\\/g, '/'));
    expect(pages).toEqual(expect.arrayContaining(['index.html', 'press/index.html']));
  });
});
