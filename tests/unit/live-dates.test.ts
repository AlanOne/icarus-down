// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyLiveDates } from '../../src/scripts/live-dates';

// 23:00 UTC is midnight in Ljubljana in winter.
const at = (iso: string) => new Date(iso);

function render(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

const shows = (...dates: string[]) => `
  <nav><ul><li data-nav="shows"><a href="#shows">Shows</a></li></ul></nav>
  <section id="shows"><ol>
    ${dates.map((d) => `<li data-show-date="${d}">${d}</li>`).join('')}
  </ol></section>`;

const release = (slug: string, date: string, built: 'upcoming' | 'out', extra = '') => `
  <div ${extra} data-release="${slug}" data-release-date="${date}">
    <div data-state="upcoming" ${built === 'upcoming' ? '' : 'hidden'}>Out ${date}</div>
    <div data-state="out" ${built === 'out' ? '' : 'hidden'}>Listen</div>
  </div>`;

const isHidden = (sel: string) => (document.querySelector(sel) as HTMLElement).hidden;

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('applyLiveDates', () => {
  it('hides a show the day after its date, in Ljubljana time', () => {
    const root = render(shows('2026-12-12', '2026-12-20'));
    applyLiveDates(root, at('2026-12-12T23:00:00Z')); // 00:00 on the 13th in Ljubljana
    expect(isHidden('[data-show-date="2026-12-12"]')).toBe(true);
    expect(isHidden('[data-show-date="2026-12-20"]')).toBe(false);
  });

  it('keeps a show visible at 23:59 Ljubljana on its date', () => {
    const root = render(shows('2026-12-12'));
    applyLiveDates(root, at('2026-12-12T22:59:00Z'));
    expect(isHidden('[data-show-date="2026-12-12"]')).toBe(false);
  });

  it('hides it for a New York visitor whose clock still says the 12th', () => {
    const root = render(shows('2026-12-12', '2026-12-20'));
    applyLiveDates(root, at('2026-12-13T04:00:00Z')); // 23:00 on the 12th in New York
    expect(isHidden('[data-show-date="2026-12-12"]')).toBe(true);
  });

  it('switches a release from upcoming to out on its date', () => {
    const root = render(release('a', '2026-12-12', 'upcoming'));
    applyLiveDates(root, at('2026-12-11T23:00:00Z')); // 00:00 on the 12th
    expect(isHidden('[data-state="upcoming"]')).toBe(true);
    expect(isHidden('[data-state="out"]')).toBe(false);
  });

  it('leaves a release upcoming the day before', () => {
    const root = render(release('a', '2026-12-12', 'upcoming'));
    applyLiveDates(root, at('2026-12-11T22:59:00Z'));
    expect(isHidden('[data-state="upcoming"]')).toBe(false);
    expect(isHidden('[data-state="out"]')).toBe(true);
  });

  it('moves the hero to the next upcoming release when the featured one comes out', () => {
    const root = render(
      release('dec', '2026-12-12', 'upcoming', 'data-hero-candidate') +
        release('feb', '2027-02-20', 'upcoming', 'data-hero-candidate hidden') +
        release('may', '2026-05-15', 'out', 'data-hero-candidate hidden'),
    );
    applyLiveDates(root, at('2026-12-12T10:00:00Z'));
    expect(isHidden('[data-hero-candidate][data-release="dec"]')).toBe(true);
    expect(isHidden('[data-hero-candidate][data-release="feb"]')).toBe(false);
    expect(isHidden('[data-hero-candidate][data-release="may"]')).toBe(true);
  });

  it('features the newest out release once nothing is upcoming', () => {
    const root = render(
      release('dec', '2026-12-12', 'upcoming', 'data-hero-candidate') +
        release('may', '2026-05-15', 'out', 'data-hero-candidate hidden'),
    );
    applyLiveDates(root, at('2026-12-20T10:00:00Z'));
    expect(isHidden('[data-hero-candidate][data-release="dec"]')).toBe(false);
    expect(isHidden('[data-hero-candidate][data-release="may"]')).toBe(true);
  });

  it('hides the shows section and its nav link when every show is past', () => {
    const root = render(shows('2026-12-12', '2026-12-13'));
    applyLiveDates(root, at('2026-12-14T10:00:00Z'));
    expect(isHidden('#shows')).toBe(true);
    expect(isHidden('[data-nav="shows"]')).toBe(true);
  });

  it('keeps the shows section while one show is left', () => {
    const root = render(shows('2026-12-12', '2026-12-20'));
    applyLiveDates(root, at('2026-12-14T10:00:00Z'));
    expect(isHidden('#shows')).toBe(false);
    expect(isHidden('[data-nav="shows"]')).toBe(false);
  });

  it('is a no-op on markup without data attributes', () => {
    const html = '<main><h1>Icarus Down</h1><p>Hello</p></main>';
    const root = render(html);
    applyLiveDates(root, at('2026-12-14T10:00:00Z'));
    expect(document.body.innerHTML).toBe(html);
  });
});
