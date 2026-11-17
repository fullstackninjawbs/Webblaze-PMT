/**
 * Business-day helpers. "Today" for daily reports and EOD summaries is a calendar day in
 * the company's timezone (APP_TIMEZONE, default Asia/Kolkata), not the server's clock.
 * Without this, a server running in UTC files work done before 05:30 IST under the
 * previous day.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

const partsIn = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
};

/** Milliseconds the timezone is ahead of UTC at the given instant. */
const offsetMs = (date: Date, timeZone: string) => {
  const p = partsIn(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
};

/** "YYYY-MM-DD" of the business day containing `date`. */
export const dayKey = (date: Date = new Date(), timeZone: string = APP_TIMEZONE): string => {
  const p = partsIn(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};

/** UTC instants for the start and end of the business day containing `date`. */
export const dayBounds = (date: Date = new Date(), timeZone: string = APP_TIMEZONE) => {
  const p = partsIn(date, timeZone);
  const midnightAsUtc = Date.UTC(p.year, p.month - 1, p.day);
  // Offset measured at local noon so a DST change at midnight cannot shift the day
  const noon = new Date(midnightAsUtc + 12 * 3600 * 1000);
  const offset = offsetMs(noon, timeZone);
  const start = new Date(midnightAsUtc - offset);
  const end = new Date(start.getTime() + 24 * 3600 * 1000 - 1);
  return { start, end };
};

/** UTC instants for the business week (Monday to Sunday) containing `date`. */
export const weekBounds = (date: Date = new Date(), timeZone: string = APP_TIMEZONE) => {
  const [y, m, d] = dayKey(date, timeZone).split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (weekday + 6) % 7;
  const mondayNoon = new Date(Date.UTC(y, m - 1, d - daysSinceMonday, 12));
  const { start } = dayBounds(mondayNoon, timeZone);
  const sundayNoon = new Date(Date.UTC(y, m - 1, d - daysSinceMonday + 6, 12));
  const { end } = dayBounds(sundayNoon, timeZone);
  return { start, end };
};

export const isSameBusinessDay =(a?: Date | string | null, b: Date = new Date()) =>
  !!a && dayKey(new Date(a)) === dayKey(b);
