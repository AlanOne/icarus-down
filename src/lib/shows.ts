import { isBefore } from './dates';

export type Show = {
  slug: string;
  date: string;
  venue: string;
  city: string;
  country?: string;
  ticketUrl?: string;
  note?: string;
};

/** Shows on or after `today`, soonest first, then by venue. */
export function upcomingShows(shows: Show[], today: string): Show[] {
  return shows
    .filter((s) => !isBefore(s.date, today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.venue.localeCompare(b.venue));
}
