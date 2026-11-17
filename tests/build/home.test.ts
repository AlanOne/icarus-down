import { describe, expect, it } from 'vitest';
import { blank, contentEntries, page, siteData, todayIn, ymd } from './helpers';

const doc = page('index.html');
const today = todayIn(new Date());

describe('home page', () => {
  it('home page has one h1, lang="en", og:image as an absolute https URL', () => {
    expect(doc.querySelectorAll('h1').length).toBe(1);
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    const og = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';
    expect(og).toMatch(/^https:\/\/alanone\.github\.io\/icarus-down\//);
  });

  it('has a title, description, canonical URL and large-image card', () => {
    expect(doc.title).toContain('Icarus Down');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://alanone.github.io/icarus-down/');
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://alanone.github.io/icarus-down/');
    expect(doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
  });

  it('starts with a skip link to the main content', () => {
    const skip = doc.querySelector('body a');
    expect(skip?.getAttribute('href')).toBe('#main');
    expect(doc.getElementById('main')).not.toBeNull();
  });

  it('does not list the seeded past show', () => {
    // Holds for any content: nothing before today (Ljubljana) is in the list.
    const dates = [...doc.querySelectorAll('[data-show-date]')].map((li) => li.getAttribute('data-show-date')!);
    for (const d of dates) expect(d >= today, d).toBe(true);
    expect(doc.body.textContent).not.toContain('PLACEHOLDER past show');
  });

  it('lists every upcoming show in the content, soonest first', () => {
    const expected = contentEntries('shows').map((s) => ymd(s.date)).filter((d) => d >= today).sort();
    const listed = [...doc.querySelectorAll('[data-show-date]')].map((li) => li.getAttribute('data-show-date'));
    expect(listed).toEqual(expected);
  });

  it('every show <li> carries data-show-date', () => {
    const items = doc.querySelectorAll('#shows li');
    for (const li of items) expect(li.getAttribute('data-show-date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('names every ticket link by venue and city', () => {
    for (const a of doc.querySelectorAll('#shows a')) {
      expect(a.textContent?.replace(/\s+/g, ' ').trim()).toMatch(/^Tickets for .+, .+$/);
    }
  });

  it('links each nav item to a section that exists, plus Press', () => {
    const links = [...doc.querySelectorAll('header nav a')].map((a) => a.getAttribute('href')!);
    expect(links.at(-1)).toBe('/icarus-down/press/');
    for (const href of links.slice(0, -1)) {
      const id = href.split('#')[1];
      expect(doc.getElementById(id), href).not.toBeNull();
    }
  });

  it('labels every social link and links booking by email', () => {
    const social = doc.querySelectorAll('footer a[data-social]');
    for (const a of social) {
      expect(a.textContent?.trim()).not.toBe('');
      expect(a.getAttribute('href')).toMatch(/^https:\/\//);
    }
    expect(doc.querySelector('footer a[href^="mailto:"]')).not.toBeNull();
  });

  it('renders a section only when it has content, and links only those in the nav', () => {
    const site = siteData();
    const upcoming = contentEntries('shows').filter((s) => ymd(s.date) >= today).length;
    const expected: Record<string, boolean> = {
      shows: upcoming > 0,
      music: contentEntries('releases').length > 0,
      about: !blank(site.band?.shortBio?.trim?.()) || contentEntries('members').length > 0,
    };
    for (const [id, has] of Object.entries(expected)) {
      expect(Boolean(doc.getElementById(id)), `#${id}`).toBe(has);
      expect(Boolean(doc.querySelector(`header [data-nav="${id}"]`)), `nav ${id}`).toBe(has);
    }
    // Videos can be dropped at build time (bad or deleted links), so: no section without a video.
    const videos = doc.getElementById('videos');
    if (videos) expect(videos.querySelectorAll('a[data-embed]').length).toBeGreaterThan(0);
    expect(Boolean(doc.querySelector('header [data-nav="videos"]'))).toBe(Boolean(videos));
  });

  it('always has the band name in the hero', () => {
    expect(doc.querySelector('.hero h1')?.textContent?.trim()).toBe(siteData().band.name);
  });

  it('shows the SVG logo in the header, named for screen readers, and uses the SVG favicon', () => {
    const home = doc.querySelector('header a.home')!;
    expect(home.getAttribute('aria-label')).toBe(`${siteData().band.name} home`);
    const svg = home.querySelector('svg')!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelectorAll('rect').length).toBe(7); // the seven bars
    expect(home.querySelector('img')).toBeNull();
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/icarus-down/favicon.svg');
  });

  it('loads only the first hero photo with the page; the rest wait for the slideshow', () => {
    const photos = [...doc.querySelectorAll('.hero-photo')];
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0].getAttribute('src')).toMatch(/^\/icarus-down\//);
    expect(photos[0].classList.contains('is-active')).toBe(true);
    for (const p of photos.slice(1)) {
      expect(p.getAttribute('src'), 'later photos must not load with the page').toBeNull();
      expect(p.getAttribute('srcset')).toBeNull();
      expect(p.getAttribute('data-src')).toMatch(/^\/icarus-down\//);
    }
    // A pause control exists whenever there is more than one photo (WCAG 2.2.2).
    expect(Boolean(doc.querySelector('.hero button.hero-pause'))).toBe(photos.length > 1);
  });
});

