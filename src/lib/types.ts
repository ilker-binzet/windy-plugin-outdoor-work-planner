export interface Location {
    lat: number;
    lon: number;
    name: string;
}
export interface ForecastInterval {
    start: number;
    end: number;
    temperature: number | null;
    wind: number | null;
    gusts: number | null;
    precipitation: number | null;
    humidity: number | null;
}
export interface Limits {
    wind: number | null;
    gusts: number | null;
    precipitation: number | null;
    minTemperature: number | null;
    maxTemperature: number | null;
    humidity: number | null;
}
export interface PlannerSettings {
    limits: Limits;
    workStart: string;
    workEnd: string;
    minimumHours: number;
}
export type ProfileId = 'general' | 'painting' | 'roofing' | 'concrete' | 'custom';
export interface Preferences {
    profileId: ProfileId;
    profiles: Record<ProfileId, Limits>;
    workStart: string;
    workEnd: string;
    minimumHours: number;
}
export interface Forecast {
    intervals: ForecastInterval[];
    timeZone: string;
    model: string;
    updatedAt: string | null;
    stepHours: number;
    humidityEstimated: boolean;
    sample?: boolean;
}
export interface IntervalCheck {
    interval: ForecastInterval;
    status: 'match' | 'outside' | 'unavailable';
    reasons: string[];
}
export interface WorkWindow {
    start: number;
    end: number;
    intervals: ForecastInterval[];
}
export interface Evaluation {
    windows: WorkWindow[];
    checks: IntervalCheck[];
}
