import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import type { z } from 'astro/zod';
import {
  memberSchema,
  releaseSchema,
  showSchema,
  siteSchema,
  videoSchema,
} from '../../src/lib/site-schema';

type Field = { name: string; type: string; list?: boolean; fields?: Field[]; options?: Record<string, unknown> };
type Entry = { name: string; label: string; type: 'collection' | 'file'; path: string; format: string; fields: Field[] };
type Media = { name: string; input: string; output: string; extensions: string[] };

const config = parse(readFileSync(join(process.cwd(), '.pages.yml'), 'utf8')) as {
  media: Media[];
  content: Entry[];
};

/** Peel preprocess pipes, optionals, defaults and arrays down to the inner schema. */
function unwrap(s: z.ZodType): z.ZodType {
  for (;;) {
    const def = (s as unknown as { def: Record<string, unknown> }).def;
    if (def.type === 'pipe') s = def.out as z.ZodType;
    else if (def.type === 'optional' || def.type === 'default' || def.type === 'nullable') s = def.innerType as z.ZodType;
    else if (def.type === 'array') s = def.element as z.ZodType;
    else return s;
  }
}

function shapeOf(s: z.ZodType): Record<string, z.ZodType> {
  const inner = unwrap(s) as unknown as { def: { type: string; shape?: Record<string, z.ZodType> } };
  expect(inner.def.type).toBe('object');
  return inner.def.shape!;
}

/** Field names at every level must equal the zod keys at that level. */
function compare(fields: Field[], schema: z.ZodType, where: string): void {
  const shape = shapeOf(schema);
  expect(fields.map((f) => f.name).sort(), where).toEqual(Object.keys(shape).sort());
  for (const f of fields) {
    if (f.type === 'object') compare(f.fields ?? [], shape[f.name], `${where}.${f.name}`);
  }
}

function allFields(fields: Field[]): Field[] {
  return fields.flatMap((f) => [f, ...allFields(f.fields ?? [])]);
}

const entry = (name: string) => {
  const e = config.content.find((c) => c.name === name);
  if (!e) throw new Error(`.pages.yml has no content entry "${name}"`);
  return e;
};

const schemas = {
  shows: showSchema,
  releases: releaseSchema,
  videos: videoSchema,
  members: memberSchema,
  site: siteSchema,
};

describe('.pages.yml', () => {
  it('declares every schema field for every collection and the site file', () => {
    for (const [name, schema] of Object.entries(schemas)) compare(entry(name).fields, schema, name);
  });

  it('stores collections as YAML frontmatter under src/content and site data as JSON', () => {
    for (const name of ['shows', 'releases', 'videos', 'members']) {
      expect(entry(name)).toMatchObject({ type: 'collection', path: `src/content/${name}`, format: 'yaml-frontmatter' });
    }
    expect(entry('site')).toMatchObject({ type: 'file', path: 'src/data/site.json', format: 'json' });
  });

  it('points every content and media path at something on disk', () => {
    for (const e of config.content) expect(existsSync(join(process.cwd(), e.path)), e.path).toBe(true);
    for (const m of config.media) expect(existsSync(join(process.cwd(), m.input)), m.input).toBe(true);
  });

  it('writes media paths the site can resolve', () => {
    const byName = Object.fromEntries(config.media.map((m) => [m.name, m]));
    expect(byName.images).toMatchObject({ input: 'src/assets/media', output: '/src/assets/media' });
    expect(byName.files).toMatchObject({ input: 'public/files', output: '/files', extensions: ['pdf'] });
  });

  it('stores dates as yyyy-MM-dd', () => {
    const dates = config.content.flatMap((e) => allFields(e.fields)).filter((f) => f.type === 'date');
    expect(dates.map((f) => f.name)).toEqual(["date", "date", "date"]);
    for (const d of dates) expect(d.options?.format).toBe('yyyy-MM-dd');
  });

  it('offers exactly the release types the schema accepts', () => {
    const type = entry('releases').fields.find((f) => f.name === 'type')!;
    expect(type.type).toBe('select');
    const values = (type.options!.values as { name: string }[]).map((v) => v.name);
    expect(values).toEqual(['single', 'ep', 'album']);
  });

  it('uses the images library for every image field and files for the tech rider', () => {
    const fields = config.content.flatMap((e) => allFields(e.fields));
    const images = fields.filter((f) => f.type === 'image');
    expect(images.map((f) => f.name).sort()).toEqual(['cover', 'heroPhoto', 'heroPhotos', 'image', 'photo', 'shareImage']);
    for (const f of images) expect(f.options?.media).toBe('images');
    const rider = fields.find((f) => f.name === 'techRider')!;
    expect(rider).toMatchObject({ type: 'file', options: { media: 'files' } });
  });

  it('makes member order a number', () => {
    expect(entry('members').fields.find((f) => f.name === 'order')?.type).toBe('number');
  });
});
