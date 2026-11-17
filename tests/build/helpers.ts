import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Window } from 'happy-dom';

// ICARUS_FIXTURE=<folder> checks a fixture build (see tests/fixtures/README.md).
const FIXTURE = process.env.ICARUS_FIXTURE;
export const DIST = join(process.cwd(), FIXTURE ? 'dist-fixture' : 'dist');
const CONTENT = join(process.cwd(), FIXTURE ? join(FIXTURE, 'content') : 'src/content');
const SITE_JSON = join(process.cwd(), FIXTURE ? join(FIXTURE, 'site.json') : 'src/data/site.json');

/** The raw site.json the build used (before schema defaults). */
export function siteData(): Record<string, any> {
  return JSON.parse(readFileSync(SITE_JSON, 'utf8'));
}

/** True for a value Pages CMS may leave for "nothing": missing, null or "". */
export const blank = (v: unknown) => v === undefined || v === null || v === '';

export function htmlFiles(dir: string = DIST): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

/** Parse a built page (path relative to dist/) into a DOM document. */
export function page(rel: string): Document {
  // Empty out inline script code: happy-dom's parser misreads minified code such as
  // typeof document<`u` as a tag and swallows the rest of the page. Browsers don't.
  // The tests check markup, never script code; the <script> tags themselves stay.
  const html = readFileSync(join(DIST, rel), 'utf8').replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2');
  const window = new Window({ url: 'https://alanone.github.io/icarus-down/' });
  // DOMParser, not document.write: happy-dom's document.write loses everything after a <dialog>.
  return new window.DOMParser().parseFromString(html, 'text/html') as unknown as Document;
}

/** Today in Ljubljana, the same rule the build uses. */
export { todayIn } from '../../src/lib/dates';

import { parse } from 'yaml';

/** Frontmatter of every entry in a content collection, read straight from disk. */
export function contentEntries(collection: string): Record<string, unknown>[] {
  const dir = join(CONTENT, collection);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(join(dir, f), 'utf8');
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      return { id: f.replace(/\.md$/, ''), ...(parse(fm) as Record<string, unknown>) };
    });
}

/** A frontmatter date as YYYY-MM-DD, whether YAML gave a string or a Date. */
export function ymd(v: unknown): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
}
