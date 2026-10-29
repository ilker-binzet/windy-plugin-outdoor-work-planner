import type { Forecast, ForecastInterval } from '../src/lib/types';

/** Explicit, deterministic demonstration data; never imported by the Windy plugin. */
export function sampleForecast(missing = false): Forecast {
    const start = Date.parse('2026-10-29T00:00:00+03:00');
    const intervals: ForecastInterval[] = [];
    for (let hour = 0; hour < 5 * 24; hour++) {
        const localHour = hour % 24;
        const day = Math.floor(hour / 24);
        const clear = localHour >= 9 && localHour < (day === 1 ? 12 : day === 2 ? 16 : 14);
        intervals.push({
            start: start + hour * 3600000,
            end: start + (hour + 1) * 3600000,
            temperature: clear ? 19 + day : 16,
            wind: clear ? 12 + day : 17,
            gusts: clear ? 21 + day : 26,
            precipitation: day === 3 ? 0.3 : 0,
            humidity: missing ? null : clear ? 65 + day : 88,
        });
    }
    return {
        intervals,
        timeZone: 'Europe/Istanbul',
        model: 'sample',
        updatedAt: null,
        stepHours: 1,
        humidityEstimated: false,
        sample: true,
    };
}
