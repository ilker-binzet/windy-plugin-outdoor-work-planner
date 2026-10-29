export const number = (value: number | null, digits = 1): string =>
    value === null || !Number.isFinite(value)
        ? '—'
        : new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value);
export const time = (timestamp: number, timeZone: string): string =>
    new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(timestamp);
export const dayKey = (timestamp: number, timeZone: string): string =>
    new Intl.DateTimeFormat('sv-SE', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(timestamp);
export const dayLabel = (timestamp: number, timeZone: string): string =>
    new Intl.DateTimeFormat('en', { timeZone, weekday: 'short', day: 'numeric' }).format(timestamp);
export const dateLabel = (timestamp: number, timeZone: string): string =>
    new Intl.DateTimeFormat('en', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(timestamp);
export const coordinates = (lat: number, lon: number): string =>
    `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
import type { WorkWindow } from './types';

export function windowOverlapsDay(window: WorkWindow, day: string, timeZone: string): boolean {
    return dayKey(window.start, timeZone) <= day && dayKey(window.end - 1, timeZone) >= day;
}
