import { afterEach, describe, expect, it, vi } from 'vitest';

import { weatherFixture } from '../../../test/weatherFixture';
import { readCachedWeather, writeCachedWeather } from './weatherCache';

describe('weather cache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('restores the last successful forecast', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));

    const savedAt = writeCachedWeather(weatherFixture.location, weatherFixture);

    expect(readCachedWeather(weatherFixture.location)).toEqual({ data: weatherFixture, savedAt });
  });

  it('discards forecasts older than one day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    writeCachedWeather(weatherFixture.location, weatherFixture);
    vi.setSystemTime(new Date('2026-09-11T13:00:00Z'));

    expect(readCachedWeather(weatherFixture.location)).toBeNull();
  });
});
