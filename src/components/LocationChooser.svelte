<section class="owp-location-chooser" aria-label="Choose work location">
    <button
        class="owp-secondary owp-search-location"
        type="button"
        on:click={() => dispatch('searchplace')}
    >
        <Icon name="search" /> Search city or place in Windy
    </button>
    <div class="owp-location-actions">
        <button
            class="owp-secondary"
            type="button"
            disabled={locating}
            aria-busy={locating}
            on:click={() => dispatch('locate')}
        >
            <Icon name={locating ? 'refresh' : 'locate'} />{locating
                ? 'Locating…'
                : 'Use my location'}
        </button>
        <button class="owp-secondary" type="button" on:click={() => dispatch('mapcenter')}
            ><Icon name="target" />Map center</button
        >
    </div>
    {#if locationError}<p class="owp-location-error" role="alert">{locationError}</p>{/if}
    {#if locationNotice}<p class="owp-field-help" role="status">{locationNotice}</p>{/if}
    {#if !compact}<details class="owp-coordinates">
            <summary>Enter coordinates</summary>
            <form on:submit|preventDefault={changeLocation}>
                <div class="owp-coordinate-fields">
                    <label
                        >Latitude<input
                            type="number"
                            min="-85"
                            max="85"
                            step="any"
                            bind:value={latitude}
                            required
                        /></label
                    >
                    <label
                        >Longitude<input
                            type="number"
                            min="-180"
                            max="180"
                            step="any"
                            bind:value={longitude}
                            required
                        /></label
                    >
                </div>
                <button class="owp-secondary" type="submit">Use Location</button>
            </form>
        </details>{/if}
</section>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Icon from './Icon.svelte';
    import { coordinates } from '../lib/format';
    import type { Location } from '../lib/types';
    export let location: Location;
    export let locating = false;
    export let compact = false;
    export let locationError = '';
    export let locationNotice = '';
    let latitude: number | undefined;
    let longitude: number | undefined;
    let editorKey = '';
    $: if (editorKey !== `${location.lat},${location.lon}`) {
        editorKey = `${location.lat},${location.lon}`;
        latitude = location.lat;
        longitude = location.lon;
    }
    const dispatch = createEventDispatcher<{
        location: Location;
        locate: void;
        mapcenter: void;
        searchplace: void;
    }>();
    function changeLocation() {
        if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 85 ||
            Math.abs(longitude) > 180
        )
            return;
        dispatch('location', {
            lat: latitude,
            lon: longitude,
            name: coordinates(latitude, longitude),
        });
    }
</script>

<style>
    .owp-location-chooser {
        padding: 16px 0;
    }
    .owp-search-location {
        width: 100%;
        justify-content: flex-start !important;
        text-align: left;
    }
    .owp-location-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 10px;
    }
    .owp-coordinates {
        margin-top: 14px;
        font-size: 13px;
    }
    summary {
        cursor: pointer;
        padding: 8px 0;
        min-height: 40px;
    }
    .owp-coordinate-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 10px 0;
    }
    label {
        font-size: 12px;
        font-weight: 600;
    }
    input {
        display: block;
        width: 100%;
        margin-top: 6px !important;
    }
    .owp-location-error {
        color: var(--owp-warning-text);
        background: var(--owp-warning);
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
    }
</style>
