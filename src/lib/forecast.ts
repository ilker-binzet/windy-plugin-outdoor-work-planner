import type { Forecast } from './types';

function record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}
function values(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}
function numeric(value: unknown, min: number, max: number): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
        ? value
        : null;
}

/** Windy node-forecast-v3: timestamps start a segment; rain is mm per 1h/3h segment. */
export function normalizeForecast(payload: unknown, stepHours: 1 | 3): Forecast {
    const root = record(payload);
    const data = record(root.data);
    const header = record(root.header);
    const celestial = record(root.celestial);
    const ts = values(data.ts);
    if (ts.length < 2 || typeof header.model !== 'string')
        throw new Error('Forecast response is unavailable or has an unsupported format.');
    const timeZone = typeof celestial.TZname === 'string' ? celestial.TZname : '';
    try {
        if (!timeZone) throw new Error();
        new Intl.DateTimeFormat('en', { timeZone }).format();
    } catch {
        throw new Error('The forecast did not provide a supported location time zone.');
    }
    const step = stepHours * 3600000;
    for (let i = 0; i < ts.length; i++) {
        const stamp = ts[i];
        if (
            typeof stamp !== 'number' ||
            !Number.isSafeInteger(stamp) ||
            stamp < 946684800000 ||
            stamp > 4102444800000
        )
            throw new Error('Invalid forecast timestamp.');
        if (i && stamp - (ts[i - 1] as number) < step)
            throw new Error('Forecast timestamps do not match the requested resolution.');
    }
    const meteogram = record(root.meteogram);
    const dewpoints = new Map(
        values(meteogram.ts).map((stamp, i) => [stamp, values(meteogram.dewPoint)[i]]),
    );
    const mergedIndex = record(header.merged).mergedModelStartIndex;
    const last =
        typeof mergedIndex === 'number' && Number.isInteger(mergedIndex) && mergedIndex >= 0
            ? Math.min(mergedIndex, ts.length - 1)
            : ts.length - 1;
    const intervals = [];
    for (let i = 0; i < last; i++) {
        const start = ts[i] as number;
        const rawTemperature = numeric(values(data.temperature)[i], 183.15, 338.15);
        const temperature = rawTemperature === null ? null : rawTemperature - 273.15;
        const dewK = numeric(dewpoints.get(start), 153.15, 338.15);
        let humidity: number | null = null;
        if (temperature !== null && dewK !== null && dewK <= (rawTemperature as number) + 0.5) {
            // Magnus approximation; explicitly labelled as an estimate in the UI.
            const dewC = dewK - 273.15;
            humidity = Math.min(
                100,
                100 *
                    Math.exp(
                        (17.625 * dewC) / (243.04 + dewC) -
                            (17.625 * temperature) / (243.04 + temperature),
                    ),
            );
        }
        const wind = numeric(values(data.wind)[i], 0, 150);
        const gusts = numeric(values(data.windGust)[i], 0, 150);
        const amount = numeric(values(data.precipAmount)[i], 0, 1500);
        intervals.push({
            start,
            end: start + step,
            temperature,
            wind: wind === null ? null : wind * 3.6,
            gusts: gusts === null ? null : gusts * 3.6,
            precipitation: amount === null ? null : amount / stepHours,
            humidity,
        });
    }
    if (!intervals.length)
        throw new Error('There are no complete forecast intervals available for this model.');
    return {
        intervals,
        timeZone,
        model: header.model,
        updatedAt:
            typeof header.update === 'string' && Number.isFinite(Date.parse(header.update))
                ? header.update
                : null,
        stepHours,
        humidityEstimated: true,
    };
}
