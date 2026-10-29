export function startLiveClock(update: (now: number) => void): () => void {
    update(Date.now());
    const timer = setInterval(() => update(Date.now()), 60000);
    return () => clearInterval(timer);
}
