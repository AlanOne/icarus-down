import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, htmlFiles } from './helpers';

/** Every root-relative URL in href, src and srcset attributes. */
function rootRelativeUrls(html: string): string[] {
  const found: string[] = [];
  for (const m of html.matchAll(/\s(?:href|src)=["']?(\/[^"'\s>]*)/g)) found.push(m[1]);
  for (const m of html.matchAll(/\ssrcset=["']([^"']*)["']/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith('/')) found.push(u);
    }
  }
  return found;
}

describe('built site', () => {
  it('has been built (run npm run build first)', () => {
    expect(existsSync(DIST)).toBe(true);
    expect(htmlFiles(DIST).length).toBeGreaterThan(0);
  });

  it('prefixes every root-relative href and src with /icarus-down/', () => {
    const offenders: string[] = [];
    for (const file of htmlFiles(DIST)) {
      const html = readFileSync(file, 'utf8');
      for (const u of rootRelativeUrls(html)) {
        if (!u.startsWith('/icarus-down/')) offenders.push(`${relative(DIST, file)}: ${u}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
