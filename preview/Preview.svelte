<main>
    <Planner
        {forecast}
        {location}
        {error}
        on:appearance={event => (document.documentElement.dataset.theme = event.detail)}
        on:location={event => (location = event.detail)}
        on:retry={() => {
            error = '';
            forecast = sampleForecast();
        }}
    />
</main>

<script lang="ts">
    import Planner from '../src/components/Planner.svelte';
    import { sampleForecast } from './sample';
    import type { Forecast, Location } from '../src/lib/types';
    const scenario = new URLSearchParams(window.location.search).get('scenario');
    let forecast: Forecast | null =
        scenario === 'error' ? null : sampleForecast(scenario === 'missing');
    let error =
        scenario === 'error'
            ? 'This is a simulated connection error in the development preview.'
            : '';
    let location: Location = { lat: 41.01, lon: 28.98, name: 'Istanbul, Türkiye' };
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
    :global(html[data-theme='dark'] main) {
        border-color: #3b5147;
        background: #15241f;
    }
    main {
        max-width: 600px;
        margin: 30px auto;
        background: white;
        border: 1px solid #dce5df;
        border-radius: 7px;
        overflow: hidden;
    }
    @media (max-width: 640px) {
        main {
            margin: 0 auto;
            border: 0;
            border-radius: 0;
            min-height: 100vh;
        }
    }
</style>
