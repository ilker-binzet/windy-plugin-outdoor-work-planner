import type { PreferenceStorage } from './preferences';
export type Appearance = 'system' | 'light' | 'dark';
const KEY = 'outdoor-work-planner:appearance:v1';
export function resolveAppearance(mode: Appearance, systemDark: boolean): 'light' | 'dark' {
    return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}
export function loadAppearance(storage?: PreferenceStorage): Appearance {
    try {
        const value = storage?.getItem(KEY);
        return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
        return 'system';
    }
}
export function saveAppearance(storage: PreferenceStorage | undefined, mode: Appearance): boolean {
    try {
        if (!storage) return false;
        storage.setItem(KEY, mode);
        return true;
    } catch {
        return false;
    }
}
