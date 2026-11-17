import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Window } from 'happy-dom';

export const DIST = join(process.cwd(), 'dist');

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
  const html = readFileSync(join(DIST, rel), 'utf8');
  const window = new Window({ url: 'https://alanone.github.io/icarus-down/' });
  window.document.write(html);
  return window.document as unknown as Document;
}

/** Today in Ljubljana, the same rule the build uses. */
export { todayIn } from '../../src/lib/dates';

import { parse } from 'yaml';

/** Frontmatter of every entry in a content collection, read straight from disk. */
export function contentEntries(collection: string): Record<string, unknown>[] {
  const dir = join(process.cwd(), 'src/content', collection);
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
