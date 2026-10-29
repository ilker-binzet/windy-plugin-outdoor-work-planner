<div class="plugin__mobile-header">Outdoor Work Planner</div>
<div class="owp-planner-host">
    <Planner
        {forecast}
        {location}
        {loading}
        {error}
        {notBefore}
        on:location={event => selectLocation(event.detail, true)}
        on:retry={() => selectLocation(location)}
        on:search={() => (notBefore = Date.now())}
    />
</div>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { map } from '@windy/map';
    import { singleclick } from '@windy/singleclick';
    import store from '@windy/store';
    import { getPointForecastData } from '@windy/fetch';
    import * as reverse from '@windy/reverseName';
    import Planner from './components/Planner.svelte';
    import { coordinates } from './lib/format';
    import { normalizeForecast } from './lib/forecast';
    import { latestRequest } from './lib/latest-request';
    import { startLiveClock } from './lib/live-clock';
    import config from './pluginConfig';
    import type { Forecast, Location } from './lib/types';

    let forecast: Forecast | null = null;
    let location: Location = { lat: 0, lon: 0, name: 'Select a location' };
    let loading = false;
    let error = '';
    let notBefore = Date.now();
    let active = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let modelListener: number | undefined;
    let marker: L.Marker | null = null;
    let stopClock: (() => void) | undefined;
    const requests = latestRequest();
    const supportedModels = new Set([
        'ecmwf',
        'gfs',
        'icon',
        'iconEu',
        'iconD2',
        'arome',
        'aromeFrance',
        'hrrrConus',
        'hrrrAlaska',
        'ukv',
        'jmaMsm',
        'canHrdps',
        'bomAccess',
    ]);

    function resolveLocation(params: unknown): Location | null {
        if (!params || typeof params !== 'object') return null;
        const p = params as Record<string, unknown>;
        if (
            (typeof p.lat !== 'number' && typeof p.lat !== 'string') ||
            (typeof p.lon !== 'number' && typeof p.lon !== 'string') ||
            p.lat === '' ||
            p.lon === ''
        )
            return null;
        const lat = Number(p.lat),
            lon = Number(p.lon);
        return Number.isFinite(lat) &&
            Number.isFinite(lon) &&
            Math.abs(lat) <= 85 &&
            Math.abs(lon) <= 180
            ? { lat, lon, name: coordinates(lat, lon) }
            : null;
    }

    async function selectLocation(point: Location, recenter = false) {
        if (!active) {
            location = point;
            return;
        }
        const request = requests.begin();
        clearTimeout(timeout);
        location = point;
        forecast = null;
        error = '';
        loading = true;
        notBefore = Date.now();
        if (recenter) map.setView([point.lat, point.lon], map.getZoom(), { animate: true });
        marker?.remove();
        marker = L.marker([point.lat, point.lon], {
            icon: L.divIcon({
                className: 'owp-map-pin',
                html: '<span></span>',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            }),
        }).addTo(map);
        void reverse
            .get(point)
            .then(result => {
                if (active && requests.current(request) && typeof result.name === 'string')
                    location = { ...point, name: result.name };
            })
            .catch(() => {
                /* Coordinates remain a valid fallback label. */
            });
        const selectedModel = store.get('product');
        const model = (supportedModels.has(selectedModel) ? selectedModel : 'ecmwf') as Parameters<
            typeof getPointForecastData
        >[0];
        try {
            // Windy can share in-flight HTTP requests. Invalidating our result
            // avoids aborting a transport that a subsequent location load reuses.
            const deadline = new Promise<never>((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error('The forecast request timed out. Please try again.')),
                    25000,
                );
            });
            const response = await Promise.race([
                getPointForecastData(
                    model,
                    { lat: point.lat, lon: point.lon, step: 3, days: 5, interpolate: false },
                    { header: true, celestial: true, meteogram: true, summary: true },
                ),
                deadline,
            ]);
            if (!active || !requests.current(request)) return;
            if (!response || response.status < 200 || response.status >= 300)
                throw new Error('The selected forecast model is unavailable for this location.');
            forecast = normalizeForecast(response.data, 3);
        } catch (e) {
            if (active && requests.current(request))
                error =
                    e instanceof Error
                        ? e.message
                        : 'The forecast service could not be reached. Please try again.';
        } finally {
            if (active && requests.current(request)) {
                loading = false;
                clearTimeout(timeout);
            }
        }
    }
    function onMapClick(point: unknown) {
        const next = resolveLocation(point);
        if (next) void selectLocation(next);
    }
    export const onopen = (params?: unknown) => {
        const center = map.getCenter();
        const next = resolveLocation(params) ?? {
            lat: center.lat,
            lon: center.lng,
            name: coordinates(center.lat, center.lng),
        };
        void selectLocation(next);
    };
    onMount(() => {
        active = true;
        stopClock = startLiveClock(now => (notBefore = now));
        singleclick.on(config.name, onMapClick);
        modelListener = store.on('product', () => {
            void selectLocation(location);
        });
        if (location.name === 'Select a location') {
            const center = map.getCenter();
            location = {
                lat: center.lat,
                lon: center.lng,
                name: coordinates(center.lat, center.lng),
            };
        }
        void selectLocation(location);
    });
    onDestroy(() => {
        active = false;
        stopClock?.();
        requests.invalidate();
        clearTimeout(timeout);
        singleclick.off(config.name, onMapClick);
        if (modelListener !== undefined) store.off(modelListener);
        marker?.remove();
        marker = null;
    });
</script>

<style>
    .owp-planner-host {
        background: #fff;
        min-height: 100%;
        overflow-x: hidden;
    }
    :global(.owp-map-pin span) {
        display: block;
        width: 18px;
        height: 18px;
        background: #175344;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #175344;
    }
</style>
