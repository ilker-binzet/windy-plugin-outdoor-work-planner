import { describe, expect, it } from 'vitest';
import { loadPreferences, savePreferences } from '../src/lib/preferences';
import { defaultPreferences } from '../src/lib/profiles';

function storage(initial: string | null = null) {
    let value = initial;
    return {
        getItem: () => value,
        setItem: (_: string, next: string) => {
            value = next;
        },
    };
}
describe('local preferences', () => {
    it.each([Number.NaN, -1])(
        'retains the last valid inactive profile rather than disabling an invalid limit (%s)',
        invalid => {
            const s = storage();
            const p = defaultPreferences();
            p.profiles.painting.wind = 13;
            savePreferences(s, p);
            p.profiles.painting.wind = invalid;
            p.profileId = 'roofing';
            p.profiles.roofing.wind = 17;
            expect(savePreferences(s, p)).toBe(true);
            const restored = loadPreferences(s);
            expect(restored.profiles.painting.wind).toBe(13);
            expect(restored.profiles.roofing.wind).toBe(17);
            expect(restored.profileId).toBe('roofing');
        },
    );
    it('preserves edits for each profile and selected working hours', () => {
        const s = storage();
        const p = defaultPreferences();
        p.profiles.painting.wind = 13;
        p.minimumHours = 4;
        expect(savePreferences(s, p)).toBe(true);
        expect(loadPreferences(s).profiles.painting.wind).toBe(13);
        expect(loadPreferences(s).minimumHours).toBe(4);
    });
    it.each(['invalid json', 'null', '{}', '{"profileId":"unknown"}'])(
        'recovers from malformed storage: %s',
        input => {
            expect(loadPreferences(storage(input))).toEqual(defaultPreferences());
        },
    );
    it('recovers from invalid restored numbers', () => {
        const p = defaultPreferences();
        p.profiles.painting.wind = -5;
        expect(loadPreferences(storage(JSON.stringify(p)))).toEqual(defaultPreferences());
    });
    it('remains usable when browser storage is blocked', () => {
        const s = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('blocked');
            },
        };
        expect(loadPreferences(s)).toEqual(defaultPreferences());
        expect(savePreferences(s, defaultPreferences())).toBe(false);
    });
});
