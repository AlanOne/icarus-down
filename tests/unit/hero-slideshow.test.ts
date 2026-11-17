// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupHeroSlideshow } from '../../src/scripts/hero-slideshow';

function render(count: number) {
  const slides = Array.from({ length: count }, (_, i) =>
    i === 0
      ? `<img class="hero-photo is-active" src="/p0.jpg" srcset="/p0.jpg 1x" alt="">`
      : `<img class="hero-photo" data-src="/p${i}.jpg" data-srcset="/p${i}.jpg 1x" alt="">`,
  ).join('');
  document.body.innerHTML = `<div class="hero">${slides}<button type="button" class="hero-pause" hidden aria-label="Pause photo slideshow">II</button></div>`;
}

const active = () => [...document.querySelectorAll('.hero-photo')].findIndex((p) => p.classList.contains('is-active'));
const pause = () => document.querySelector<HTMLButtonElement>('.hero-pause')!;
const photo = (i: number) => document.querySelectorAll<HTMLImageElement>('.hero-photo')[i];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('hero slideshow', () => {
  it('shows the next photo every 10 seconds and wraps around', () => {
    render(3);
    setupHeroSlideshow(document, { reducedMotion: false });
    expect(active()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(active()).toBe(1);
    vi.advanceTimersByTime(10_000);
    expect(active()).toBe(2);
    vi.advanceTimersByTime(10_000);
    expect(active()).toBe(0);
  });

  it('loads a photo only shortly before it is shown', () => {
    render(3);
    setupHeroSlideshow(document, { reducedMotion: false });
    expect(photo(1).getAttribute('src')).toBeNull();
    expect(photo(2).getAttribute('src')).toBeNull();
    vi.advanceTimersByTime(8_000);
    expect(photo(1).getAttribute('src')).toBe('/p1.jpg');
    expect(photo(1).getAttribute('srcset')).toBe('/p1.jpg 1x');
    expect(photo(2).getAttribute('src')).toBeNull();
  });

  it('shows the pause button and stops and restarts on it', () => {
    render(3);
    setupHeroSlideshow(document, { reducedMotion: false });
    expect(pause().hidden).toBe(false);
    pause().click();
    expect(pause().getAttribute('aria-label')).toBe('Play photo slideshow');
    expect(pause().getAttribute('aria-pressed')).toBe('true');
    vi.advanceTimersByTime(30_000);
    expect(active()).toBe(0);
    pause().click();
    expect(pause().getAttribute('aria-label')).toBe('Pause photo slideshow');
    vi.advanceTimersByTime(10_000);
    expect(active()).toBe(1);
  });

  it('keeps a still photo for visitors who ask for reduced motion', () => {
    render(3);
    setupHeroSlideshow(document, { reducedMotion: true });
    vi.advanceTimersByTime(30_000);
    expect(active()).toBe(0);
    expect(pause().hidden).toBe(true);
    expect(photo(1).getAttribute('src')).toBeNull();
  });

  it('does nothing with a single photo', () => {
    render(1);
    setupHeroSlideshow(document, { reducedMotion: false });
    vi.advanceTimersByTime(30_000);
    expect(active()).toBe(0);
    expect(pause().hidden).toBe(true);
  });
});
