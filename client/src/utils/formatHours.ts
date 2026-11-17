/**
 * Hours are stored as decimals (1.5 = 1 hour 30 minutes). Never show the decimal to
 * users: "1.67h" reads as "1 hour 67 minutes". Always render hours and minutes.
 *
 *   formatHours(1.5)    -> "1h 30m"
 *   formatHours(2)      -> "2h"
 *   formatHours(0.75)   -> "45m"
 *   formatHours(1.999)  -> "2h"
 */
export const formatHours = (hours: number | string | undefined | null): string => {
  if (hours === undefined || hours === null || isNaN(Number(hours))) return '0h';
  const totalMinutes = Math.round(Math.abs(Number(hours)) * 60);
  const sign = Number(hours) < 0 ? '-' : '';
  if (totalMinutes === 0) return '0h';

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
};

/** Seconds -> "1h 05m 09s" style clock text for running timers. */
export const formatSecondsClock = (totalSeconds: number): string => {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};
