import { describe, expect, it, vi } from 'vitest';
import { embedUrl, playableVideos, thumbnailUrl, watchUrl, youtubeId } from '../../src/lib/youtube';

describe('youtubeId', () => {
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc&t=12'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'],
    ['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  '],
  ])('parses %s', (input) => {
    expect(youtubeId(input)).toBe('dQw4w9WgXcQ');
  });

  it.each([
    ['https://vimeo.com/123'],
    ['not a url'],
    [''],
    ['https://www.youtube.com/'],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/@icarusdown'],
    ['https://notyoutube.com/watch?v=dQw4w9WgXcQ'],
  ])('returns null for %s', (input) => {
    expect(youtubeId(input)).toBeNull();
  });
});

describe('thumbnailUrl and embedUrl', () => {
  it('builds the thumbnail URL', () => {
    expect(thumbnailUrl('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('builds the plain YouTube watch URL', () => {
    expect(watchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('builds a no-cookie autoplay embed URL', () => {
    expect(embedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });
});

describe('playableVideos', () => {
  const v = (title: string, url: string) => ({ title, url });
  const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('keeps videos whose thumbnail exists and adds their ID', async () => {
    const out = await playableVideos([v('A', 'https://youtu.be/aaaaaaaaaaa')], async () => true);
    expect(out).toEqual([{ title: 'A', url: 'https://youtu.be/aaaaaaaaaaa', youtubeId: 'aaaaaaaaaaa' }]);
  });

  it('drops a link that is not a YouTube link, with a warning', async () => {
    const warn = quiet();
    const out = await playableVideos([v('Vimeo', 'https://vimeo.com/1')], async () => true);
    expect(out).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Vimeo'));
    warn.mockRestore();
  });

  it('drops a well-formed ID whose video is gone (thumbnail 404), with a warning', async () => {
    const warn = quiet();
    const out = await playableVideos(
      [v('Gone', 'https://youtu.be/deletedvid1'), v('Here', 'https://youtu.be/bbbbbbbbbbb')],
      async (id) => id !== 'deletedvid1',
    );
    expect(out.map((x) => x.title)).toEqual(['Here']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Gone'));
    warn.mockRestore();
  });

  it('drops a video when the check itself fails (network error)', async () => {
    const warn = quiet();
    const out = await playableVideos([v('A', 'https://youtu.be/aaaaaaaaaaa')], async () => {
      throw new Error('offline');
    });
    expect(out).toEqual([]);
    warn.mockRestore();
  });
});

