<div class="owp" data-theme={resolvedTheme}>
    <header class="owp-planner-header">
        <div>
            <h1>Outdoor Work Planner</h1>
            <p>Find a weather window for your next job.</p>
        </div>
        {#if forecast?.sample}<span class="owp-preview-notice">Preview · sample forecast</span>{/if}
    </header>
    <section class="owp-location-section" aria-label="Work location">
        <span class="owp-location-icon"><Icon name="pin" size={25} /></span>
        <div class="owp-location-text">
            <h2>{location.name}</h2>
            <p>
                {coordinates(location.lat, location.lon)}{#if forecast}
                    · {forecast.timeZone}{/if}
            </p>
        </div>
        <button
            class="owp-text-button"
            type="button"
            on:click={() => {
                latitude = location.lat;
                longitude = location.lon;
                editingLocation = !editingLocation;
            }}>Change</button
        >
    </section>
    {#if editingLocation}
        <form class="owp-location-editor" on:submit|preventDefault={changeLocation}>
            <div class="owp-coordinate-fields">
                <label
                    >Latitude<input
                        type="number"
                        step="any"
                        min="-85"
                        max="85"
                        bind:value={latitude}
                        required
                    /></label
                ><label
                    >Longitude<input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        bind:value={longitude}
                        required
                    /></label
                >
            </div>
            <div class="owp-editor-actions">
                <button
                    class="owp-secondary"
                    type="button"
                    on:click={() => (editingLocation = false)}>Cancel</button
                ><button class="owp-primary" type="submit">Use Location</button>
            </div>
            <p class="owp-field-help">You can also select a location on the Windy map.</p>
        </form>
    {/if}
    <form
        class="owp-planner-form"
        on:submit|preventDefault={() => {
            dispatch('search');
            searched = true;
        }}
    >
        <label class="owp-profile-label" for="work-profile">Work Profile</label>
        <div class="owp-select-wrap">
            <select id="work-profile" bind:value={preferences.profileId}
                >{#each PROFILES as profile}<option value={profile.id}>{profile.name}</option
                    >{/each}</select
            ><Icon name="chevron" size={18} />
        </div>
        <WeatherLimits
            bind:limits={preferences.profiles[preferences.profileId]}
            on:reset={resetProfile}
        />
        <div class="owp-schedule-grid">
            <fieldset>
                <legend>Working Hours</legend>
                <div class="owp-working-hours">
                    <label class="owp-sr-only" for="work-start">Working Hours Start</label><input
                        id="work-start"
                        type="time"
                        bind:value={preferences.workStart}
                        required
                    /><span>to</span><label class="owp-sr-only" for="work-end"
                        >Working Hours End</label
                    ><input id="work-end" type="time" bind:value={preferences.workEnd} required />
                </div>
            </fieldset>
            <div>
                <label for="required-duration" class="owp-duration-label">Required Duration</label>
                <div class="owp-duration-input">
                    <input
                        id="required-duration"
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        bind:value={preferences.minimumHours}
                        required
                    /><span>hours</span>
                </div>
            </div>
        </div>
        {#if errors.length}<div class="owp-validation-errors" role="alert">
                {#each errors as message}<p>{message}</p>{/each}
            </div>{/if}
        <button
            class="owp-primary owp-find-button"
            type="submit"
            disabled={loading || !forecast || errors.length > 0}
            ><Icon name="arrow" size={21} />{loading
                ? 'Loading Forecast…'
                : 'Find Work Windows'}</button
        >
    </form>
    {#if loading}<div class="owp-data-message" role="status">
            <span class="owp-loading-dot"></span>Loading forecast for this location…
        </div>
    {:else if error}<div class="owp-error-message" role="alert">
            <h2>Unable to load the forecast</h2>
            <p>{error}</p>
            <button class="owp-secondary" type="button" on:click={() => dispatch('retry')}
                >Try Again</button
            >
        </div>
    {:else if evaluationError}<div class="owp-error-message" role="alert">{evaluationError}</div>
    {:else if forecast && evaluation && searched && !errors.length}<WorkWindows
            {forecast}
            {evaluation}
        />
    {:else if !forecast}<p class="owp-data-message">Select a work location to load the forecast.</p>
    {:else if !errors.length}<div class="owp-ready-message">
            <Icon name="clock" size={20} />
            <p>Set your limits and find a continuous window for your job.</p>
        </div>{/if}
    <footer class="owp-planner-footer">
        <div class="owp-footer-tools">
            <div class="owp-author-credit">
                <span>Created by</span><strong>Ilker Binzet</strong>
                <nav aria-label="Author links">
                    <a
                        href="https://ca.linkedin.com/in/binzet-me"
                        target="_blank"
                        rel="noopener noreferrer">LinkedIn</a
                    ><a
                        href="https://github.com/ilker-binzet"
                        target="_blank"
                        rel="noopener noreferrer">GitHub</a
                    >
                </nav>
            </div>
            <div class="owp-appearance-control">
                <label for="appearance">Appearance</label><select
                    id="appearance"
                    bind:value={appearance}
                    ><option value="system">System</option><option value="light">Light</option
                    ><option value="dark">Dark</option></select
                >
            </div>
        </div>
        {#if forecast}<p>
                {forecast.sample ? 'Sample data' : forecast.model.toUpperCase()} · {forecast.stepHours}-hour
                intervals · Local time
            </p>
            <p>
                {dateLabel(forecast.intervals[0].start, forecast.timeZone)} – {dateLabel(
                    forecast.intervals[forecast.intervals.length - 1].end,
                    forecast.timeZone,
                )}{#if forecast.updatedAt}
                    · Updated {time(Date.parse(forecast.updatedAt), forecast.timeZone)}{/if}
            </p>
            {#if forecast.humidityEstimated}<p>
                    Humidity estimated from temperature and dew point.
                </p>{/if}{/if}
        <p>Profiles are editable starting points. Check your job requirements.</p>
        {#if storageWarning}<p class="owp-storage-warning">
                Preferences could not be saved on this device.
            </p>{/if}
    </footer>
</div>

<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import Icon from './Icon.svelte';
    import WeatherLimits from './WeatherLimits.svelte';
    import WorkWindows from './WorkWindows.svelte';
    import { coordinates, dateLabel, time } from '../lib/format';
    import { evaluateForecast, validateSettings } from '../lib/planner';
    import { defaultPreferences, PROFILES, settingsFrom } from '../lib/profiles';
    import { loadPreferences, savePreferences } from '../lib/preferences';
    import { loadAppearance, resolveAppearance, saveAppearance } from '../lib/appearance';
    import type { Appearance } from '../lib/appearance';
    import type { PreferenceStorage } from '../lib/preferences';
    import type { Evaluation, Forecast, Location } from '../lib/types';
    export let forecast: Forecast | null = null;
    export let location: Location = { lat: 41.01, lon: 28.98, name: 'Istanbul, Türkiye' };
    export let loading = false;
    export let error = '';
    export let notBefore = 0;
    const dispatch = createEventDispatcher<{
        location: Location;
        retry: void;
        search: void;
        appearance: 'light' | 'dark';
    }>();
    let appearance: Appearance = 'system';
    let systemDark = false;
    $: resolvedTheme = resolveAppearance(appearance, systemDark);
    $: if (mounted) {
        saveAppearance(storage, appearance);
        dispatch('appearance', resolvedTheme);
    }
    let preferences = defaultPreferences();
    let mounted = false;
    let storage: PreferenceStorage | undefined;
    let storageWarning = false;
    let searched = false;
    let editingLocation = false;
    let latitude: number | undefined = location.lat;
    let longitude: number | undefined = location.lon;
    let evaluation: Evaluation | null = null;
    let evaluationError = '';
    $: settings = settingsFrom(preferences);
    $: errors = validateSettings(settings);
    $: if (mounted && !errors.length) storageWarning = !savePreferences(storage, preferences);
    $: {
        evaluation = null;
        evaluationError = '';
        if (forecast && !loading && !error && searched && !errors.length) {
            try {
                evaluation = evaluateForecast(
                    forecast.intervals,
                    settings,
                    forecast.timeZone,
                    notBefore,
                );
            } catch (e) {
                evaluationError =
                    e instanceof Error ? e.message : 'The forecast could not be evaluated.';
            }
        }
    }
    function resetProfile() {
        const original = PROFILES.find(p => p.id === preferences.profileId)!;
        preferences = {
            ...preferences,
            profiles: { ...preferences.profiles, [original.id]: { ...original.limits } },
        };
    }
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
        editingLocation = false;
    }
    onMount(() => {
        try {
            storage = window.localStorage;
        } catch {
            storage = undefined;
        }
        preferences = loadPreferences(storage);
        appearance = loadAppearance(storage);
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        systemDark = media.matches;
        const onSystemTheme = (event: MediaQueryListEvent) => (systemDark = event.matches);
        media.addEventListener('change', onSystemTheme);
        mounted = true;
        return () => media.removeEventListener('change', onSystemTheme);
    });
</script>

<style>
    .owp[data-theme='dark'] {
        --owp-green: #8bd3b4;
        --owp-ink: #e5eee8;
        --owp-muted: #adbbb3;
        --owp-border: #3b5147;
        --owp-match: #203b2e;
        --owp-surface: #15241f;
        --owp-soft: #20332a;
        --owp-action: #8bd3b4;
        --owp-on-action: #10271d;
        --owp-action-hover: #a6e2c8;
        --owp-match-text: #a4dfb9;
        --owp-match-border: #38644b;
        --owp-warning: #3b3020;
        --owp-warning-text: #f1ce87;
        color-scheme: dark;
    }
    .owp-footer-tools {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        padding: 4px 0 15px;
        margin-bottom: 11px;
        border-bottom: 1px solid var(--owp-border);
    }
    .owp-author-credit {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 11px;
    }
    .owp-author-credit > strong {
        font-size: 14px;
        color: var(--owp-ink);
        font-weight: 650;
    }
    .owp-author-credit nav {
        display: flex;
        gap: 12px;
        margin-top: 3px;
    }
    .owp-author-credit a {
        color: var(--owp-green);
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .owp-appearance-control {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 11px;
    }
    .owp-appearance-control select {
        height: 33px !important;
        min-width: 103px;
        font-size: 12px !important;
        padding: 5px 8px !important;
    }

    .owp {
        --owp-green: #175344;
        --owp-ink: #172d29;
        --owp-muted: #61716f;
        --owp-border: #dce5df;
        --owp-match: #eff6f1;
        --owp-surface: #ffffff;
        --owp-soft: #f4f7f5;
        --owp-action: #175344;
        --owp-on-action: #ffffff;
        --owp-action-hover: #103f33;
        --owp-match-text: #17653e;
        --owp-match-border: #d2e6dc;
        --owp-warning: #fff4e5;
        --owp-warning-text: #78541d;
        color: var(--owp-ink);
        background: var(--owp-surface);
        font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        font-size: 14px;
        line-height: 1.45;
        padding: 25px 28px;
        box-sizing: border-box;
        width: 100%;
        text-align: left;
        color-scheme: light;
    }
    .owp :global(*) {
        box-sizing: border-box;
    }
    .owp :global(h1),
    .owp :global(h2),
    .owp :global(h3),
    .owp :global(p) {
        font-family: inherit;
        text-transform: none;
        letter-spacing: normal;
    }
    .owp h1 {
        font-size: 26px;
        line-height: 1.15;
        letter-spacing: -0.8px !important;
        font-weight: 750;
        margin: 0;
    }
    .owp :global(h2) {
        font-size: 18px;
        line-height: 1.3;
        font-weight: 700;
        margin: 0;
    }
    .owp :global(p) {
        line-height: 1.5;
    }
    .owp :global(button),
    .owp :global(input),
    .owp :global(select) {
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        color: var(--owp-ink);
        margin: 0;
    }
    .owp :global(button) {
        transition:
            background 0.15s,
            border-color 0.15s;
    }
    .owp :global(button:focus-visible),
    .owp :global(input:focus-visible),
    .owp :global(select:focus-visible),
    .owp :global(summary:focus-visible) {
        outline: 2px solid var(--owp-green);
        outline-offset: 3px;
    }
    .owp :global(button:disabled) {
        cursor: not-allowed;
        opacity: 0.5;
    }
    .owp :global(input[type='number']),
    .owp :global(input[type='time']),
    .owp :global(select) {
        border: 1px solid var(--owp-border);
        background: var(--owp-surface);
        border-radius: 5px;
        padding: 9px 10px;
        height: 39px;
        font-weight: 400;
        min-width: 0;
        box-shadow: none;
    }
    .owp :global(input:disabled) {
        color: #82918c;
    }
    .owp :global(.owp-sr-only) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    .owp :global(.owp-primary) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        border: 1px solid var(--owp-green);
        border-radius: 5px;
        background: var(--owp-action);
        color: var(--owp-on-action);
        font-weight: 600;
        min-height: 39px;
        padding: 8px 15px;
        cursor: pointer;
    }
    .owp :global(.owp-primary:hover:not(:disabled)) {
        background: var(--owp-action-hover);
    }
    .owp :global(.owp-secondary) {
        background: var(--owp-surface);
        border: 1px solid var(--owp-border);
        border-radius: 5px;
        padding: 7px 11px;
        font-size: 12px;
        cursor: pointer;
        min-height: 34px;
    }
    .owp :global(.owp-secondary:hover) {
        background: var(--owp-soft);
    }
    .owp :global(.owp-text-button) {
        border: 0;
        padding: 5px 0;
        background: transparent;
        color: var(--owp-green);
        font-size: 13px;
        font-weight: 600;
        text-decoration: underline;
        cursor: pointer;
    }
    .owp-planner-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid var(--owp-border);
        padding-bottom: 18px;
    }
    .owp-planner-header > div {
        flex: 1;
        min-width: 230px;
    }
    .owp-planner-header p {
        color: var(--owp-muted);
        font-size: 14px;
        margin: 7px 0 0;
    }
    .owp-preview-notice {
        font-size: 10px;
        color: var(--owp-muted);
        padding: 4px 7px;
        border: 1px solid #a8bcb3;
        border-radius: 4px;
        white-space: nowrap;
    }
    .owp-location-section {
        display: flex;
        gap: 13px;
        align-items: center;
        padding: 18px 0 20px;
    }
    .owp-location-icon {
        color: var(--owp-muted);
        flex-shrink: 0;
    }
    .owp-location-text {
        flex: 1;
        min-width: 0;
    }
    .owp-location-text h2 {
        font-size: 17px;
        overflow-wrap: anywhere;
    }
    .owp-location-text p {
        font-size: 11px;
        color: var(--owp-muted);
        margin: 3px 0 0;
        overflow-wrap: anywhere;
    }
    .owp-profile-label,
    .owp-duration-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin: 0 0 6px;
    }
    .owp-select-wrap {
        position: relative;
    }
    .owp-select-wrap select {
        width: 100%;
        appearance: none;
        cursor: pointer;
        padding-right: 35px;
    }
    .owp-select-wrap :global(svg) {
        position: absolute;
        right: 12px;
        top: 10px;
        pointer-events: none;
        color: var(--owp-muted);
    }
    .owp :global(.owp-limits-section) {
        margin: 19px 0;
    }
    .owp :global(.owp-section-heading) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    .owp-schedule-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin: 17px 0 15px;
    }
    .owp-schedule-grid fieldset {
        padding: 0;
        margin: 0;
        min-width: 0;
        border: 0;
    }
    .owp-schedule-grid legend {
        padding: 0;
        margin: 0 0 6px;
        font-size: 13px;
        font-weight: 600;
    }
    .owp-working-hours {
        display: flex;
        gap: 7px;
        align-items: center;
        min-width: 0;
    }
    .owp-working-hours input {
        width: 100%;
        min-width: 0;
        font-size: 12px;
        padding: 8px 6px;
    }
    .owp-working-hours span {
        font-size: 12px;
    }
    .owp-duration-input {
        display: flex;
        align-items: center;
        height: 39px;
        border: 1px solid var(--owp-border);
        border-radius: 5px;
        overflow: hidden;
    }
    .owp-duration-input input {
        width: 100%;
        min-width: 0;
        border: 0 !important;
        box-shadow: none !important;
        height: 100% !important;
    }
    .owp-duration-input span {
        font-size: 12px;
        color: var(--owp-muted);
        padding-right: 10px;
    }
    .owp-find-button {
        width: 100%;
        font-size: 15px !important;
        min-height: 43px !important;
    }
    .owp-planner-footer {
        border-top: 1px solid var(--owp-border);
        padding-top: 11px;
        margin-top: 18px;
        color: var(--owp-muted);
    }
    .owp-planner-footer p {
        font-size: 10px;
        margin: 3px 0;
    }
    .owp-storage-warning {
        color: #876321;
    }
    .owp-location-editor {
        padding: 14px;
        background: var(--owp-soft);
        margin-bottom: 18px;
        border-radius: 5px;
    }
    .owp-coordinate-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .owp-coordinate-fields label {
        font-size: 12px;
        font-weight: 600;
    }
    .owp-coordinate-fields input {
        display: block;
        width: 100%;
        margin-top: 5px;
    }
    .owp-editor-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 12px;
    }
    .owp-field-help {
        font-size: 11px;
        color: var(--owp-muted);
        margin: 10px 0 0;
    }
    .owp-validation-errors,
    .owp-error-message {
        background: var(--owp-warning);
        color: var(--owp-warning-text);
        padding: 12px;
        border-radius: 5px;
        margin: 12px 0;
    }
    .owp-validation-errors p,
    .owp-error-message p {
        font-size: 12px;
        margin: 3px 0;
    }
    .owp-error-message h2 {
        font-size: 15px;
        margin-bottom: 5px;
    }
    .owp-error-message button {
        margin-top: 10px;
    }
    .owp-data-message,
    .owp-ready-message {
        font-size: 13px;
        color: var(--owp-muted);
        padding: 18px 0 0;
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .owp-ready-message p {
        margin: 0;
        font-size: 12px;
    }
    .owp-loading-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--owp-action);
        animation: pulse 1.2s ease-in-out infinite;
    }
    @keyframes pulse {
        50% {
            opacity: 0.3;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .owp-loading-dot {
            animation: none;
        }
        .owp :global(*) {
            transition: none !important;
        }
    }
    @media (max-width: 480px) {
        .owp {
            padding: 20px;
        }
        .owp h1 {
            font-size: 24px;
        }
        .owp-planner-header > div {
            min-width: 0;
            flex-basis: 100%;
        }
        .owp-planner-header {
            gap: 9px;
        }
        .owp-planner-header p {
            font-size: 13px;
        }
        .owp-schedule-grid {
            grid-template-columns: 1fr;
            gap: 13px;
        }
        .owp-working-hours input {
            font-size: 14px;
            flex: 1;
        }
        .owp-duration-input {
            max-width: none;
        }
        .owp-location-section {
            gap: 10px;
        }
        .owp-location-text h2 {
            font-size: 16px;
        }
    }
    @media (max-width: 360px) {
        .owp {
            padding: 16px;
        }
        .owp h1 {
            font-size: 22px;
        }
    }
</style>
