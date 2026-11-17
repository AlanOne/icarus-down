/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig loads astro.config.mjs, so import.meta.env.BASE_URL and
// astro:* virtual modules resolve in tests the same way they do in a build.
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
