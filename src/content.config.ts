import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { memberSchema, releaseSchema, showSchema, videoSchema } from './lib/site-schema';

// ICARUS_FIXTURE swaps in a test fixture's content (see tests/fixtures/README.md).
const root = process.env.ICARUS_FIXTURE ? `${process.env.ICARUS_FIXTURE}/content` : './src/content';
const md = (name: string) => glob({ pattern: '*.md', base: `${root}/${name}` });

export const collections = {
  shows: defineCollection({ loader: md('shows'), schema: showSchema }),
  releases: defineCollection({ loader: md('releases'), schema: releaseSchema }),
  videos: defineCollection({ loader: md('videos'), schema: videoSchema }),
  members: defineCollection({ loader: md('members'), schema: memberSchema }),
};
