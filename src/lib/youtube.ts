const ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/**
 * The video ID from a YouTube link in any common form: youtu.be/ID, watch?v=ID,
 * /shorts/ID, /embed/ID, /live/ID, music.youtube.com. Null when it isn't one.
 */
export function youtubeId(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  let id: string | null = null;
  if (u.hostname === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(u.hostname)) {
    const [, first, second] = u.pathname.split('/');
    if (first === 'watch') id = u.searchParams.get('v');
    else if (first === 'shorts' || first === 'embed' || first === 'live') id = second ?? null;
  }
  return id && ID.test(id) ? id : null;
}

export function thumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
}

/** Whether a video's thumbnail exists: a deleted, private or mistyped video has none. */
export async function thumbnailExists(id: string): Promise<boolean> {
  const res = await fetch(thumbnailUrl(id), { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
  return res.ok;
}

/**
 * Videos that can be shown, with their YouTube ID. A link that isn't YouTube, or a
 * video whose thumbnail can't be fetched, is dropped with a warning instead of failing
 * the build (the build downloads every thumbnail, so a missing one would stop the deploy).
 */
export async function playableVideos<V extends { title: string; url: string }>(
  videos: V[],
  check: (id: string) => Promise<boolean> = thumbnailExists,
): Promise<(V & { youtubeId: string })[]> {
  const results = await Promise.all(
    videos.map(async (v) => {
      const id = youtubeId(v.url);
      if (!id) {
        console.warn(`[videos] Skipping "${v.title}": not a YouTube link (${v.url})`);
        return null;
      }
      let ok = false;
      try {
        ok = await check(id);
      } catch {
        ok = false;
      }
      if (!ok) {
        console.warn(`[videos] Skipping "${v.title}": its YouTube thumbnail could not be fetched (deleted, private or mistyped video?)`);
        return null;
      }
      return { ...v, youtubeId: id };
    }),
  );
  return results.filter((v): v is V & { youtubeId: string } => v !== null);
}
