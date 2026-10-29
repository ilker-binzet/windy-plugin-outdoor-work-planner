import { Temporal } from '@js-temporal/polyfill';
import type {
    Evaluation,
    ForecastInterval,
    IntervalCheck,
    Limits,
    PlannerSettings,
    WorkWindow,
} from './types';

export const LIMIT_FIELDS: {
    key: keyof Limits;
    label: string;
    unit: string;
    min: number;
    max: number;
}[] = [
    { key: 'wind', label: 'Maximum Wind', unit: 'km/h', min: 0, max: 500 },
    { key: 'gusts', label: 'Maximum Gusts', unit: 'km/h', min: 0, max: 500 },
    { key: 'precipitation', label: 'Maximum Rain', unit: 'mm/h', min: 0, max: 500 },
    { key: 'humidity', label: 'Maximum Humidity', unit: '%', min: 0, max: 100 },
    { key: 'minTemperature', label: 'Minimum Temperature', unit: '°C', min: -90, max: 65 },
    { key: 'maxTemperature', label: 'Maximum Temperature', unit: '°C', min: -90, max: 65 },
];

export function validateSettings(settings: PlannerSettings): string[] {
    const errors: string[] = [];
    if (!settings || !settings.limits) return ['Weather limits are missing.'];
    for (const field of LIMIT_FIELDS) {
        const value = settings.limits[field.key];
        if (
            value !== null &&
            (typeof value !== 'number' ||
                !Number.isFinite(value) ||
                value < field.min ||
                value > field.max)
        ) {
            errors.push(
                `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`,
            );
        }
    }
    const { minTemperature, maxTemperature } = settings.limits;
    if (minTemperature !== null && maxTemperature !== null && minTemperature > maxTemperature)
        errors.push('Minimum temperature must not exceed maximum temperature.');
    if (!Object.values(settings.limits).some(v => typeof v === 'number' && Number.isFinite(v)))
        errors.push('Enable at least one weather limit.');
    const validTime = (s: string) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
    if (!validTime(settings.workStart) || !validTime(settings.workEnd))
        errors.push('Enter valid working hours.');
    if (settings.workStart === settings.workEnd)
        errors.push('Working hours must have different start and end times.');
    if (
        !Number.isFinite(settings.minimumHours) ||
        settings.minimumHours <= 0 ||
        settings.minimumHours > 24
    )
        errors.push('Required duration must be greater than 0 and no more than 24 hours.');
    return errors;
}

function checkInterval(interval: ForecastInterval, limits: Limits): IntervalCheck {
    const reasons: string[] = [];
    let missing = false;
    const checks: { key: keyof Limits; value: number | null; name: string; minimum?: boolean }[] = [
        { key: 'wind', value: interval.wind, name: 'Wind' },
        { key: 'gusts', value: interval.gusts, name: 'Gusts' },
        { key: 'precipitation', value: interval.precipitation, name: 'Rain' },
        { key: 'minTemperature', value: interval.temperature, name: 'Temperature', minimum: true },
        { key: 'maxTemperature', value: interval.temperature, name: 'Temperature' },
        { key: 'humidity', value: interval.humidity, name: 'Humidity' },
    ];
    for (const { key, value, name, minimum } of checks) {
        const limit = limits[key];
        if (limit === null) continue;
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            missing = true;
            const reason = `${name} data unavailable`;
            if (!reasons.includes(reason)) reasons.push(reason);
        } else if (minimum ? value < limit : value > limit) {
            reasons.push(`${name} ${minimum ? 'below' : 'exceeds'} your limit`);
        }
    }
    return {
        interval,
        status: missing ? 'unavailable' : reasons.length ? 'outside' : 'match',
        reasons,
    };
}

export function evaluateForecast(
    intervals: ForecastInterval[],
    settings: PlannerSettings,
    timeZone: string,
    notBefore = 0,
): Evaluation {
    const errors = validateSettings(settings);
    if (errors.length) throw new Error(errors.join(' '));
    // Temporal uses the location's real zone rules, including DST and overnight shifts.
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        if (!Number.isFinite(item.start) || !Number.isFinite(item.end) || item.end <= item.start)
            throw new Error('Invalid forecast interval.');
        if (i && item.start < sorted[i - 1].end) throw new Error('Forecast intervals overlap.');
    }
    const checks: IntervalCheck[] = [];
    for (const interval of sorted) {
        if (interval.end <= notBefore) continue;
        let date = Temporal.Instant.fromEpochMilliseconds(interval.start)
            .toZonedDateTimeISO(timeZone)
            .toPlainDate()
            .subtract({ days: 1 });
        const lastDate = Temporal.Instant.fromEpochMilliseconds(interval.end)
            .toZonedDateTimeISO(timeZone)
            .toPlainDate();
        while (Temporal.PlainDate.compare(date, lastDate) <= 0) {
            const endDate = settings.workEnd < settings.workStart ? date.add({ days: 1 }) : date;
            const shiftStart = date.toZonedDateTime({
                timeZone,
                plainTime: settings.workStart,
            }).epochMilliseconds;
            const shiftEnd = endDate.toZonedDateTime({
                timeZone,
                plainTime: settings.workEnd,
            }).epochMilliseconds;
            const start = Math.max(interval.start, shiftStart, notBefore);
            const end = Math.min(interval.end, shiftEnd);
            if (start < end)
                checks.push(checkInterval({ ...interval, start, end }, settings.limits));
            date = date.add({ days: 1 });
        }
    }
    checks.sort((a, b) => a.interval.start - b.interval.start);
    const runs: WorkWindow[] = [];
    let run: WorkWindow | null = null;
    for (const check of checks) {
        const { interval } = check;
        if (check.status !== 'match') {
            run = null;
            continue;
        }
        if (run && run.end === interval.start) {
            run.end = interval.end;
            run.intervals.push(interval);
        } else {
            run = { start: interval.start, end: interval.end, intervals: [interval] };
            runs.push(run);
        }
    }
    return {
        checks,
        windows: runs.filter(w => w.end - w.start >= settings.minimumHours * 3600000),
    };
}
