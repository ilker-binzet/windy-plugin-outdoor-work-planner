import { expect, it } from 'vitest';
import { windowOverlapsDay } from '../src/lib/format';
it('keeps an overnight work window visible on both local dates it covers', () => {
    const window = {
        start: Date.parse('2026-10-29T22:00:00+03:00'),
        end: Date.parse('2026-10-30T06:00:00+03:00'),
        intervals: [],
    };
    expect(windowOverlapsDay(window, '2026-10-29', 'Europe/Istanbul')).toBe(true);
    expect(windowOverlapsDay(window, '2026-10-30', 'Europe/Istanbul')).toBe(true);
    expect(windowOverlapsDay(window, '2026-10-31', 'Europe/Istanbul')).toBe(false);
});
it('treats midnight end times as exclusive', () => {
    const window = {
        start: Date.parse('2026-10-29T22:00Z'),
        end: Date.parse('2026-10-30T00:00Z'),
        intervals: [],
    };
    expect(windowOverlapsDay(window, '2026-10-30', 'UTC')).toBe(false);
});
