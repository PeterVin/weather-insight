import { getWeather, OpenMeteoError } from './openMeteo';
import { weatherFixture } from '../../../test/weatherFixture';

const forecastPayload = {
  timezone: 'Europe/Budapest',
  utc_offset_seconds: 7200,
  current: {
    time: '2026-09-06T12:00',
    temperature_2m: 24.6,
    relative_humidity_2m: 57,
    apparent_temperature: 25.1,
    precipitation: 0,
    weather_code: 1,
    surface_pressure: 1017,
    wind_speed_10m: 11.2,
    wind_gusts_10m: 18.4,
    wind_direction_10m: 115,
    cloud_cover: 18,
    is_day: 1,
    visibility: 24000,
    uv_index: 4.2,
  },
  hourly: {
    time: ['2026-09-06T13:00'],
    temperature_2m: [25],
    apparent_temperature: [25.4],
    precipitation_probability: [10],
    precipitation: [0],
    weather_code: [1],
    wind_speed_10m: [12],
    wind_gusts_10m: [18],
    relative_humidity_2m: [54],
    cloud_cover: [16],
    visibility: [24000],
    uv_index: [4.5],
    is_day: [1],
  },
  daily: {
    time: ['2026-09-06'],
    temperature_2m_max: [27],
    temperature_2m_min: [16],
    weather_code: [1],
    sunrise: ['2026-09-06T06:10'],
    sunset: ['2026-09-06T19:13'],
    precipitation_probability_max: [20],
    precipitation_sum: [0.2],
    wind_speed_10m_max: [18],
    uv_index_max: [5.1],
  },
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Open-Meteo browser provider', () => {
  it('normalizes a direct forecast response into the application contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(forecastPayload)));

    await expect(getWeather(weatherFixture.location)).resolves.toMatchObject({
      location: weatherFixture.location,
      current: { summary: 'Mostly clear', visibilityKm: 24 },
      hourly: [{ time: '2026-09-06T11:00:00.000Z' }],
      daily: [{ date: '2026-09-06', uvIndexMax: 5.1 }],
      airQuality: null,
    });
  });

  it('keeps optional provider fields unavailable instead of inventing zero values', async () => {
    const withoutOptional = {
      ...forecastPayload,
      current: { ...forecastPayload.current, visibility: undefined, uv_index: undefined },
      hourly: { ...forecastPayload.hourly, visibility: [undefined], uv_index: [undefined] },
      daily: { ...forecastPayload.daily, uv_index_max: [undefined] },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(withoutOptional)));

    const response = await getWeather(weatherFixture.location);
    expect(response.current.visibilityKm).toBeUndefined();
    expect(response.hourly[0]?.uvIndex).toBeUndefined();
    expect(response.daily[0]?.uvIndexMax).toBeUndefined();
  });

  it('maps provider HTTP failures to a readable typed error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ reason: 'Nope' }, 503)));

    await expect(getWeather(weatherFixture.location)).rejects.toBeInstanceOf(OpenMeteoError);
    await expect(getWeather(weatherFixture.location)).rejects.toThrow('503');
  });
});
