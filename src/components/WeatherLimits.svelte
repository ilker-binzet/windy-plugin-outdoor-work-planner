<section class="owp-limits-section" aria-labelledby="limits-title">
    <div class="owp-section-heading">
        <h2 id="limits-title">Weather Limits</h2>
        <button class="owp-secondary owp-small" type="button" on:click={() => dispatch('reset')}
            >Reset</button
        >
    </div>
    <div class="owp-limit-grid">
        {#each fields as field}
            <div class="owp-limit-field">
                <div class="owp-limit-label">
                    <label for={'limit-' + field.key}>{field.label}</label><input
                        class="owp-enable-check"
                        type="checkbox"
                        aria-label={'Enable ' + field.label}
                        checked={limits[field.key] !== null}
                        on:change={event => toggle(field.key, event.currentTarget.checked)}
                    />
                </div>
                <div class:owp-muted-control={limits[field.key] === null} class="owp-unit-input">
                    <input
                        id={'limit-' + field.key}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.key === 'precipitation' ? '0.1' : '1'}
                        value={limits[field.key] ?? ''}
                        disabled={limits[field.key] === null}
                        on:input={event => update(field.key, event.currentTarget.valueAsNumber)}
                    /><span>{field.unit}</span>
                </div>
            </div>
        {/each}
        <div class="owp-limit-field owp-temperature-field">
            <div class="owp-limit-label"><span>Temperature</span></div>
            <div class="owp-temperature-range">
                {#each temperatureFields as field}
                    <div class="owp-temperature-part">
                        <label class="owp-sr-only" for={'limit-' + field.key}>{field.label}</label
                        ><input
                            type="checkbox"
                            class="owp-enable-check"
                            aria-label={'Enable ' + field.label}
                            checked={limits[field.key] !== null}
                            on:change={event => toggle(field.key, event.currentTarget.checked)}
                        /><input
                            id={'limit-' + field.key}
                            type="number"
                            min={field.min}
                            max={field.max}
                            value={limits[field.key] ?? ''}
                            disabled={limits[field.key] === null}
                            on:input={event => update(field.key, event.currentTarget.valueAsNumber)}
                        />
                    </div>
                    {#if field.key === 'minTemperature'}<span
                            class="owp-range-dash"
                            aria-hidden="true">–</span
                        >{/if}
                {/each}
                <span class="owp-range-unit">°C</span>
            </div>
        </div>
    </div>
    <p class="owp-field-help">
        Uncheck a limit to leave it out. Rain is the forecast interval average.
    </p>
</section>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { LIMIT_FIELDS } from '../lib/planner';
    import type { Limits } from '../lib/types';
    export let limits: Limits;
    const dispatch = createEventDispatcher<{ reset: void }>();
    const fields = LIMIT_FIELDS.filter(field => !field.key.includes('Temperature'));
    const temperatureFields = LIMIT_FIELDS.filter(field => field.key.includes('Temperature'));
    const remembered: Partial<Limits> = {};
    function update(key: keyof Limits, value: number) {
        limits = { ...limits, [key]: value };
    }
    function toggle(key: keyof Limits, enabled: boolean) {
        if (!enabled) remembered[key] = limits[key];
        const defaults: Limits = {
            wind: 20,
            gusts: 30,
            precipitation: 0,
            humidity: 80,
            minTemperature: 10,
            maxTemperature: 30,
        };
        limits = { ...limits, [key]: enabled ? (remembered[key] ?? defaults[key]) : null };
    }
</script>

<style>
    .owp-section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
    }
    .owp-limit-grid {
        display: grid;
        grid-template-columns: 1fr;
    }
    .owp-limit-field {
        display: grid;
        grid-template-columns: 1fr 160px;
        align-items: center;
        gap: 16px;
        padding: 18px 0;
        border-bottom: 1px solid var(--owp-border);
    }
    .owp-limit-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
    }
    .owp-enable-check {
        accent-color: var(--owp-green);
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin: 0;
        cursor: pointer;
    }
    .owp-unit-input {
        display: flex;
        align-items: center;
        border: 1px solid var(--owp-border);
        border-radius: 7px;
        overflow: hidden;
        height: 48px;
        background: var(--owp-surface);
    }
    .owp-unit-input:focus-within {
        outline: 2px solid var(--owp-green);
        outline-offset: 2px;
    }
    .owp-unit-input input {
        border: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        width: 100%;
        min-width: 0;
        padding: 10px 12px !important;
        height: 100% !important;
        background: transparent !important;
    }
    .owp-unit-input span {
        color: var(--owp-muted);
        padding-right: 12px;
        font-size: 12px;
        white-space: nowrap;
    }
    .owp-muted-control {
        background: var(--owp-soft);
        opacity: 0.6;
    }
    .owp-temperature-field {
        grid-template-columns: 1fr;
        gap: 12px;
    }
    .owp-temperature-range {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .owp-temperature-part {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;
    }
    .owp-temperature-part input[type='number'] {
        width: 100%;
        min-width: 0;
    }
    .owp-range-unit,
    .owp-range-dash {
        font-size: 13px;
        color: var(--owp-muted);
    }
    .owp-field-help {
        font-size: 12px !important;
        margin: 16px 0 0 !important;
        color: var(--owp-muted);
    }
    @media (max-width: 380px) {
        .owp-limit-field {
            grid-template-columns: 1fr 122px;
            gap: 12px;
        }
        .owp-temperature-field {
            grid-template-columns: 1fr;
        }
        .owp-limit-label {
            font-size: 12px;
        }
    }
</style>
