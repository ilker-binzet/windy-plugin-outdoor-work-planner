import { coordinates } from './format';
import type { Location } from './types';

/** Windy routes use lat/lon; Leaflet map events use latlng.lat/lng. */
export function resolveLocation(value: unknown): Location | null {
    if (!value || typeof value !== 'object') return null;
    const outer = value as Record<string, unknown>;
    const point = (
        outer.latlng && typeof outer.latlng === 'object' ? outer.latlng : outer
    ) as Record<string, unknown>;
    const lat = number(point.lat),
        lon = number(point.lon ?? point.lng);
    if (lat === null || lon === null || Math.abs(lat) > 85 || Math.abs(lon) > 180) return null;
    return {
        lat,
        lon,
        name:
            typeof outer.name === 'string' && outer.name.trim()
                ? outer.name
                : coordinates(lat, lon),
    };
}
function number(value: unknown): number | null {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '')
        return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
}
export function withDeadline<T>(
    promise: Promise<T>,
    milliseconds: number,
    message: string,
): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(message)), milliseconds);
        }),
    ]).finally(() => clearTimeout(timer));
}
export function locationFailure(error: unknown): string {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 1 || code === 'OS-PLUG-GLOC-0003')
        return 'Location permission was denied. Allow location access in your device settings, or choose a point on the map.';
    if (code === 3) return 'Location timed out. Try again outdoors, or choose a point on the map.';
    return error instanceof Error
        ? error.message
        : 'Your device location is unavailable. Search in Windy or choose a point on the map.';
}
