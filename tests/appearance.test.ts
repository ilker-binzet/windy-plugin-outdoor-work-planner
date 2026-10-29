import { describe, expect, it } from 'vitest';
import { loadAppearance, saveAppearance, resolveAppearance } from '../src/lib/appearance';

describe('appearance preferences', () => {
    it('follows system darkness until explicitly overridden', () => {
        expect(resolveAppearance('system', true)).toBe('dark');
        expect(resolveAppearance('system', false)).toBe('light');
        expect(resolveAppearance('light', true)).toBe('light');
        expect(resolveAppearance('dark', false)).toBe('dark');
    });
    it('restores a manual theme and ignores invalid stored values', () => {
        let value: string | null = 'invalid';
        const s = {
            getItem: () => value,
            setItem: (_: string, v: string) => {
                value = v;
            },
        };
        expect(loadAppearance(s)).toBe('system');
        saveAppearance(s, 'dark');
        expect(loadAppearance(s)).toBe('dark');
    });
    it('falls back to the system theme when storage is blocked', () => {
        expect(
            loadAppearance({
                getItem: () => {
                    throw new Error();
                },
                setItem: () => {
                    throw new Error();
                },
            }),
        ).toBe('system');
        expect(saveAppearance(undefined, 'dark')).toBe(false);
    });
});
