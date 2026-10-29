import { expect, it } from 'vitest';
import { latestRequest } from '../src/lib/latest-request';
it('prevents older locations and destroyed plugin requests from replacing newer state', () => {
    const requests = latestRequest();
    const first = requests.begin();
    const second = requests.begin();
    expect(requests.current(first)).toBe(false);
    expect(requests.current(second)).toBe(true);
    requests.invalidate();
    expect(requests.current(second)).toBe(false);
});
