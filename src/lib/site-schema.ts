import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';

/** Pages CMS saves a cleared optional field as "". Treat that as absent. */
const blankToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

/** Missing or null lists and objects count as empty. */
const orEmptyList = (v: unknown) => v ?? [];
const orEmptyObject = (v: unknown) => v ?? {};
const orEmptyText = (v: unknown) => v ?? '';

/**
 * A link pasted without its scheme ("instagram.com/icarusdown") gets https:// added,
 * so a common paste doesn't fail the build. Plain text ("at the door") is left alone
 * and still fails URL validation.
 */
const withScheme = (v: unknown) =>
  typeof v === 'string' && /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]\S*)?$/i.test(v.trim())
    ? `https://${v.trim()}`
    : v;

export const optionalString = z.preprocess(blankToUndefined, z.string().optional());
export const optionalUrl = z.preprocess((v) => withScheme(blankToUndefined(v)), z.url().optional());
const requiredUrl = z.preprocess(withScheme, z.url());

/**
 * A calendar date as YYYY-MM-DD. Unquoted `date: 2026-12-12` in YAML
 * frontmatter arrives as a Date at UTC midnight, so normalize that first.
 */
export const dateString = z.preprocess(
  (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date'),
);

/** A media path as Pages CMS stores it, e.g. "/src/assets/media/Band Photo.JPG". */
const mediaPath = z.string().min(1);
const optionalMediaPath = z.preprocess(blankToUndefined, z.string().optional());

// ---- Collections (frontmatter of src/content/<name>/*.md) ----

export const showSchema = z.object({
  date: dateString,
  venue: z.string().min(1),
  city: z.string().min(1),
  country: optionalString,
  ticketUrl: optionalUrl,
  note: optionalString,
});

const otherLink = z.preprocess(
  (v) => {
    // An "other" link with both fields blank is no link at all.
    if (v === null) return undefined;
    if (v && typeof v === 'object' && !(v as { label?: string }).label && !(v as { url?: string }).url) return undefined;
    return v;
  },
  z.object({ label: z.string().min(1), url: requiredUrl }).optional(),
);

export const releaseSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['single', 'ep', 'album']),
  date: dateString,
  cover: mediaPath,
  presaveUrl: optionalUrl,
  featured: z.preprocess((v) => v ?? false, z.boolean()),
  links: z.preprocess(
    orEmptyObject,
    z.object({
      spotify: optionalUrl,
      appleMusic: optionalUrl,
      bandcamp: optionalUrl,
      youtubeMusic: optionalUrl,
      other: otherLink,
    }),
  ),
});

export const videoSchema = z.object({
  title: z.string().min(1),
  url: requiredUrl,
  date: dateString,
});

export const memberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  photo: optionalMediaPath,
  order: z.number(),
});

// ---- Site data (src/data/site.json) ----

export const siteSchema = z.object({
  band: z.object({
    name: z.string().min(1),
    shortBio: z.preprocess(orEmptyText, z.string()),
    longBio: z.preprocess(orEmptyText, z.string()),
    heroPhoto: mediaPath,
  }),
  press: z.object({
    photos: z.preprocess(
      orEmptyList,
      z.array(z.object({ image: mediaPath, caption: z.string().min(1), credit: optionalString })),
    ),
    fullResKitUrl: optionalUrl,
    techRider: optionalString,
    bookingEmail: z.email(),
    bookingPhone: optionalString,
  }),
  social: z.preprocess(orEmptyObject, z.object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    youtube: optionalUrl,
    spotify: optionalUrl,
    bandcamp: optionalUrl,
    tiktok: optionalUrl,
    other: z.preprocess(orEmptyList, z.array(z.object({ label: z.string().min(1), url: requiredUrl }))),
  })),
  shareImage: mediaPath,
});

export type Site = z.infer<typeof siteSchema>;

/** The parsed band, press and social data. Throws with field paths if it is invalid. */
export function loadSite(): Site {
  // ICARUS_FIXTURE swaps in a test fixture's site.json (see tests/fixtures/README.md).
  const fixture = process.env.ICARUS_FIXTURE;
  const path = fixture ? join(fixture, 'site.json') : 'src/data/site.json';
  return siteSchema.parse(JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')));
}
