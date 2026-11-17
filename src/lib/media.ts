import type { ImageMetadata } from 'astro';

// Keys look like "/src/assets/media/Band Photo.JPG", the same form Pages CMS stores.
const images = import.meta.glob<ImageMetadata>('/src/assets/media/*', {
  eager: true,
  import: 'default',
});

/** The image for a stored media path, or undefined when there is no such file. */
export function resolveMedia(path: string): ImageMetadata | undefined {
  if (!path) return undefined;
  return images[path] ?? images[decodeURI(path)];
}
