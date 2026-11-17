// @ts-check
import { defineConfig } from 'astro/config';

// The site lives at https://alanone.github.io/icarus-down/.
// `base` is set here and nowhere else. If a custom domain is added later,
// change `base` to '/' and every link follows (they all go through url()).
export default defineConfig({
  site: 'https://alanone.github.io',
  base: '/icarus-down',
  trailingSlash: 'always',
  // Video thumbnails are downloaded at build time, so visitors never request them from YouTube.
  image: { domains: ['i.ytimg.com'] },
});
