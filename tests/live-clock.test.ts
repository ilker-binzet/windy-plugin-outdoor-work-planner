import { expect, it, vi } from 'vitest';
import { startLiveClock } from '../src/lib/live-clock';
it('advances the live cutoff and stops its timer when the plugin closes', () => {
    vi.useFakeTimers();
    try {
        vi.setSystemTime(new Date('2026-10-29T08:00:00Z'));
        let cutoff = 0;
        const stop = startLiveClock(value => (cutoff = value));
        expect(cutoff).toBe(Date.parse('2026-10-29T08:00:00Z'));
        vi.advanceTimersByTime(3600000);
        expect(cutoff).toBe(Date.parse('2026-10-29T09:00:00Z'));
        stop();
        vi.advanceTimersByTime(60000);
        expect(cutoff).toBe(Date.parse('2026-10-29T09:00:00Z'));
    } finally {
        vi.useRealTimers();
    }
});
