import { describe, expect, it } from 'vitest';
import { embedUrl, thumbnailUrl, youtubeId } from '../../src/lib/youtube';

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

  it('builds a no-cookie autoplay embed URL', () => {
    expect(embedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });
});
