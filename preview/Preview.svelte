<main class:owp-preview-compact={compact}>
    <Planner
        {forecast}
        {location}
        {error}
        {locating}
        {locationError}
        {locationNotice}
        bind:compact
        on:appearance={event => (document.documentElement.dataset.theme = event.detail)}
        on:location={event => {
            location = event.detail;
            locationError = '';
            locationNotice = 'Preview location updated. Forecast data remain sample data.';
        }}
        on:locate={locate}
        on:mapcenter={() => {
            location = { lat: 41.01, lon: 28.98, name: 'Istanbul, Türkiye' };
            locationNotice = 'Preview map center. Forecast data remain sample data.';
        }}
        on:searchplace={() => {
            compact = true;
            locationNotice =
                'City search opens Windy’s built-in search when running inside Windy. Use coordinates in this preview.';
        }}
        on:retry={() => {
            error = '';
            forecast = sampleForecast();
        }}
    />
</main>

<script lang="ts">
    import Planner from '../src/components/Planner.svelte';
    import { sampleForecast } from './sample';
    import { locationFailure, resolveLocation, withDeadline } from '../src/lib/location';
    import type { Forecast, Location } from '../src/lib/types';
    const scenario = new URLSearchParams(window.location.search).get('scenario');
    let forecast: Forecast | null =
        scenario === 'error' ? null : sampleForecast(scenario === 'missing');
    let error =
        scenario === 'error'
            ? 'This is a simulated connection error in the development preview.'
            : '';
    let location: Location = { lat: 41.01, lon: 28.98, name: 'Istanbul, Türkiye' };
    let compact = false,
        locating = false,
        locationError = '',
        locationNotice = '';
    async function locate() {
        locating = true;
        locationError = '';
        locationNotice = '';
        try {
            if (!navigator.geolocation)
                throw new Error(
                    'Your device does not provide location access. Use coordinates instead.',
                );
            const result = await withDeadline(
                new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 10000,
                        enableHighAccuracy: true,
                    }),
                ),
                12000,
                'Location timed out. Use coordinates instead.',
            );
            const point = resolveLocation({
                lat: result.coords.latitude,
                lon: result.coords.longitude,
            });
            if (point) location = point;
            locationNotice = 'Device location selected. Preview forecast data remain sample data.';
        } catch (e) {
            locationError = locationFailure(e);
        } finally {
            locating = false;
        }
    }
</script>

<style>
    :global(body) {
        margin: 0;
        background: #edf1ee;
        min-width: 300px;
    }
    :global(html[data-theme='dark'] body) {
        background: #0d1713;
    }
    main {
        max-width: 520px;
        height: min(850px, calc(100dvh - 60px));
        margin: 30px auto;
        border-radius: 12px;
        box-shadow: 0 8px 32px #172d2914;
        overflow: hidden;
    }
    main.owp-preview-compact {
        max-width: 400px;
        height: auto;
        margin-top: 40vh;
    }
    @media (max-width: 640px) {
        main {
            margin: 0 auto;
            height: 100dvh;
            border-radius: 0;
        }
        main.owp-preview-compact {
            margin: 50vh auto 0;
        }
    }
</style>
