import { describe, it, expect, vi } from 'vitest';
import { resolveLocation, locationFailure, withDeadline } from '../src/lib/location';

describe('Windy and Leaflet location inputs', () => {
    it('accepts route coordinates and Leaflet map events without swapping latitude and longitude', () => {
        expect(resolveLocation({ lat: '41.01', lon: '28.98', name: 'Istanbul' })).toEqual({
            lat: 41.01,
            lon: 28.98,
            name: 'Istanbul',
        });
        expect(resolveLocation({ latlng: { lat: 32.94, lng: 38.25 } })).toMatchObject({
            lat: 32.94,
            lon: 38.25,
        });
    });
    it('rejects blank, missing, out-of-range and invalid coordinates instead of selecting zero', () => {
        for (const input of [
            null,
            {},
            { lat: ' ', lon: 20 },
            { lat: 1, lon: '' },
            { lat: 90, lon: 1 },
            { lat: 20, lon: 181 },
            { lat: NaN, lon: 0 },
        ])
            expect(resolveLocation(input)).toBeNull();
    });
    it('explains denied location permission and timeouts', () => {
        expect(locationFailure({ code: 1 })).toContain('Location permission');
        expect(locationFailure({ code: 3 })).toContain('timed out');
        expect(locationFailure(new Error('No GPS'))).toBe('No GPS');
    });
});

describe('location and forecast deadlines', () => {
    it('releases timers after a successful request', async () => {
        vi.useFakeTimers();
        try {
            await expect(withDeadline(Promise.resolve('ready'), 1000, 'Timed out')).resolves.toBe(
                'ready',
            );
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
    it('ends a stalled request without waiting forever for a native permission dialog', async () => {
        vi.useFakeTimers();
        try {
            const pending = withDeadline(new Promise(() => {}), 12000, 'Location timed out');
            const result = expect(pending).rejects.toThrow('Location timed out');
            await vi.advanceTimersByTimeAsync(12000);
            await result;
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});
