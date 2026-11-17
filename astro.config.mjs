// @ts-check
import { defineConfig } from 'astro/config';

// The site lives at https://alanone.github.io/icarus-down/.
// `base` is set here and nowhere else. If a custom domain is added later,
// change `base` to '/' and every link follows (they all go through url()).
// ICARUS_FIXTURE=<folder> builds against a content fixture (tests/fixtures/) into its own
// output and cache folders, so it never mixes with the real build.
const fixture = process.env.ICARUS_FIXTURE;

export default defineConfig({
  site: 'https://alanone.github.io',
  base: '/icarus-down',
  trailingSlash: 'always',
  outDir: fixture ? './dist-fixture' : './dist',
  cacheDir: fixture ? './node_modules/.astro-fixture' : './node_modules/.astro',
  // Video thumbnails are downloaded at build time, so visitors never request them from YouTube.
  image: { domains: ['i.ytimg.com'] },
});
