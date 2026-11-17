export type SectionId = 'music' | 'merch' | 'videos' | 'shows' | 'about';

export const SECTION_LABELS: Record<SectionId, string> = {
  music: 'Music',
  merch: 'Merch',
  videos: 'Videos',
  shows: 'Shows',
  about: 'About',
};

/** Sections that have something to show, in nav order. Empty ones are left out. */
export function sectionsToRender(c: {
  releases: number;
  merch: number;
  videos: number;
  upcomingShows: number;
  members: number;
  shortBio: string;
}): SectionId[] {
  const out: SectionId[] = [];
  if (c.releases > 0) out.push('music');
  if (c.merch > 0) out.push('merch');
  if (c.videos > 0) out.push('videos');
  if (c.upcomingShows > 0) out.push('shows');
  if (c.shortBio.trim() !== '' || c.members > 0) out.push('about');
  return out;
}
