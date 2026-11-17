import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, page } from './helpers';

const fileSize = (href: string) => statSync(join(DIST, href.replace(/^\/icarus-down\//, ''))).size;

describe('page weight', () => {
  it('home page HTML + CSS + JS + images above the fold stay under 500 KB', () => {
    const doc = page('index.html');
    const parts: [string, number][] = [['index.html', statSync(join(DIST, 'index.html')).size]];

    for (const l of doc.querySelectorAll('link[rel="stylesheet"]')) parts.push([l.getAttribute('href')!, fileSize(l.getAttribute('href')!)]);
    for (const s of doc.querySelectorAll('script[src]')) parts.push([s.getAttribute('src')!, fileSize(s.getAttribute('src')!)]);

    // Above the fold: the hero photo at its largest size, the logo, and the featured cover.
    const hero = doc.querySelector('.hero-photo')!;
    const largest = hero
      .getAttribute('srcset')!
      .split(',')
      .map((c) => c.trim().split(/\s+/))
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))[0][0];
    parts.push([largest, fileSize(largest)]);
    for (const img of doc.querySelectorAll('.site-header img, .hero-release:not([hidden]) img')) {
      parts.push([img.getAttribute('src')!, fileSize(img.getAttribute('src')!)]);
    }

    const total = parts.reduce((sum, [, n]) => sum + n, 0);
    expect(total, parts.map(([f, n]) => `${f}: ${(n / 1024).toFixed(1)} KB`).join('\n')).toBeLessThan(500 * 1024);
  });

  it('serves fonts from the site itself, not a third party', () => {
    const css = [...page('index.html').querySelectorAll('link[rel="stylesheet"]')]
      .map((l) => readFileSync(join(DIST, l.getAttribute('href')!.replace(/^\/icarus-down\//, '')), 'utf8'))
      .join('\n');
    expect(css).toMatch(/@font-face/);
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });
});
