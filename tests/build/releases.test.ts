import { describe, expect, it } from 'vitest';
import { contentEntries, page, todayIn, ymd } from './helpers';

const doc = page('index.html');
const today = todayIn(new Date());
const releases = contentEntries('releases').map((r) => ({
  id: r.id as string,
  date: ymd(r.date),
  presaveUrl: (r.presaveUrl as string) || undefined,
}));
const byId = new Map(releases.map((r) => [r.id, r]));

const visible = (el: Element) => !el.closest('[hidden]');

describe('releases', () => {
  it('shows the right state for every release block on build day', () => {
    const blocks = doc.querySelectorAll('[data-release-date]');
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const date = block.getAttribute('data-release-date')!;
      const want = date > today ? 'upcoming' : 'out';
      const other = want === 'upcoming' ? 'out' : 'upcoming';
      expect(block.querySelector(`[data-state="${want}"]`)?.hasAttribute('hidden'), date).toBe(false);
      expect(block.querySelector(`[data-state="${other}"]`)?.hasAttribute('hidden'), date).toBe(true);
    }
  });

  it('renders the seeded upcoming release with Pre-save visible and listen buttons hidden', () => {
    // For any content: every upcoming release with a pre-save link shows it, and hides its listen buttons.
    const upcoming = releases.filter((r) => r.date > today && r.presaveUrl);
    expect(upcoming.length, 'seed content should include an upcoming release with a pre-save link').toBeGreaterThan(0);
    for (const r of upcoming) {
      const block = doc.querySelector(`#music [data-release="${r.id}"]`)!;
      const presave = [...block.querySelectorAll('[data-state="upcoming"] a')].find((a) => a.textContent?.includes('Pre-save'));
      expect(presave?.getAttribute('href')).toBe(r.presaveUrl);
      expect(block.querySelector('[data-state="out"]')?.hasAttribute('hidden')).toBe(true);
    }
  });

  it('lists music with upcoming releases first, soonest first, then newest out', () => {
    const order = [...doc.querySelectorAll('#music [data-release]')].map((el) => el.getAttribute('data-release'));
    const up = releases.filter((r) => r.date > today).sort((a, b) => a.date.localeCompare(b.date));
    const out = releases.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date));
    expect(order).toEqual([...up, ...out].map((r) => r.id));
  });

  it('features exactly one release in the hero: the nearest upcoming, else the newest out', () => {
    const shown = [...doc.querySelectorAll('[data-hero-candidate]')].filter(visible);
    expect(shown.length).toBe(1);
    const up = releases.filter((r) => r.date > today).sort((a, b) => a.date.localeCompare(b.date));
    const out = releases.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date));
    expect(shown[0].getAttribute('data-release')).toBe((up[0] ?? out[0]).id);
  });

  it('offers every upcoming release and the newest out release as hero candidates', () => {
    const candidates = [...doc.querySelectorAll('[data-hero-candidate]')].map((el) => el.getAttribute('data-release')).sort();
    const up = releases.filter((r) => r.date > today);
    const newestOut = releases.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0];
    expect(candidates).toEqual([...up, ...(newestOut ? [newestOut] : [])].map((r) => r.id).sort());
    for (const c of doc.querySelectorAll('[data-hero-candidate]')) expect(byId.has(c.getAttribute('data-release')!)).toBe(true);
  });
});

describe('links and third parties', () => {
  it('renders no anchor with an empty href', () => {
    for (const a of doc.querySelectorAll('a')) {
      expect(a.hasAttribute('href'), a.outerHTML).toBe(true);
      expect(a.getAttribute('href')!.trim(), a.outerHTML).not.toBe('');
    }
  });

  it('makes no request to youtube.com, youtube-nocookie.com or ytimg.com before interaction', () => {
    expect(doc.querySelectorAll('iframe').length).toBe(0);
    const hosts = /youtube\.com|youtube-nocookie\.com|ytimg\.com|youtu\.be/;
    for (const el of doc.querySelectorAll('img, source, link, script')) {
      for (const attr of ['src', 'srcset', 'href']) {
        expect(el.getAttribute(attr) ?? '', el.outerHTML).not.toMatch(hosts);
      }
    }
  });

  it('gives each video a play button named after the video', () => {
    const buttons = doc.querySelectorAll('#videos button[data-embed]');
    expect(buttons.length).toBe(contentEntries('videos').length);
    for (const b of buttons) {
      expect(b.getAttribute('aria-label')).toMatch(/^Play video: .+/);
      expect(b.getAttribute('data-embed')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?autoplay=1$/);
    }
  });
});
