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
