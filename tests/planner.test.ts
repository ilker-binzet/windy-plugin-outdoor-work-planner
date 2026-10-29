import { describe, expect, it } from 'vitest';
import { evaluateForecast, validateSettings } from '../src/lib/planner';
import type { ForecastInterval, PlannerSettings } from '../src/lib/types';

const ts = (s: string) => Date.parse(s);
const settings: PlannerSettings = {
    limits: {
        wind: 20,
        gusts: 30,
        precipitation: 0,
        minTemperature: 10,
        maxTemperature: 30,
        humidity: 80,
    },
    workStart: '08:00',
    workEnd: '18:00',
    minimumHours: 3,
};
const interval = (
    start: string,
    end: string,
    values: Partial<ForecastInterval> = {},
): ForecastInterval => ({
    start: ts(start),
    end: ts(end),
    wind: 20,
    gusts: 30,
    precipitation: 0,
    temperature: 10,
    humidity: 80,
    ...values,
});

describe('work-window evaluation', () => {
    it('includes values exactly on thresholds and merges contiguous native intervals', () => {
        const r = evaluateForecast(
            [
                interval('2026-10-29T08:00Z', '2026-10-29T11:00Z'),
                interval('2026-10-29T11:00Z', '2026-10-29T14:00Z'),
            ],
            settings,
            'UTC',
        );
        expect(r.windows.map(w => [w.start, w.end])).toEqual([
            [ts('2026-10-29T08:00Z'), ts('2026-10-29T14:00Z')],
        ]);
    });
    it('does not join across gaps or include insufficient-duration intervals', () => {
        const r = evaluateForecast(
            [
                interval('2026-10-29T08:00Z', '2026-10-29T10:00Z'),
                interval('2026-10-29T11:00Z', '2026-10-29T13:00Z'),
            ],
            settings,
            'UTC',
        );
        expect(r.windows).toEqual([]);
    });
    it('reports missing required values as unavailable rather than treating null as zero', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T08:00Z', '2026-10-29T14:00Z', { precipitation: null })],
            settings,
            'UTC',
        );
        expect(r.windows).toHaveLength(0);
        expect(r.checks[0].status).toBe('unavailable');
        expect(r.checks[0].reasons).toContain('Rain data unavailable');
    });
    it('allows explicitly disabled checks to ignore missing data', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T08:00Z', '2026-10-29T14:00Z', { humidity: null })],
            { ...settings, limits: { ...settings.limits, humidity: null } },
            'UTC',
        );
        expect(r.windows).toHaveLength(1);
    });
    it('shows every exceeded limit and separates matching runs', () => {
        const r = evaluateForecast(
            [
                interval('2026-10-29T08:00Z', '2026-10-29T11:00Z'),
                interval('2026-10-29T11:00Z', '2026-10-29T14:00Z', { wind: 21, humidity: 90 }),
                interval('2026-10-29T14:00Z', '2026-10-29T17:00Z'),
            ],
            settings,
            'UTC',
        );
        expect(r.windows).toHaveLength(2);
        expect(r.checks[1].status).toBe('outside');
        expect(r.checks[1].reasons).toEqual([
            'Wind exceeds your limit',
            'Humidity exceeds your limit',
        ]);
    });
    it('clips working hours in the site timezone and then enforces duration', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T03:00Z', '2026-10-29T09:00Z')],
            settings,
            'Europe/Istanbul',
        );
        expect(r.windows.map(w => [w.start, w.end])).toEqual([
            [ts('2026-10-29T05:00Z'), ts('2026-10-29T09:00Z')],
        ]);
    });
    it('honors partial-hour boundaries rather than rounding the schedule', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T08:00Z', '2026-10-29T14:00Z')],
            { ...settings, workStart: '08:30', workEnd: '11:30' },
            'UTC',
        );
        expect(r.windows[0].start).toBe(ts('2026-10-29T08:30Z'));
        expect(r.windows[0].end).toBe(ts('2026-10-29T11:30Z'));
    });
    it('does not include forecast time before the evaluation cutoff', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T08:00Z', '2026-10-29T14:00Z')],
            settings,
            'UTC',
            ts('2026-10-29T12:00Z'),
        );
        expect(r.windows).toHaveLength(0);
        expect(r.checks[0].interval.start).toBe(ts('2026-10-29T12:00Z'));
    });
    it('supports overnight schedules', () => {
        const r = evaluateForecast(
            [interval('2026-10-29T21:00Z', '2026-10-30T07:00Z')],
            { ...settings, workStart: '22:00', workEnd: '06:00', minimumHours: 8 },
            'UTC',
        );
        expect(r.windows.map(w => [w.start, w.end])).toEqual([
            [ts('2026-10-29T22:00Z'), ts('2026-10-30T06:00Z')],
        ]);
    });
    it('measures elapsed duration across the daylight-saving fall-back', () => {
        const r = evaluateForecast(
            [interval('2026-10-25T00:00Z', '2026-10-25T05:00Z')],
            { ...settings, workStart: '02:00', workEnd: '05:00', minimumHours: 4 },
            'Europe/Berlin',
        );
        expect(r.windows[0].end - r.windows[0].start).toBe(4 * 3600000);
    });
    it('does not double-count overlapping forecast coverage', () => {
        expect(() =>
            evaluateForecast(
                [
                    interval('2026-10-29T08:00Z', '2026-10-29T12:00Z'),
                    interval('2026-10-29T11:00Z', '2026-10-29T14:00Z'),
                ],
                settings,
                'UTC',
            ),
        ).toThrow(/overlap/i);
    });
    it('rejects malformed interval bounds rather than silently creating a window', () => {
        expect(() =>
            evaluateForecast([interval('2026-10-29T12:00Z', '2026-10-29T08:00Z')], settings, 'UTC'),
        ).toThrow(/interval/i);
    });
    it.each([
        { ...settings, minimumHours: 0 },
        { ...settings, limits: { ...settings.limits, minTemperature: 31 } },
        { ...settings, limits: { ...settings.limits, wind: -1 } },
        { ...settings, limits: { ...settings.limits, humidity: 101 } },
        { ...settings, limits: { ...settings.limits, gusts: Number.NaN } },
        { ...settings, workStart: '25:00' },
        { ...settings, workEnd: '08:00' },
        {
            ...settings,
            limits: Object.fromEntries(Object.keys(settings.limits).map(k => [k, null])),
        },
    ])('rejects invalid form or restored settings', bad => {
        expect(validateSettings(bad as PlannerSettings).length).toBeGreaterThan(0);
        expect(() => evaluateForecast([], bad as PlannerSettings, 'UTC')).toThrow();
    });
});
