<div class="owp-planner-host" class:owp-map-mode={compact} use:isolateMapEvents use:nativeLayout>
    <Planner
        {forecast}
        {location}
        {loading}
        {error}
        {notBefore}
        {locating}
        {locationError}
        {locationNotice}
        live={true}
        bind:compact
        on:location={event => chooseLocation(event.detail, true)}
        on:retry={() => selectLocation(location, false, true)}
        on:search={() => (notBefore = Date.now())}
        on:locate={locate}
        on:mapcenter={useMapCenter}
        on:searchplace={searchPlace}
        on:close={closePlanner}
    />
</div>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { map } from '@windy/map';
    import { singleclick } from '@windy/singleclick';
    import { getGPSlocation } from '@windy/geolocation';
    import { emitter as pickerEvents } from '@windy/picker';
    import bcast from '@windy/broadcast';
    import store from '@windy/store';
    import plugins from '@windy/plugins';
    import { getPointForecastData } from '@windy/fetch';
    import * as reverse from '@windy/reverseName';
    import Planner from './components/Planner.svelte';
    import { coordinates } from './lib/format';
    import { resolveLocation, withDeadline, locationFailure } from './lib/location';
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
    let compact = false;
    let locating = false;
    let locationError = '';
    let locationNotice = '';
    let awaitingSearch = false;
    let modelListener: number | undefined;
    let marker: L.Marker | null = null;
    let stopClock: (() => void) | undefined;
    let inFlightKey = '';
    const requests = latestRequest();
    const positions = latestRequest();
    const forecastCache = new Map<string, { forecast: Forecast; at: number }>();
    const names = new Map<string, string>();
    const pendingNativeClose = new Set<string>();
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
    function modelForLocation() {
        const product = store.get('product');
        return (supportedModels.has(product) ? product : 'ecmwf') as Parameters<
            typeof getPointForecastData
        >[0];
    }
    function keyFor(point: Location) {
        return `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`;
    }
    function chooseLocation(point: Location, recenter = false) {
        positions.invalidate();
        locating = false;
        awaitingSearch = false;
        locationError = '';
        locationNotice = 'Work location updated.';
        void selectLocation(point, recenter);
    }
    async function selectLocation(point: Location, recenter = false, refresh = false) {
        if (!active) {
            location = point;
            return;
        }
        const pointKey = keyFor(point),
            model = modelForLocation(),
            key = `${model}:${pointKey}`;
        if (!refresh && inFlightKey === key && loading) return;
        const request = requests.begin();
        inFlightKey = key;
        location = { ...point, name: names.get(pointKey) ?? point.name };
        forecast = null;
        error = '';
        notBefore = Date.now();
        if (recenter)
            map.setView([point.lat, point.lon], Math.max(map.getZoom(), 8), { animate: true });
        marker?.remove();
        marker = L.marker([point.lat, point.lon], {
            icon: L.divIcon({
                className: 'owp-map-pin',
                html: '<span></span>',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            }),
        }).addTo(map);
        if (!names.has(pointKey) && point.name === coordinates(point.lat, point.lon)) {
            void reverse
                .get(point)
                .then(result => {
                    if (typeof result.name !== 'string' || !result.name.trim()) return;
                    names.set(pointKey, result.name);
                    if (active && requests.current(request))
                        location = { ...point, name: result.name };
                })
                .catch(() => {
                    /* Exact coordinates remain available when a place name cannot be resolved. */
                });
        }
        const cached = forecastCache.get(key);
        if (!refresh && cached && Date.now() - cached.at < 90000) {
            forecast = cached.forecast;
            loading = false;
            return;
        }
        loading = true;
        try {
            // Windy shares requests. Discard stale consumers; never abort a shared HTTP transport.
            const response = await withDeadline(
                getPointForecastData(
                    model,
                    { lat: point.lat, lon: point.lon, step: 3, days: 5, interpolate: false },
                    { header: true, celestial: true, meteogram: true, summary: true },
                ),
                20000,
                'The forecast request timed out. Please try again.',
            );
            if (!active || !requests.current(request)) return;
            if (!response || response.status < 200 || response.status >= 300)
                throw new Error('The selected forecast model is unavailable for this location.');
            forecast = normalizeForecast(response.data, 3);
            forecastCache.set(key, { forecast, at: Date.now() });
            if (forecastCache.size > 8) forecastCache.delete(forecastCache.keys().next().value!);
        } catch (e) {
            if (active && requests.current(request))
                error =
                    e instanceof Error
                        ? e.message
                        : 'The forecast service could not be reached. Please try again.';
        } finally {
            if (active && requests.current(request)) {
                loading = false;
                inFlightKey = '';
            }
        }
    }
    async function locate() {
        const request = positions.begin();
        locating = true;
        locationError = '';
        locationNotice = '';
        try {
            // Windy's API handles browser and native-app GPS. Never silently use an IP fallback.
            const gpsOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
                doNotShowFailureMessage: true,
                getMeFallbackGps: false,
            };
            const result = await withDeadline(
                getGPSlocation(gpsOptions),
                12000,
                'Location timed out. Try again or choose a point on the map.',
            );
            if (!active || !positions.current(request)) return;
            const point = resolveLocation(result);
            if (!point || result.source !== 'gps')
                throw new Error(
                    'A precise device location is unavailable. Search in Windy or choose a point on the map.',
                );
            chooseLocation(point, true);
            locationNotice = 'Using your device GPS location. Check the pin before planning.';
        } catch (e) {
            if (active && positions.current(request)) locationError = locationFailure(e);
        } finally {
            if (positions.current(request)) locating = false;
        }
    }
    function useMapCenter() {
        const center = map.getCenter();
        const lon = ((((center.lng + 180) % 360) + 360) % 360) - 180;
        const point = resolveLocation({ lat: center.lat, lon });
        if (point) chooseLocation(point);
    }
    function onMapClick(value: unknown) {
        const point = resolveLocation(value);
        if (point) chooseLocation(point);
    }
    function onPicker(value: unknown) {
        const point = resolveLocation(value);
        if (point && (awaitingSearch || compact)) chooseLocation(point);
    }
    function onNativeOpen(ident: string, params?: unknown) {
        if ((!awaitingSearch && !compact) || !['detail', 'picker', 'picker-mobile'].includes(ident))
            return;
        const point = resolveLocation(params);
        if (point) {
            pendingNativeClose.add(ident);
            chooseLocation(point);
            bcast.emit('rqstClose', 'search');
            bcast.emit('rqstClose', ident);
        }
    }
    function onNativeOpened(ident: string) {
        if (pendingNativeClose.delete(ident)) bcast.emit('rqstClose', ident);
    }
    function closePlanner() {
        const ownPlugin = (plugins as unknown as Record<string, { neverClose?: boolean }>)[
            config.name
        ];
        if (ownPlugin) ownPlugin.neverClose = false;
        bcast.emit('rqstClose', config.name);
    }
    function searchPlace() {
        compact = true;
        awaitingSearch = true;
        locationError = '';
        locationNotice =
            'Choose a result in Windy search. If needed, tap Map center after the map moves.';
        bcast.emit('rqstOpen', 'search');
    }
    export const onopen = (params?: unknown) => {
        const point = resolveLocation(params);
        if (point) void selectLocation(point);
        else if (location.name === 'Select a location') useMapCenter();
    };
    function nativeLayout(node: HTMLElement) {
        // Windy's small layout has a 200px cap. Scope our expandable shell to this window only.
        const windowNode = node.parentElement;
        const ownPlugin = (plugins as unknown as Record<string, { neverClose?: boolean }>)[
            config.name
        ];
        const previousNeverClose = ownPlugin?.neverClose;
        if (ownPlugin) ownPlugin.neverClose = true;
        if (windowNode) {
            // Escape the small-bottom stacking context so Windy's logo cannot intercept our controls.
            document.body.appendChild(windowNode);
            windowNode.classList.add('owp-native-window');
        }
        return {
            destroy: () => {
                windowNode?.classList.remove('owp-native-window');
                if (ownPlugin) ownPlugin.neverClose = previousNeverClose;
            },
        };
    }
    function isolateMapEvents(node: HTMLElement) {
        // Stop propagation without preventing native scrolling, text editing or focus.
        const events = ['click', 'dblclick', 'mousedown', 'pointerdown', 'touchstart', 'wheel'];
        const stop = (event: Event) => event.stopPropagation();
        events.forEach(event => node.addEventListener(event, stop, { passive: true }));
        return { destroy: () => events.forEach(event => node.removeEventListener(event, stop)) };
    }
    onMount(() => {
        active = true;
        stopClock = startLiveClock(now => (notBefore = now));
        singleclick.on(config.name, onMapClick);
        pickerEvents.on('pickerOpened', onPicker);
        pickerEvents.on('pickerMoved', onPicker);
        bcast.on('rqstOpen', onNativeOpen);
        bcast.on('pluginOpened', onNativeOpened);
        modelListener = store.on('product', () => void selectLocation(location));
        if (location.name === 'Select a location') useMapCenter();
        else void selectLocation(location);
    });
    onDestroy(() => {
        active = false;
        stopClock?.();
        requests.invalidate();
        positions.invalidate();
        singleclick.off(config.name, onMapClick);
        pickerEvents.off('pickerOpened', onPicker);
        pickerEvents.off('pickerMoved', onPicker);
        bcast.off('rqstOpen', onNativeOpen);
        bcast.off('pluginOpened', onNativeOpened);
        pendingNativeClose.clear();
        if (modelListener !== undefined) store.off(modelListener);
        marker?.remove();
        marker = null;
    });
</script>

<style>
    :global(#plugin-windy-plugin-outdoor-work-planner.owp-native-window) {
        z-index: 20 !important;
        position: fixed !important;
        top: auto !important;
        left: auto !important;
        right: 12px !important;
        bottom: max(24px, env(safe-area-inset-bottom)) !important;
        width: auto !important;
        height: auto !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
    }
    :global(.owp-native-window > .closing-x) {
        display: none !important;
    }
    .owp-planner-host {
        width: min(520px, calc(100vw - 24px));
        --owp-available-height: calc(
            100dvh - max(40px, calc(env(safe-area-inset-top, 0px) + 8px)) -
                max(24px, env(safe-area-inset-bottom, 0px))
        );
        height: min(850px, var(--owp-available-height));
        max-height: var(--owp-available-height);
        min-height: 0;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 8px 36px #0004;
    }
    .owp-planner-host.owp-map-mode {
        width: min(400px, calc(100vw - 24px));
        height: auto;
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
    @media (max-width: 600px) {
        :global(#plugin-windy-plugin-outdoor-work-planner.owp-native-window) {
            right: 8px !important;
        }
        .owp-planner-host {
            width: calc(100vw - 16px);
            border-radius: 12px;
        }
        .owp-planner-host.owp-map-mode {
            width: calc(100vw - 16px);
        }
    }
</style>
