<div class="owp" class:owp-compact={compact} data-theme={resolvedTheme}>
    <header class="owp-planner-header">
        <div>
            <h1>Outdoor Work Planner</h1>
            {#if !compact}<p>Plan your next job around the weather.</p>{/if}
        </div>
        <div class="owp-header-actions">
            {#if !compact}<button
                    class="owp-secondary"
                    type="button"
                    on:click={() => setCompact(true)}><Icon name="map" size={18} />Map</button
                >
            {:else}<button
                    class="owp-icon-button"
                    aria-label="Expand planner"
                    type="button"
                    on:click={() => setCompact(false)}><Icon name="expand" /></button
                >{/if}
            {#if live}<button
                    class="owp-icon-button"
                    type="button"
                    aria-label="Close planner and return to Windy"
                    on:click={() => dispatch('close')}><Icon name="close" /></button
                >{/if}
        </div>
    </header>
    {#if compact}
        <!-- Focusable scroll regions allow keyboard users to reach overflowed controls. -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div class="owp-map-content" role="region" aria-label="Map location controls" tabindex="0">
            <LocationChooser
                {location}
                {locating}
                {locationError}
                locationNotice={locationNotice === 'Work location updated.' ? '' : locationNotice}
                compact={true}
                on:location
                on:locate
                on:mapcenter
                on:searchplace
            />
            <div class="owp-selected-place">
                <Icon name="pin" />
                <div>
                    <strong>{location.name}</strong>
                    <p>{coordinates(location.lat, location.lon)}</p>
                </div>
            </div>
            <p class="owp-field-help">Tap the map to choose a work location.</p>
            <button
                class="owp-primary owp-return-button"
                type="button"
                on:click={() => setCompact(false)}><Icon name="back" />Back to planner</button
            >
        </div>
    {:else}
        <section class="owp-location-section" aria-label="Work location">
            <Icon name="pin" size={22} />
            <div class="owp-location-text">
                <h2>{location.name}</h2>
                <p>{coordinates(location.lat, location.lon)}</p>
            </div>
            <button
                class="owp-text-button"
                type="button"
                aria-expanded={editingLocation}
                on:click={() => (editingLocation = !editingLocation)}>Change</button
            >
        </section>
        <div class="owp-tabs" role="tablist" aria-label="Planner sections">
            {#each tabs as item}<button
                    id={'owp-tab-' + item.id}
                    role="tab"
                    type="button"
                    aria-selected={tab === item.id}
                    aria-controls={'owp-panel-' + item.id}
                    tabindex={tab === item.id ? 0 : -1}
                    on:click={() => chooseTab(item.id)}
                    on:keydown={event => tabKey(event, item.id)}>{item.label}</button
                >{/each}
        </div>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
            class="owp-scroll"
            role="region"
            aria-label="Planner content"
            tabindex="0"
            bind:this={scrollRegion}
        >
            {#if forecast?.sample}<p class="owp-preview-notice">Preview · sample forecast</p>{/if}
            {#if editingLocation}<LocationChooser
                    {location}
                    {locating}
                    {locationError}
                    {locationNotice}
                    on:location
                    on:locate
                    on:mapcenter
                    on:searchplace
                />{/if}
            {#if loading}<p class="owp-data-message" role="status">
                    <span class="owp-loading-dot"></span>Loading forecast for this location…
                </p>
            {:else if error}<div class="owp-error-message" role="alert">
                    <h2>Unable to load the forecast</h2>
                    <p>{error}</p>
                    <button class="owp-secondary" type="button" on:click={() => dispatch('retry')}
                        >Try Again</button
                    >
                </div>{/if}
            <div
                role="tabpanel"
                id="owp-panel-plan"
                aria-labelledby="owp-tab-plan"
                hidden={tab !== 'plan'}
            >
                <h2 class="owp-page-title">Your work plan</h2>
                <form class="owp-planner-form" on:submit|preventDefault={search}>
                    <label class="owp-profile-label" for="work-profile">Work Profile</label>
                    <div class="owp-select-wrap">
                        <select id="work-profile" bind:value={preferences.profileId}
                            >{#each PROFILES as profile}<option value={profile.id}
                                    >{profile.name}</option
                                >{/each}</select
                        ><Icon name="chevron" size={18} />
                    </div>
                    <fieldset class="owp-hours-field">
                        <legend>Working Hours</legend>
                        <div class="owp-working-hours">
                            <label
                                ><span class="owp-sr-only">Working Hours Start</span><input
                                    type="time"
                                    bind:value={preferences.workStart}
                                    required
                                /></label
                            ><span>to</span><label
                                ><span class="owp-sr-only">Working Hours End</span><input
                                    type="time"
                                    bind:value={preferences.workEnd}
                                    required
                                /></label
                            >
                        </div>
                    </fieldset>
                    <label for="required-duration" class="owp-duration-label"
                        >Required Duration</label
                    >
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
                    <div class="owp-review-row">
                        <div>
                            <strong>Weather limits</strong>
                            <p>Wind, rain, temperature and more.</p>
                        </div>
                        <button
                            class="owp-secondary"
                            type="button"
                            on:click={() => chooseTab('limits')}
                            >Review limits<Icon name="arrow" size={16} /></button
                        >
                    </div>
                    {#if errors.length}<div class="owp-validation-errors" role="alert">
                            {#each errors as message}<p>{message}</p>{/each}
                        </div>{/if}
                    <button
                        class="owp-primary owp-find-button"
                        type="submit"
                        disabled={loading || !forecast || errors.length > 0}
                        >{loading ? 'Loading Forecast…' : 'Find Work Windows'}<Icon
                            name="arrow"
                        /></button
                    >
                </form>
            </div>
            <div
                role="tabpanel"
                id="owp-panel-limits"
                aria-labelledby="owp-tab-limits"
                hidden={tab !== 'limits'}
            >
                <WeatherLimits
                    bind:limits={preferences.profiles[preferences.profileId]}
                    on:reset={resetProfile}
                />
                {#if errors.length}<div class="owp-validation-errors" role="alert">
                        {#each errors as message}<p>{message}</p>{/each}
                    </div>{/if}
                <button
                    class="owp-primary owp-return-button"
                    type="button"
                    on:click={() => chooseTab('plan')}><Icon name="back" />Back to plan</button
                >
            </div>
            <div
                role="tabpanel"
                id="owp-panel-results"
                aria-labelledby="owp-tab-results"
                hidden={tab !== 'results'}
            >
                {#if evaluationError}<p class="owp-error-message" role="alert">{evaluationError}</p>
                {:else if forecast && evaluation && !errors.length}<WorkWindows
                        {forecast}
                        {evaluation}
                    />
                {:else}<div class="owp-empty-state">
                        <Icon name="clock" size={30} />
                        <h2>
                            {errors.length ? 'Review your settings' : 'Find your next work window'}
                        </h2>
                        <p>
                            {errors.length
                                ? 'Some settings need attention before calculating work windows.'
                                : 'Choose a work profile, check the limits and search for a continuous window.'}
                        </p>
                        <button
                            class="owp-secondary"
                            type="button"
                            on:click={() => chooseTab('plan')}>Back to plan</button
                        >
                    </div>{/if}
            </div>
            <footer class="owp-planner-footer">
                <div class="owp-footer-tools">
                    <div class="owp-author-credit">
                        <span>By <strong>Ilker Binzet</strong></span>
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
                            ><option value="system">System</option><option value="light"
                                >Light</option
                            ><option value="dark">Dark</option></select
                        >
                    </div>
                </div>
                <details class="owp-data-details">
                    <summary>Forecast &amp; planning notes</summary>{#if forecast}<p>
                            {forecast.sample ? 'Sample data' : forecast.model.toUpperCase()} · {forecast.stepHours}-hour
                            intervals · Local time · {forecast.timeZone}
                        </p>
                        <p>
                            {dateLabel(forecast.intervals[0].start, forecast.timeZone)} – {dateLabel(
                                forecast.intervals[forecast.intervals.length - 1].end,
                                forecast.timeZone,
                            )}{#if forecast.updatedAt}
                                · Updated {time(
                                    Date.parse(forecast.updatedAt),
                                    forecast.timeZone,
                                )}{/if}
                        </p>
                        {#if forecast.humidityEstimated}<p>
                                Humidity estimated from temperature and dew point.
                            </p>{/if}{/if}
                    <p>Profiles are editable starting points. Check your job requirements.</p>
                </details>
                {#if storageWarning}<p class="owp-storage-warning">
                        Preferences could not be saved on this device.
                    </p>{/if}
            </footer>
        </div>
    {/if}
    <div class="owp-sr-only" aria-live="polite" role="status">{feedback}</div>
</div>

<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import Icon from './Icon.svelte';
    import WeatherLimits from './WeatherLimits.svelte';
    import WorkWindows from './WorkWindows.svelte';
    import LocationChooser from './LocationChooser.svelte';
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
    export let locating = false;
    export let locationError = '';
    export let locationNotice = '';
    export let live = false;
    export let compact = false;
    const dispatch = createEventDispatcher<{
        location: Location;
        retry: void;
        search: void;
        appearance: 'light' | 'dark';
        locate: void;
        mapcenter: void;
        searchplace: void;
        close: void;
        compact: boolean;
    }>();
    type Tab = 'plan' | 'limits' | 'results';
    const tabs: { id: Tab; label: string }[] = [
        { id: 'plan', label: 'Plan' },
        { id: 'limits', label: 'Limits' },
        { id: 'results', label: 'Results' },
    ];
    let tab: Tab = 'plan';
    let scrollRegion: HTMLDivElement;
    let appearance: Appearance = 'system';
    let systemDark = false;
    let preferences = defaultPreferences();
    let mounted = false;
    let storage: PreferenceStorage | undefined;
    let storageWarning = false;
    let searched = false;
    let editingLocation = false;
    let evaluation: Evaluation | null = null;
    let evaluationError = '';
    let feedback = '';
    $: resolvedTheme = resolveAppearance(appearance, systemDark);
    $: if (mounted) {
        saveAppearance(storage, appearance);
        dispatch('appearance', resolvedTheme);
    }
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
    async function chooseTab(next: Tab) {
        tab = next;
        await tick();
        if (scrollRegion) scrollRegion.scrollTop = 0;
        document.getElementById('owp-tab-' + next)?.focus({ preventScroll: true });
    }
    async function tabKey(event: KeyboardEvent, current: Tab) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = tabs.findIndex(item => item.id === current);
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? 2
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
        await chooseTab(tabs[next].id);
        document.getElementById('owp-tab-' + tabs[next].id)?.focus();
    }
    async function setCompact(value: boolean) {
        compact = value;
        dispatch('compact', value);
        await tick();
        const target = document.querySelector<HTMLElement>(
            value ? '.owp-map-content button' : '.owp [role="tab"][aria-selected="true"]',
        );
        target?.focus({ preventScroll: true });
    }
    function search() {
        if (loading || !forecast || errors.length) return;
        dispatch('search');
        searched = true;
        feedback = 'Work windows updated.';
        void chooseTab('results');
    }
    function resetProfile() {
        const original = PROFILES.find(p => p.id === preferences.profileId)!;
        preferences = {
            ...preferences,
            profiles: { ...preferences.profiles, [original.id]: { ...original.limits } },
        };
        feedback = 'Weather limits reset for ' + original.name + '.';
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
    .owp {
        --owp-green: #175344;
        --owp-ink: #172d29;
        --owp-muted: #61716f;
        --owp-border: #dce5df;
        --owp-match: #eff6f1;
        --owp-surface: #fff;
        --owp-soft: #f4f7f5;
        --owp-action: #175344;
        --owp-on-action: #fff;
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
        line-height: 1.5;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        text-align: left;
        color-scheme: light;
        border-radius: 12px;
        overflow: hidden;
    }
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
    .owp :global(*) {
        box-sizing: border-box;
    }
    .owp :global([hidden]) {
        display: none !important;
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
        font-size: 20px;
        line-height: 1.25;
        letter-spacing: -0.5px !important;
        margin: 0;
        font-weight: 750;
    }
    .owp :global(h2) {
        font-size: 21px;
        line-height: 1.3;
        font-weight: 700;
        margin: 0;
    }
    .owp :global(p) {
        line-height: 1.5;
    }
    .owp :global(button),
    .owp :global(input),
    .owp :global(select),
    .owp :global(summary) {
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        color: var(--owp-ink);
        margin: 0;
        touch-action: manipulation;
    }
    .owp :global(button) {
        transition:
            background 0.15s,
            box-shadow 0.15s,
            transform 0.12s;
        -webkit-tap-highlight-color: transparent;
    }
    .owp :global(button:active:not(:disabled)) {
        transform: translateY(1px) scale(0.98);
        box-shadow: inset 0 2px 4px #0002;
    }
    .owp :global(button:focus-visible),
    .owp :global(input:focus-visible),
    .owp :global(select:focus-visible),
    .owp :global(summary:focus-visible),
    .owp-scroll:focus-visible,
    .owp-map-content:focus-visible {
        outline: 2px solid var(--owp-green);
        outline-offset: -3px;
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
        border-radius: 7px;
        padding: 12px;
        height: 48px;
        font-weight: 400;
        min-width: 0;
        box-shadow: none;
        font-size: 16px;
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
    .owp :global(.owp-primary),
    .owp :global(.owp-secondary),
    .owp-icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid var(--owp-border);
        border-radius: 7px;
        padding: 10px 12px;
        min-height: 44px;
        background: var(--owp-surface);
        color: var(--owp-ink);
        cursor: pointer;
        font-weight: 600;
    }
    .owp :global(.owp-primary) {
        background: var(--owp-action);
        color: var(--owp-on-action);
        border-color: var(--owp-action);
        min-height: 48px;
    }
    .owp :global(.owp-primary:hover:not(:disabled)) {
        background: var(--owp-action-hover);
    }
    .owp :global(.owp-secondary:hover:not(:disabled)),
    .owp-icon-button:hover {
        background: var(--owp-soft);
    }
    .owp-icon-button {
        width: 44px;
        flex-shrink: 0;
        padding: 8px;
    }
    .owp-planner-header {
        padding: 20px 22px 16px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
    }
    .owp-planner-header > div:first-child {
        min-width: 0;
    }
    .owp-planner-header p {
        font-size: 12px;
        color: var(--owp-muted);
        margin: 6px 0 0;
    }
    .owp-header-actions {
        display: flex;
        gap: 6px;
        align-items: center;
    }
    .owp-location-section,
    .owp-selected-place {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        background: var(--owp-soft);
        border-radius: 8px;
    }
    .owp-location-section {
        margin: 0 22px 12px;
        flex-shrink: 0;
    }
    .owp-location-section :global(svg),
    .owp-selected-place :global(svg) {
        flex-shrink: 0;
        color: var(--owp-green);
    }
    .owp-location-text {
        min-width: 0;
        flex: 1;
    }
    .owp-location-text h2 {
        font-size: 15px;
        overflow-wrap: anywhere;
    }
    .owp-location-text p,
    .owp-selected-place p {
        margin: 3px 0 0;
        font-size: 12px;
        color: var(--owp-muted);
    }
    .owp-text-button {
        background: transparent;
        border: 0;
        color: var(--owp-green) !important;
        font-weight: 600;
        padding: 8px;
        min-height: 44px;
        cursor: pointer;
    }
    .owp-tabs {
        display: flex;
        margin: 0 22px;
        border-bottom: 1px solid var(--owp-border);
        flex-shrink: 0;
    }
    .owp-tabs button {
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        min-height: 46px;
        width: 33.333%;
        color: var(--owp-muted);
        cursor: pointer;
    }
    .owp-tabs button[aria-selected='true'] {
        color: var(--owp-green);
        border-bottom-color: var(--owp-green);
        font-weight: 700;
    }
    .owp-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior-y: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
        padding: 24px 22px max(22px, env(safe-area-inset-bottom));
        scrollbar-width: thin;
        scrollbar-color: var(--owp-border) transparent;
    }
    .owp-page-title {
        margin-bottom: 24px !important;
    }
    .owp-profile-label,
    .owp-duration-label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
    }
    .owp-select-wrap {
        position: relative;
    }
    .owp-select-wrap select {
        width: 100%;
        appearance: none;
        padding-right: 36px;
    }
    .owp-select-wrap :global(svg) {
        position: absolute;
        right: 14px;
        top: 15px;
        pointer-events: none;
        color: var(--owp-muted);
    }
    .owp-hours-field {
        border: 0;
        padding: 0;
        margin: 24px 0;
    }
    .owp-hours-field legend {
        padding: 0;
        font-weight: 600;
        margin-bottom: 8px;
    }
    .owp-working-hours {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .owp-working-hours label {
        flex: 1;
        min-width: 0;
    }
    .owp-working-hours input {
        width: 100%;
    }
    .owp-working-hours > span {
        font-size: 12px;
        color: var(--owp-muted);
    }
    .owp-duration-input {
        display: flex;
        align-items: center;
        border: 1px solid var(--owp-border);
        border-radius: 7px;
    }
    .owp-duration-input input {
        width: 100%;
        flex: 1;
        border: 0 !important;
        background: transparent !important;
    }
    .owp-duration-input > span {
        padding-right: 14px;
        color: var(--owp-muted);
        font-size: 13px;
    }
    .owp-review-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-top: 1px solid var(--owp-border);
        margin: 28px 0;
        padding-top: 20px;
    }
    .owp-review-row p {
        font-size: 11px;
        color: var(--owp-muted);
        margin: 3px 0 0;
    }
    .owp-review-row button {
        font-size: 12px;
        flex-shrink: 0;
    }
    .owp-find-button,
    .owp-return-button {
        width: 100%;
    }
    .owp-find-button {
        justify-content: space-between !important;
    }
    .owp-return-button {
        margin-top: 20px !important;
    }
    .owp-planner-footer {
        border-top: 1px solid var(--owp-border);
        padding-top: 18px;
        margin-top: 26px;
        color: var(--owp-muted);
    }
    .owp-footer-tools {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    }
    .owp-author-credit {
        font-size: 11px;
    }
    .owp-author-credit strong {
        color: var(--owp-ink);
    }
    .owp-author-credit nav {
        display: flex;
        gap: 12px;
        margin-top: 8px;
    }
    .owp-author-credit a {
        color: var(--owp-green);
        text-decoration: underline;
        text-underline-offset: 2px;
        padding: 4px 0;
    }
    .owp-appearance-control {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
    }
    .owp-appearance-control select {
        height: 38px !important;
        padding: 6px 10px !important;
        font-size: 12px !important;
    }
    .owp-data-details {
        font-size: 11px;
        margin-top: 16px;
    }
    .owp-data-details summary {
        min-height: 32px;
        cursor: pointer;
        font-size: 11px;
    }
    .owp-data-details p {
        font-size: 11px;
        margin: 6px 0;
    }
    .owp :global(.owp-field-help) {
        font-size: 12px;
        color: var(--owp-muted);
        margin: 12px 0;
    }
    .owp-preview-notice {
        font-size: 11px;
        color: var(--owp-muted);
        margin: 0 0 16px;
    }
    .owp-validation-errors,
    .owp-error-message {
        background: var(--owp-warning);
        color: var(--owp-warning-text);
        padding: 14px;
        border-radius: 7px;
        margin: 12px 0;
    }
    .owp-error-message h2 {
        font-size: 17px;
    }
    .owp-error-message p,
    .owp-validation-errors p {
        margin: 6px 0;
        font-size: 12px;
    }
    .owp-data-message {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 18px;
        color: var(--owp-muted);
    }
    .owp-loading-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--owp-action);
        animation: owp-pulse 1.2s ease-in-out infinite;
    }
    .owp-empty-state {
        padding: 28px 0;
        color: var(--owp-muted);
    }
    .owp-empty-state h2 {
        color: var(--owp-ink);
        margin-top: 14px;
    }
    .owp-empty-state p {
        font-size: 13px;
        margin: 12px 0 18px;
    }
    .owp-map-content {
        overflow-y: auto;
        min-height: 0;
        overscroll-behavior: contain;
        touch-action: pan-y;
        padding: 0 20px 20px;
    }
    .owp-compact .owp-planner-header {
        padding: 16px 20px 0;
        align-items: center;
    }
    .owp-compact h1 {
        font-size: 17px;
    }
    .owp-compact .owp-field-help {
        font-size: 11px;
        margin: 8px 0;
    }
    .owp-compact .owp-return-button {
        margin-top: 12px !important;
    }
    .owp-compact {
        height: auto;
        max-height: min(460px, 55dvh);
    }
    @keyframes owp-pulse {
        50% {
            opacity: 0.3;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .owp :global(*) {
            transition: none !important;
            animation: none !important;
        }
    }
    @media (max-width: 380px) {
        .owp-planner-header {
            padding: 16px 16px 12px;
            gap: 8px;
        }
        .owp h1 {
            font-size: 18px;
        }
        .owp-location-section {
            margin-left: 16px;
            margin-right: 16px;
        }
        .owp-tabs {
            margin: 0 16px;
        }
        .owp-scroll {
            padding-left: 16px;
            padding-right: 16px;
        }
        .owp-header-actions .owp-secondary {
            font-size: 12px;
            padding: 8px;
        }
        .owp-review-row {
            align-items: flex-start;
            flex-direction: column;
        }
    }
</style>
