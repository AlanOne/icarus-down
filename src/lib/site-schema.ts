import { z } from 'astro/zod';
import siteJson from '../data/site.json';

/** Pages CMS saves a cleared optional field as "". Treat that as absent. */
const blankToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

export const optionalString = z.preprocess(blankToUndefined, z.string().optional());
export const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

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
    if (v && typeof v === 'object' && !(v as { label?: string }).label && !(v as { url?: string }).url) return undefined;
    return v;
  },
  z.object({ label: z.string().min(1), url: z.url() }).optional(),
);

export const releaseSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['single', 'ep', 'album']),
  date: dateString,
  cover: mediaPath,
  presaveUrl: optionalUrl,
  links: z
    .object({
      spotify: optionalUrl,
      appleMusic: optionalUrl,
      bandcamp: optionalUrl,
      youtubeMusic: optionalUrl,
      other: otherLink,
    })
    .default({}),
});

export const videoSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
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
    shortBio: z.string(),
    longBio: z.string(),
    heroPhoto: mediaPath,
  }),
  press: z.object({
    photos: z
      .array(z.object({ image: mediaPath, caption: z.string().min(1), credit: optionalString }))
      .default([]),
    fullResKitUrl: optionalUrl,
    techRider: optionalString,
    bookingEmail: z.email(),
    bookingPhone: optionalString,
  }),
  social: z.object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    youtube: optionalUrl,
    spotify: optionalUrl,
    bandcamp: optionalUrl,
    tiktok: optionalUrl,
    other: z
      .array(z.object({ label: z.string().min(1), url: z.url() }))
      .default([]),
  }),
  shareImage: mediaPath,
});

export type Site = z.infer<typeof siteSchema>;

/** The parsed band, press and social data. Throws with field paths if it is invalid. */
export function loadSite(): Site {
  return siteSchema.parse(siteJson);
}
