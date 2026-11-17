// Astro-only: everything the pages render, loaded once with build-day dates applied.
import { loadMembers, loadReleases, loadShows, loadVideos } from './content';
import { todayIn } from './dates';
import { sectionsToRender } from './sections';
import { upcomingShows } from './shows';
import { loadSite } from './site-schema';
import { playableVideos } from './youtube';

export async function loadPageData() {
  const site = loadSite();
  const today = todayIn(new Date());
  const shows = upcomingShows(await loadShows(), today);
  const releases = await loadReleases();
  const members = await loadMembers();

  // Links that aren't YouTube, and videos that are gone, are left out rather than failing the build.
  const videos = await playableVideos(await loadVideos());

  const sections = sectionsToRender({
    releases: releases.length,
    videos: videos.length,
    upcomingShows: shows.length,
    members: members.length,
    shortBio: site.band.shortBio,
  });

  return { site, today, shows, releases, members, videos, sections };
}
