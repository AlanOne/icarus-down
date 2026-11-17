/** All "is it past / is it out" decisions are made in the band's home time zone. */
export const TZ = 'Europe/Ljubljana';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today's calendar date in `tz`, as YYYY-MM-DD. */
export function todayIn(now: Date, tz: string = TZ): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** True when date `a` falls before date `b` (both YYYY-MM-DD). */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

function parts(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function yearSuffix(date: string, today: string): string {
  return date.slice(0, 4) === today.slice(0, 4) ? '' : ` ${date.slice(0, 4)}`;
}

/** "Sat 12 Dec", or "Sat 9 Jan 2027" when the year differs from today's. */
export function formatShowDate(date: string, today: string): string {
  const { year, month, day } = parts(date);
  // Calendar arithmetic only: a UTC date never shifts the weekday.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]}${yearSuffix(date, today)}`;
}

/** "4 Dec", or "20 Feb 2027" when the year differs from today's. */
export function formatReleaseDate(date: string, today: string): string {
  const { month, day } = parts(date);
  return `${day} ${MONTHS[month - 1]}${yearSuffix(date, today)}`;
}
