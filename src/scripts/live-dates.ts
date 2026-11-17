// Corrects the page on the day, without a rebuild: hides shows that are over and
// switches releases from "upcoming" to "out". It uses the same pure functions as the
// build (src/lib), so the browser and the build cannot disagree about what day it is.
import { isBefore, todayIn } from '../lib/dates';
import { featuredRelease, releaseStatus, type Release } from '../lib/releases';

/** Just enough of a Release for the date rules. */
const asRelease = (slug: string, date: string, featured = false) => ({ slug, date, featured }) as Release;

export function applyLiveDates(root: ParentNode, now: Date): void {
  const today = todayIn(now);

  // Shows: hidden from the day after their date.
  for (const show of root.querySelectorAll<HTMLElement>('[data-show-date]')) {
    if (isBefore(show.dataset.showDate!, today)) show.hidden = true;
  }
  const showsSection = root.querySelector<HTMLElement>('#shows');
  if (showsSection && showsSection.querySelector('[data-show-date]')) {
    const anyLeft = [...showsSection.querySelectorAll<HTMLElement>('[data-show-date]')].some((li) => !li.hidden);
    if (!anyLeft) {
      showsSection.hidden = true;
      for (const nav of root.querySelectorAll<HTMLElement>('[data-nav="shows"]')) nav.hidden = true;
    }
  }

  // Releases: show the state that is right today.
  for (const block of root.querySelectorAll<HTMLElement>('[data-release-date]')) {
    const status = releaseStatus(asRelease(block.dataset.release ?? '', block.dataset.releaseDate!), today);
    for (const state of block.querySelectorAll<HTMLElement>('[data-state]')) {
      // Only this block's own states, not those of a release nested inside it.
      if (state.closest('[data-release-date]') !== block) continue;
      state.hidden = state.dataset.state !== status;
    }
  }

  // Hero: exactly one candidate, chosen by the same rule as the build.
  const candidates = [...root.querySelectorAll<HTMLElement>('[data-hero-candidate]')];
  if (candidates.length > 0) {
    const pick = featuredRelease(
      candidates.map((c) => asRelease(c.dataset.release ?? '', c.dataset.releaseDate!, 'featured' in c.dataset)),
      today,
    );
    for (const c of candidates) c.hidden = c.dataset.release !== pick?.slug;
  }
}

if (typeof document !== 'undefined') applyLiveDates(document, new Date());
