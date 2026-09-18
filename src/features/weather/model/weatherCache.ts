import type { Location, WeatherResponse } from './weather.types';

const CACHE_PREFIX = 'weather-insight:forecast:v2:';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

export interface CachedWeather {
  data: WeatherResponse;
  savedAt: string;
}

function cacheKey(location: Location): string {
  return `${CACHE_PREFIX}${location.id}:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
}

function looksLikeWeather(value: unknown): value is WeatherResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.current === 'object' &&
    candidate.current !== null &&
    Array.isArray(candidate.hourly) &&
    Array.isArray(candidate.daily)
  );
}

export function readCachedWeather(location: Location): CachedWeather | null {
  try {
    const raw = localStorage.getItem(cacheKey(location));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<CachedWeather>;
    if (
      typeof parsed.savedAt !== 'string' ||
      !looksLikeWeather(parsed.data) ||
      Date.now() - new Date(parsed.savedAt).getTime() > MAX_CACHE_AGE_MS
    ) {
      localStorage.removeItem(cacheKey(location));
      return null;
    }
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function writeCachedWeather(location: Location, data: WeatherResponse): string {
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(cacheKey(location), JSON.stringify({ data, savedAt }));
  } catch {
    // Weather remains usable in memory when storage is unavailable or full.
  }
  return savedAt;
}
