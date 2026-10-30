<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
>
    {#if name === 'pin'}<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle
            cx="12"
            cy="10"
            r="2.5"
        />
    {:else if name === 'arrow'}<path d="M4 12h16m-7-7 7 7-7 7" />
    {:else if name === 'check'}<circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />
    {:else if name === 'refresh'}<path d="M20 7v5h-5M4 17v-5h5" /><path
            d="M6 7a7 7 0 0 1 11-1l3 3M4 15l3 3a7 7 0 0 0 11-1"
        />
    {:else if name === 'close'}<path d="m6 6 12 12M6 18 18 6" />
    {:else if name === 'chevron'}<path d="m6 9 6 6 6-6" />
    {:else if name === 'map'}<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z" /><path
            d="M9 3v16M15 5v16"
        />
    {:else if name === 'back'}<path d="M20 12H4m7-7-7 7 7 7" />
    {:else if name === 'search'}<circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
    {:else if name === 'expand'}<path d="M14 3h7v7M10 21H3v-7M21 3l-7 7M3 21l7-7" />
    {:else if name === 'target'}<circle cx="12" cy="12" r="7" /><path
            d="M12 2v4M12 18v4M2 12h4M18 12h4"
        />
    {:else if name === 'locate'}<path d="m21 3-6 18-4-8-8-4 18-6Z" />
    {:else if name === 'clock'}<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    {/if}
</svg>

<script lang="ts">
    export let name = 'pin';
    export let size = 20;
</script>
