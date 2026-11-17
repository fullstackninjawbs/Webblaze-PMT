import { dayKey, dayBounds, weekBounds, isSameBusinessDay } from './appTime';

describe('business day helpers (Asia/Kolkata)', () => {
  const TZ = 'Asia/Kolkata';

  it('puts 02:00 IST on the same IST day, even though it is the previous UTC day', () => {
    const at2amIst = new Date('2026-11-16T20:30:00Z'); // 17 Nov 02:00 IST
    expect(dayKey(at2amIst, TZ)).toBe('2026-11-17');
  });

  it('returns UTC bounds for the full IST day', () => {
    const { start, end } = dayBounds(new Date('2026-11-17T06:00:00Z'), TZ);
    expect(start.toISOString()).toBe('2026-11-16T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-11-17T18:29:59.999Z');
  });

  it('works for timezones with daylight saving', () => {
    const { start } = dayBounds(new Date('2026-07-01T12:00:00Z'), 'America/New_York');
    expect(start.toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('returns Monday to Sunday for the business week', () => {
    // Thursday 19 Nov 2026, 10:00 IST
    const { start, end } = weekBounds(new Date('2026-11-19T04:30:00Z'), TZ);
    expect(start.toISOString()).toBe('2026-11-15T18:30:00.000Z'); // Mon 16 Nov 00:00 IST
    expect(end.toISOString()).toBe('2026-11-22T18:29:59.999Z'); // Sun 22 Nov 23:59:59 IST
  });

  it('compares business days', () => {
    expect(isSameBusinessDay(new Date('2026-11-16T19:00:00Z'), new Date('2026-11-17T10:00:00Z'))).toBe(true);
  });
});
