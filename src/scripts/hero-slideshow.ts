// Hero slideshow: cross-fades to the next photo every 10 seconds, each with a slow zoom
// (CSS). Only the first photo loads with the page; each next one loads 2 seconds before
// it's shown. A pause button stops it (WCAG 2.2.2), and visitors who ask their device for
// reduced motion get a still photo.

const INTERVAL = 10_000;
const PRELOAD = 2_000;

function load(img: HTMLImageElement) {
  if (img.getAttribute('src')) return;
  const { src, srcset, sizes } = img.dataset;
  if (sizes) img.setAttribute('sizes', sizes);
  if (srcset) img.setAttribute('srcset', srcset);
  if (src) img.setAttribute('src', src);
}

export function setupHeroSlideshow(root: Document, opts: { reducedMotion: boolean }): void {
  const photos = [...root.querySelectorAll<HTMLImageElement>('.hero-photo')];
  const button = root.querySelector<HTMLButtonElement>('.hero-pause');
  if (photos.length < 2 || opts.reducedMotion) return;

  let current = Math.max(0, photos.findIndex((p) => p.classList.contains('is-active')));
  let paused = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const schedule = () => {
    timers.forEach(clearTimeout);
    const next = photos[(current + 1) % photos.length];
    timers = [
      setTimeout(() => load(next), INTERVAL - PRELOAD),
      setTimeout(() => {
        photos[current].classList.remove('is-active');
        current = (current + 1) % photos.length;
        photos[current].classList.add('is-active');
        schedule();
      }, INTERVAL),
    ];
  };

  const setPaused = (value: boolean) => {
    paused = value;
    root.querySelector('.hero')?.classList.toggle('is-paused', paused);
    if (button) {
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Play photo slideshow' : 'Pause photo slideshow');
    }
    if (paused) timers.forEach(clearTimeout);
    else schedule();
  };

  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => setPaused(!paused));
  }
  setPaused(false);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  setupHeroSlideshow(document, {
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  });
}
