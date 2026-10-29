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
    {:else if name === 'clock'}<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    {/if}
</svg>

<script lang="ts">
    export let name = 'pin';
    export let size = 20;
</script>
