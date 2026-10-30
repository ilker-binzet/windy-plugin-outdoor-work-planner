<section class="owp-results" aria-labelledby="results-title" aria-live="polite">
    <h2 id="results-title">Work Windows</h2>
    <p class="owp-result-summary">
        {evaluation.windows.length} matching {evaluation.windows.length === 1
            ? 'window'
            : 'windows'} · {forecast.sample ? 'sample forecast' : forecast.model.toUpperCase()}
    </p>
    <div class="owp-day-tabs" aria-label="Filter work windows by day">
        <button
            type="button"
            class:owp-active={selectedDay === ''}
            aria-pressed={selectedDay === ''}
            on:click={() => (selectedDay = '')}>All Days</button
        >
        {#each days as day}<button
                type="button"
                class:owp-active={selectedDay === day.key}
                aria-pressed={selectedDay === day.key}
                on:click={() => (selectedDay = day.key)}
                >{dayLabel(day.timestamp, forecast.timeZone)}</button
            >{/each}
    </div>
    {#if timeline.length}
        <div class="owp-timeline-labels">
            <span>{dateLabel(timeline[0].interval.start, forecast.timeZone)}</span><span
                >{time(timeline[0].interval.start, forecast.timeZone)} – {time(
                    timeline[timeline.length - 1].interval.end,
                    forecast.timeZone,
                )}</span
            >
        </div>
        <div class="owp-timeline" aria-label="Forecast intervals for the selected day">
            {#each timeline as check, index}
                {#if index > 0 && timeline[index - 1].interval.end < check.interval.start}<span
                        class="owp-timeline-gap"
                        style:flex-grow={check.interval.start - timeline[index - 1].interval.end}
                        title="Forecast coverage gap"
                    ></span>{/if}
                <span
                    class={'owp-timeline-' + check.status}
                    style:flex-grow={check.interval.end - check.interval.start}
                    title={`${time(check.interval.start, forecast.timeZone)}–${time(check.interval.end, forecast.timeZone)}: ${check.reasons.join('; ') || 'Matches your limits'}`}
                ></span>
            {/each}
        </div>
        <div class="owp-legend">
            <span><i class="owp-match-dot"></i>Matches your limits</span><span
                ><i class="owp-outside-dot"></i>Outside your limits</span
            >{#if timeline.some(c => c.status === 'unavailable')}<span
                    ><i class="owp-unknown-dot"></i>Unavailable</span
                >{/if}
        </div>
    {/if}
    {#if !visibleWindows.length}
        <div class="owp-empty-result">
            <Icon name="clock" size={25} />
            <div>
                <h3>{allUnavailable ? 'Data Unavailable' : 'No Matching Windows'}</h3>
                <p>
                    {allUnavailable
                        ? 'Required weather data are missing. Review the interval details below or choose another model.'
                        : 'No continuous interval meets your limits and required duration' +
                          (selectedDay ? ' on this day.' : '.')}
                </p>
            </div>
        </div>
    {:else}
        <div class="owp-window-list">
            {#each visibleWindows as window}
                <article class="owp-work-window">
                    <div class="owp-window-banner">
                        <span class="owp-check-icon"><Icon name="check" size={25} /></span>
                        <div class="owp-window-time">
                            <h3>
                                {time(window.start, forecast.timeZone)} – {time(
                                    window.end,
                                    forecast.timeZone,
                                )}
                            </h3>
                            <p>
                                {dateLabel(
                                    window.start,
                                    forecast.timeZone,
                                )}{#if dayKey(window.start, forecast.timeZone) !== dayKey(window.end - 1, forecast.timeZone)}
                                    – {dateLabel(window.end - 1, forecast.timeZone)}{/if} · {number(
                                    (window.end - window.start) / 3600000,
                                )} uninterrupted hours
                            </p>
                        </div>
                        <span class="owp-match-status">Matches Your Limits</span>
                    </div>
                    <div class="owp-measurements">
                        <div>
                            <span>Wind, max.</span><strong
                                >{number(extreme(window, 'wind'))} <small>km/h</small></strong
                            >
                        </div>
                        <div>
                            <span>Gusts, max.</span><strong
                                >{number(extreme(window, 'gusts'))} <small>km/h</small></strong
                            >
                        </div>
                        <div>
                            <span>Rain, max. avg.</span><strong
                                >{number(extreme(window, 'precipitation'))}
                                <small>mm/h</small></strong
                            >
                        </div>
                        <div>
                            <span>Temperature</span><strong
                                >{number(extreme(window, 'temperature', true), 0)}–{number(
                                    extreme(window, 'temperature'),
                                    0,
                                )}<small>°C</small></strong
                            >
                        </div>
                    </div>
                    <p class="owp-humidity-summary">
                        Humidity, max.{forecast.humidityEstimated ? ' estimate' : ''}:
                        <strong>{number(extreme(window, 'humidity'), 0)}%</strong>
                    </p>
                </article>
            {/each}
        </div>
    {/if}
    <details class="owp-interval-details">
        <summary
            >All forecast intervals <span>{evaluation.checks.length}</span><Icon
                name="chevron"
                size={16}
            /></summary
        >
        <p class="owp-details-help">
            Intervals shorter than your required duration may match individual limits without
            forming a work window.
        </p>
        {#each filteredChecks as check}
            <div class="owp-interval-row">
                <div class="owp-interval-time">
                    <span>{dayLabel(check.interval.start, forecast.timeZone)}</span><strong
                        >{time(check.interval.start, forecast.timeZone)}–{time(
                            check.interval.end,
                            forecast.timeZone,
                        )}</strong
                    >
                </div>
                <div class="owp-interval-reason">
                    <span class={'owp-status-label owp-' + check.status}
                        >{check.status === 'match'
                            ? 'Matches Your Limits'
                            : check.status === 'outside'
                              ? 'Outside Your Limits'
                              : 'Data Unavailable'}</span
                    >{#each check.reasons as reason}<span>{reason}</span>{/each}
                </div>
            </div>
        {/each}
        {#if !filteredChecks.length}<p class="owp-details-help">
                No forecast coverage within these working hours.
            </p>{/if}
    </details>
</section>

<script lang="ts">
    import Icon from './Icon.svelte';
    import { dateLabel, dayKey, dayLabel, number, time, windowOverlapsDay } from '../lib/format';
    import type { Evaluation, Forecast, ForecastInterval, WorkWindow } from '../lib/types';
    export let forecast: Forecast;
    export let evaluation: Evaluation;
    let selectedDay = '';
    $: days = Array.from(
        new Map(
            evaluation.checks.map(c => [
                dayKey(c.interval.start, forecast.timeZone),
                { key: dayKey(c.interval.start, forecast.timeZone), timestamp: c.interval.start },
            ]),
        ).values(),
    );
    $: if (selectedDay && !days.some(day => day.key === selectedDay)) selectedDay = '';
    $: visibleWindows = evaluation.windows.filter(
        w => !selectedDay || windowOverlapsDay(w, selectedDay, forecast.timeZone),
    );
    $: filteredChecks = evaluation.checks.filter(
        c => !selectedDay || dayKey(c.interval.start, forecast.timeZone) === selectedDay,
    );
    $: timelineDay = selectedDay || (days[0]?.key ?? '');
    $: timeline = evaluation.checks.filter(
        c => dayKey(c.interval.start, forecast.timeZone) === timelineDay,
    );
    $: allUnavailable =
        filteredChecks.length > 0 && filteredChecks.every(c => c.status === 'unavailable');
    function extreme(
        window: WorkWindow,
        field: keyof ForecastInterval,
        minimum = false,
    ): number | null {
        const values = window.intervals
            .map(i => i[field])
            .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        return values.length === window.intervals.length
            ? minimum
                ? Math.min(...values)
                : Math.max(...values)
            : null;
    }
</script>

<style>
    .owp-humidity-summary {
        font-size: 11px;
        color: var(--owp-muted);
        margin: 8px 0 0 9px;
    }
    .owp-humidity-summary strong {
        color: var(--owp-ink);
        font-weight: 500;
    }
    .owp-results {
        border-top: 1px solid var(--owp-border);
        padding-top: 0;
        margin-top: 0;
    }
    .owp-result-summary {
        margin: 3px 0 14px !important;
        color: var(--owp-muted);
        font-size: 13px !important;
    }
    .owp-day-tabs {
        display: flex;
        gap: 6px;
        overflow: auto;
        padding: 2px 2px 5px;
        margin: 0 -2px 12px;
    }
    .owp-day-tabs button {
        flex: 1;
        white-space: nowrap;
        padding: 8px 11px;
        min-height: 35px;
        font-size: 12px;
        border: 1px solid var(--owp-border);
        border-radius: 5px;
        background: var(--owp-surface);
        color: var(--owp-ink);
        cursor: pointer;
    }
    .owp-day-tabs button.owp-active {
        background: var(--owp-action);
        color: var(--owp-on-action);
        border-color: var(--owp-green);
    }
    .owp-timeline-labels {
        display: flex;
        justify-content: space-between;
        color: var(--owp-muted);
        font-size: 11px;
        margin-bottom: 5px;
    }
    .owp-timeline {
        display: flex;
        height: 19px;
        border-radius: 3px;
        overflow: hidden;
        gap: 1px;
        background: var(--owp-surface);
    }
    .owp-timeline span {
        flex-basis: 0;
        min-width: 1px;
    }
    .owp-timeline-match {
        background: #76b58c;
    }
    .owp-timeline-outside {
        background: #f3c56e;
    }
    .owp-timeline-unavailable,
    .owp-timeline-gap {
        background: #e0e6e9;
    }
    .owp-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 15px;
        font-size: 11px;
        color: var(--owp-muted);
        margin: 8px 0 17px;
    }
    .owp-legend span {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .owp-legend i {
        height: 9px;
        width: 9px;
        display: inline-block;
        border-radius: 50%;
    }
    .owp-match-dot {
        background: #76b58c;
    }
    .owp-outside-dot {
        background: #f3c56e;
    }
    .owp-unknown-dot {
        background: #b6c1c7;
    }
    .owp-work-window {
        margin-bottom: 16px;
    }
    .owp-window-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--owp-match);
        border: 1px solid var(--owp-match-border);
        border-radius: 6px;
        padding: 12px;
    }
    .owp-check-icon {
        display: flex;
        color: var(--owp-match-text);
        flex-shrink: 0;
    }
    .owp-window-time {
        flex: 1;
    }
    .owp-window-time h3 {
        font-size: 18px;
        margin: 0;
        line-height: 1.3;
    }
    .owp-window-time p {
        font-size: 11px !important;
        color: var(--owp-muted);
        margin: 3px 0 0 !important;
    }
    .owp-match-status {
        font-size: 11px;
        font-weight: 700;
        color: var(--owp-match-text);
        max-width: 90px;
        line-height: 1.35;
        text-align: right;
    }
    .owp-measurements {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 12px;
    }
    .owp-measurements > div {
        padding: 0 9px;
        border-left: 1px solid var(--owp-border);
    }
    .owp-measurements span {
        display: block;
        font-size: 10px;
        color: var(--owp-muted);
        margin-bottom: 4px;
    }
    .owp-measurements strong {
        font-size: 14px;
        white-space: nowrap;
        font-weight: 600;
    }
    .owp-measurements small {
        font-weight: 400;
        font-size: 10px;
    }
    .owp-interval-details {
        border-top: 1px solid var(--owp-border);
        padding-top: 13px;
        margin-top: 6px;
    }
    .owp-interval-details summary {
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        list-style: none;
        min-height: 26px;
    }
    .owp-interval-details summary span {
        margin-left: auto;
        color: var(--owp-muted);
        font-weight: 400;
    }
    .owp-interval-details[open] summary :global(svg) {
        transform: rotate(180deg);
    }
    .owp-details-help {
        font-size: 11px !important;
        color: var(--owp-muted);
        margin: 8px 0 !important;
    }
    .owp-interval-row {
        display: flex;
        gap: 12px;
        padding: 10px 0;
        border-top: 1px solid var(--owp-border);
        align-items: flex-start;
    }
    .owp-interval-time {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 11px;
        min-width: 96px;
        color: var(--owp-muted);
    }
    .owp-interval-time strong {
        font-weight: 500;
        color: var(--owp-ink);
    }
    .owp-interval-reason {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 11px;
    }
    .owp-status-label {
        font-weight: 600;
    }
    .owp-status-label.owp-match {
        color: var(--owp-match-text);
    }
    .owp-status-label.owp-outside {
        color: var(--owp-warning-text);
    }
    .owp-status-label.owp-unavailable {
        color: var(--owp-muted);
    }
    .owp-empty-result {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 17px;
        background: var(--owp-soft);
        border-radius: 6px;
        margin: 13px 0;
    }
    .owp-empty-result h3 {
        font-size: 15px;
        margin: 0 0 4px;
    }
    .owp-empty-result p {
        font-size: 12px !important;
        color: var(--owp-muted);
        margin: 0 !important;
    }
    @media (max-width: 420px) {
        .owp-match-status {
            max-width: 65px;
            font-size: 10px;
        }
        .owp-window-time h3 {
            font-size: 17px;
        }
        .owp-measurements {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .owp-measurements span {
            font-size: 11px;
        }
        .owp-measurements strong {
            font-size: 15px;
        }
        .owp-window-banner {
            padding: 11px 9px;
        }
        .owp-window-time p {
            font-size: 10px !important;
        }
    }
</style>
