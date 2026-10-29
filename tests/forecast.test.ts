import { describe, expect, it } from 'vitest';
import { normalizeForecast } from '../src/lib/forecast';

const start = Date.parse('2026-10-29T06:00Z');
function payload() {
    return {
        header: { model: 'ecmwf', update: '2026-10-29T00:00:00Z' },
        celestial: { TZname: 'Europe/Istanbul' },
        data: {
            ts: [start, start + 10800000, start + 21600000],
            temperature: [293.15, 294.15, 295.15],
            wind: [5, 6, 7],
            windGust: [8, 9, 10],
            precipAmount: [0.6, 0, 0],
        },
        meteogram: {
            ts: [start, start + 10800000, start + 21600000],
            dewPoint: [283.15, 284.15, 285.15],
        },
    };
}
describe('Windy v3 forecast normalization', () => {
    it('converts Kelvin and m/s and averages accumulated rain over the requested native step', () => {
        const r = normalizeForecast(payload(), 3);
        expect(r.intervals).toHaveLength(2);
        expect(r.intervals[0].temperature).toBeCloseTo(20);
        expect(r.intervals[0].wind).toBe(18);
        expect(r.intervals[0].gusts).toBeCloseTo(28.8);
        expect(r.intervals[0].precipitation).toBeCloseTo(0.2);
        expect(r.intervals[0].humidity).toBeCloseTo(52.5, 0);
        expect(r.humidityEstimated).toBe(true);
        expect(r.timeZone).toBe('Europe/Istanbul');
        expect(r.model).toBe('ecmwf');
    });
    it('does not extrapolate an unknown terminal interval', () => {
        expect(normalizeForecast(payload(), 3).intervals.at(-1)?.end).toBe(start + 21600000);
    });
    it('preserves a missing-step gap without stretching precipitation across it', () => {
        const p = payload();
        p.data.ts[1] = start + 21600000;
        p.data.ts[2] = start + 32400000;
        const r = normalizeForecast(p, 3);
        expect(r.intervals[0].end).toBe(start + 10800000);
        expect(r.intervals[1].start).toBe(start + 21600000);
        expect(r.intervals[0].precipitation).toBeCloseTo(0.2);
    });
    it('aligns dewpoint by its own timestamp instead of array position', () => {
        const p = payload();
        p.meteogram.ts = [start + 10800000, start + 21600000, start + 32400000];
        expect(normalizeForecast(p, 3).intervals[0].humidity).toBeNull();
    });
    it('keeps null and sentinel weather values unavailable', () => {
        const p = payload();
        const data = p.data as unknown as Record<string, unknown>;
        data.wind = [null, -1, 3];
        data.precipAmount = [null, -9999, 0];
        data.temperature = [null, 9999, 290];
        const r = normalizeForecast(p, 3);
        expect(r.intervals[0].wind).toBeNull();
        expect(r.intervals[0].precipitation).toBeNull();
        expect(r.intervals[0].temperature).toBeNull();
        expect(r.intervals[1].wind).toBeNull();
        expect(r.intervals[1].temperature).toBeNull();
    });
    it('does not require optional meteogram data to preserve other weather fields', () => {
        const p: Record<string, unknown> = payload();
        delete p.meteogram;
        const r = normalizeForecast(p, 3);
        expect(r.intervals[0].humidity).toBeNull();
        expect(r.intervals[0].wind).toBe(18);
    });
    it('never substitutes the browser timezone for a missing site timezone', () => {
        const p = payload();
        p.celestial.TZname = '';
        expect(() => normalizeForecast(p, 3)).toThrow(/time zone/i);
    });
    it('rejects duplicated, out-of-order, or shorter-than-requested time steps', () => {
        for (const second of [start, start - 10800000, start + 3600000]) {
            const p = payload();
            p.data.ts[1] = second;
            expect(() => normalizeForecast(p, 3)).toThrow(/timestamp|resolution/i);
        }
    });
    it('rejects unsupported or unrecognized response shapes', () => {
        expect(() => normalizeForecast({ data: { ts: [] } }, 3)).toThrow();
        expect(() => normalizeForecast({ data: payload() }, 3)).toThrow();
    });
    it('stops before a merged secondary model with unconfirmed interval semantics', () => {
        const p = payload();
        (p.header as Record<string, unknown>).merged = {
            mergedModelStartIndex: 1,
            mergedModelName: 'Secondary',
        };
        expect(normalizeForecast(p, 3).intervals).toHaveLength(1);
    });
});
