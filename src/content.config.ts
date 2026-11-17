import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { memberSchema, releaseSchema, showSchema, videoSchema } from './lib/site-schema';

const md = (name: string) => glob({ pattern: '*.md', base: `./src/content/${name}` });

export const collections = {
  shows: defineCollection({ loader: md('shows'), schema: showSchema }),
  releases: defineCollection({ loader: md('releases'), schema: releaseSchema }),
  videos: defineCollection({ loader: md('videos'), schema: videoSchema }),
  members: defineCollection({ loader: md('members'), schema: memberSchema }),
};
