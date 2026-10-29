import type { Limits, PlannerSettings, Preferences, ProfileId } from './types';

export const PROFILES: { id: ProfileId; name: string; limits: Limits }[] = [
    {
        id: 'general',
        name: 'General Outdoor Work',
        limits: {
            wind: 25,
            gusts: 40,
            precipitation: 0.5,
            minTemperature: 5,
            maxTemperature: 32,
            humidity: null,
        },
    },
    {
        id: 'painting',
        name: 'Exterior Painting',
        limits: {
            wind: 20,
            gusts: 30,
            precipitation: 0,
            minTemperature: 10,
            maxTemperature: 30,
            humidity: 80,
        },
    },
    {
        id: 'roofing',
        name: 'Roofing',
        limits: {
            wind: 20,
            gusts: 30,
            precipitation: 0,
            minTemperature: 5,
            maxTemperature: 30,
            humidity: null,
        },
    },
    {
        id: 'concrete',
        name: 'Concrete Work',
        limits: {
            wind: 20,
            gusts: 35,
            precipitation: 0,
            minTemperature: 5,
            maxTemperature: 30,
            humidity: null,
        },
    },
    {
        id: 'custom',
        name: 'Custom',
        limits: {
            wind: 20,
            gusts: 30,
            precipitation: 0,
            minTemperature: 5,
            maxTemperature: 30,
            humidity: null,
        },
    },
];
export function defaultPreferences(): Preferences {
    return {
        profileId: 'painting',
        profiles: Object.fromEntries(PROFILES.map(p => [p.id, { ...p.limits }])) as Record<
            ProfileId,
            Limits
        >,
        workStart: '08:00',
        workEnd: '18:00',
        minimumHours: 3,
    };
}
export function settingsFrom(preferences: Preferences): PlannerSettings {
    return {
        limits: preferences.profiles[preferences.profileId],
        workStart: preferences.workStart,
        workEnd: preferences.workEnd,
        minimumHours: preferences.minimumHours,
    };
}
