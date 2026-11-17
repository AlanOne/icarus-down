import { describe, expect, it } from 'vitest';
import { sectionsToRender } from '../../src/lib/sections';

const none = { releases: 0, merch: 0, videos: 0, upcomingShows: 0, members: 0, shortBio: '' };

describe('sectionsToRender', () => {
  it('omits sections with no content, in nav order', () => {
    expect(sectionsToRender({ ...none, releases: 2 })).toEqual(['music']);
  });

  it('lists every section with content in nav order', () => {
    expect(
      sectionsToRender({ releases: 1, merch: 5, videos: 2, upcomingShows: 3, members: 4, shortBio: 'Hi' }),
    ).toEqual(['music', 'merch', 'videos', 'shows', 'about']);
  });

  it('includes about with only a short bio', () => {
    expect(sectionsToRender({ ...none, shortBio: 'A band.' })).toEqual(['about']);
  });

  it('includes about with only members', () => {
    expect(sectionsToRender({ ...none, members: 1 })).toEqual(['about']);
  });

  it('treats a whitespace-only bio as empty', () => {
    expect(sectionsToRender({ ...none, shortBio: '  \n' })).toEqual([]);
  });

  it('returns [] when there is no content at all', () => {
    expect(sectionsToRender(none)).toEqual([]);
  });
});

describe('merch section', () => {
  it('shows merch only when there are items', () => {
    expect(sectionsToRender({ ...none, merch: 1 })).toEqual(['merch']);
    expect(sectionsToRender({ ...none, releases: 1 })).toEqual(['music']);
  });
});
