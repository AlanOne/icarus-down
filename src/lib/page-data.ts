// Astro-only: everything the pages render, loaded once with build-day dates applied.
import { loadMembers, loadReleases, loadShows, loadVideos } from './content';
import { todayIn } from './dates';
import { sectionsToRender } from './sections';
import { upcomingShows } from './shows';
import { loadSite } from './site-schema';
import { youtubeId } from './youtube';

export async function loadPageData() {
  const site = loadSite();
  const today = todayIn(new Date());
  const shows = upcomingShows(await loadShows(), today);
  const releases = await loadReleases();
  const members = await loadMembers();

  // A video whose link isn't a YouTube link is left out rather than shown broken.
  const videos = (await loadVideos()).flatMap((v) => {
    const id = youtubeId(v.url);
    if (!id) {
      console.warn(`[videos] Skipping "${v.title}": not a YouTube link (${v.url})`);
      return [];
    }
    return [{ ...v, youtubeId: id }];
  });

  const sections = sectionsToRender({
    releases: releases.length,
    videos: videos.length,
    upcomingShows: shows.length,
    members: members.length,
    shortBio: site.band.shortBio,
  });

  return { site, today, shows, releases, members, videos, sections };
}
