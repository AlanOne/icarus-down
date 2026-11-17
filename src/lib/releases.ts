import { isBefore } from './dates';

export type ReleaseLinks = {
  spotify?: string;
  appleMusic?: string;
  bandcamp?: string;
  youtubeMusic?: string;
  other?: { label: string; url: string };
};

export type Release = {
  slug: string;
  title: string;
  type: 'single' | 'ep' | 'album';
  date: string;
  cover: string;
  presaveUrl?: string;
  links: ReleaseLinks;
  /** Feature on the home page once it's out (an upcoming release still comes first). */
  featured?: boolean;
};

export type ListenLink = { label: string; url: string };

/** "upcoming" while the release date is after today, "out" from that date on. */
export function releaseStatus(r: Release, today: string): 'upcoming' | 'out' {
  return isBefore(today, r.date) ? 'upcoming' : 'out';
}

const byDateAsc = (a: Release, b: Release) => a.date.localeCompare(b.date);
const byDateDesc = (a: Release, b: Release) => b.date.localeCompare(a.date);

/** Upcoming releases, soonest first, then released ones, newest first. */
export function musicOrder(rs: Release[], today: string): Release[] {
  const upcoming = rs.filter((r) => releaseStatus(r, today) === 'upcoming').sort(byDateAsc);
  const out = rs.filter((r) => releaseStatus(r, today) === 'out').sort(byDateDesc);
  return [...upcoming, ...out];
}

/**
 * The release for the home page hero: the nearest upcoming one, else the newest one
 * marked featured, else the newest one that is out, else null.
 */
export function featuredRelease(rs: Release[], today: string): Release | null {
  const ordered = musicOrder(rs, today);
  const upcoming = ordered.find((r) => releaseStatus(r, today) === 'upcoming');
  return upcoming ?? ordered.find((r) => r.featured) ?? ordered[0] ?? null;
}

/**
 * Listen buttons in platform order. With no platform links yet, a pre-save URL
 * stands in as "Listen", since pre-save pages redirect to the release once it's out.
 */
export function listenLinks(r: Release): ListenLink[] {
  const { spotify, appleMusic, bandcamp, youtubeMusic, other } = r.links;
  const links: ListenLink[] = [];
  if (spotify) links.push({ label: 'Spotify', url: spotify });
  if (appleMusic) links.push({ label: 'Apple Music', url: appleMusic });
  if (bandcamp) links.push({ label: 'Bandcamp', url: bandcamp });
  if (youtubeMusic) links.push({ label: 'YouTube Music', url: youtubeMusic });
  if (other?.label && other.url) links.push({ label: other.label, url: other.url });
  if (links.length === 0 && r.presaveUrl) links.push({ label: 'Listen', url: r.presaveUrl });
  return links;
}
