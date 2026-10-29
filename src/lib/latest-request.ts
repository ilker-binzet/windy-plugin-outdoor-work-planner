/** Invalidate stale async work independently of the transport's abort support. */
export function latestRequest() {
    let generation = 0;
    return {
        begin: () => ++generation,
        current: (id: number) => id === generation,
        invalidate: () => {
            generation++;
        },
    };
}
