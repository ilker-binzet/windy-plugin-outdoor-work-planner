import type { Preferences } from './types';
import { defaultPreferences, PROFILES, settingsFrom } from './profiles';
import { validateSettings } from './planner';
export interface PreferenceStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
const KEY = 'outdoor-work-planner:preferences:v1';
export function loadPreferences(storage?: PreferenceStorage): Preferences {
    try {
        const raw = storage?.getItem(KEY);
        if (!raw) return defaultPreferences();
        const p = JSON.parse(raw) as Preferences;
        if (!p || !PROFILES.some(profile => profile.id === p.profileId))
            return defaultPreferences();
        for (const profile of PROFILES) {
            if (
                !p.profiles?.[profile.id] ||
                validateSettings({ ...settingsFrom(p), limits: p.profiles[profile.id] }).length
            )
                return defaultPreferences();
        }
        return p;
    } catch {
        return defaultPreferences();
    }
}
export function savePreferences(
    storage: PreferenceStorage | undefined,
    preferences: Preferences,
): boolean {
    try {
        if (!storage || validateSettings(settingsFrom(preferences)).length) return false;
        // Inactive form edits can contain NaN. JSON would turn that into null,
        // which means "disabled". Keep that profile's last valid saved limits.
        const previous = loadPreferences(storage);
        const profiles = { ...preferences.profiles };
        for (const profile of PROFILES) {
            if (
                validateSettings({ ...settingsFrom(preferences), limits: profiles[profile.id] })
                    .length
            ) {
                profiles[profile.id] = previous.profiles[profile.id];
            }
        }
        storage.setItem(KEY, JSON.stringify({ ...preferences, profiles }));
        return true;
    } catch {
        return false;
    }
}
