import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  Location,
  WeatherResponse,
} from '../model/weather.types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 12_000;

type ErrorCode = 'http' | 'network' | 'timeout' | 'invalid-response';

export class OpenMeteoError extends Error {
  readonly status: number | undefined;
  readonly code: ErrorCode;

  constructor(message: string, options: { code: ErrorCode; status?: number; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = 'OpenMeteoError';
    this.code = options.code;
    this.status = options.status;
  }
}

type JsonRecord = Record<string, unknown>;

const WEATHER_SUMMARIES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Light freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Freezing rain',
  71: 'Snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

function asRecord(value: unknown, label: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new OpenMeteoError(`The weather provider returned invalid ${label} data.`, {
      code: 'invalid-response',
    });
  }
  return value as JsonRecord;
}

function requiredNumber(source: JsonRecord, key: string): number {
  const value = source[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new OpenMeteoError(`The weather provider omitted ${key}.`, { code: 'invalid-response' });
  }
  return value;
}

function optionalNumber(source: JsonRecord, key: string): number | undefined {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function requiredText(source: JsonRecord, key: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new OpenMeteoError(`The weather provider omitted ${key}.`, { code: 'invalid-response' });
  }
  return value;
}

function series(source: JsonRecord, key: string): unknown[] {
  const value = source[key];
  if (!Array.isArray(value)) {
    throw new OpenMeteoError(`The weather provider returned invalid ${key} data.`, {
      code: 'invalid-response',
    });
  }
  return value;
}

function seriesRequiredNumber(source: JsonRecord, key: string, index: number): number {
  const value = series(source, key)[index];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new OpenMeteoError(`The weather provider omitted ${key}.`, { code: 'invalid-response' });
  }
  return value;
}

function seriesOptionalNumber(source: JsonRecord, key: string, index: number): number | undefined {
  const values = source[key];
  if (!Array.isArray(values)) return undefined;
  const value: unknown = values[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function seriesText(source: JsonRecord, key: string, index: number): string {
  const value = series(source, key)[index];
  if (typeof value !== 'string' || value.length === 0) {
    throw new OpenMeteoError(`The weather provider omitted ${key}.`, { code: 'invalid-response' });
  }
  return value;
}

function offsetSuffix(offsetSeconds: number): string {
  const minutes = Math.trunc(offsetSeconds / 60);
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}

function isoTime(localTime: string, utcOffsetSeconds: number): string {
  const value = /(?:Z|[+-]\d{2}:?\d{2})$/.test(localTime)
    ? localTime
    : `${localTime}${offsetSuffix(utcOffsetSeconds)}`;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new OpenMeteoError('The weather provider returned an invalid timestamp.', {
      code: 'invalid-response',
    });
  }
  return parsed.toISOString();
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = new AbortController();
  const timeoutId = window.setTimeout(() => {
    timeout.abort();
  }, REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: combinedSignal,
    });
    if (!response.ok) {
      throw new OpenMeteoError(
        `Open-Meteo could not complete the request (${String(response.status)}).`,
        {
          code: 'http',
          status: response.status,
        },
      );
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new OpenMeteoError('Open-Meteo returned an unreadable response.', {
        code: 'invalid-response',
        cause,
      });
    }
  } catch (error) {
    if (error instanceof OpenMeteoError || signal?.aborted) throw error;
    if (timeout.signal.aborted) {
      throw new OpenMeteoError('Open-Meteo took too long to respond. Please try again.', {
        code: 'timeout',
        cause: error,
      });
    }
    throw new OpenMeteoError('Could not connect to Open-Meteo. Please check your connection.', {
      code: 'network',
      cause: error,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function query(url: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  return `${url}?${search.toString()}`;
}

function normalizeCurrent(raw: JsonRecord, offset: number): CurrentWeather {
  const code = requiredNumber(raw, 'weather_code');
  return {
    time: isoTime(requiredText(raw, 'time'), offset),
    temperatureC: requiredNumber(raw, 'temperature_2m'),
    apparentTemperatureC: requiredNumber(raw, 'apparent_temperature'),
    weatherCode: code,
    summary: WEATHER_SUMMARIES[code] ?? 'Unknown conditions',
    humidityPercent: requiredNumber(raw, 'relative_humidity_2m'),
    precipitationMm: requiredNumber(raw, 'precipitation'),
    windSpeedKmh: requiredNumber(raw, 'wind_speed_10m'),
    windGustsKmh: requiredNumber(raw, 'wind_gusts_10m'),
    windDirectionDeg: requiredNumber(raw, 'wind_direction_10m'),
    cloudCoverPercent: requiredNumber(raw, 'cloud_cover'),
    isDay: requiredNumber(raw, 'is_day') === 1,
    pressureHpa: optionalNumber(raw, 'surface_pressure'),
    visibilityKm:
      optionalNumber(raw, 'visibility') === undefined
        ? undefined
        : requiredNumber(raw, 'visibility') / 1000,
    uvIndex: optionalNumber(raw, 'uv_index'),
  };
}

function normalizeHourly(raw: JsonRecord, offset: number): HourlyWeather[] {
  const times = series(raw, 'time');
  return times.map((_, index) => ({
    time: isoTime(seriesText(raw, 'time', index), offset),
    temperatureC: seriesRequiredNumber(raw, 'temperature_2m', index),
    apparentTemperatureC: seriesRequiredNumber(raw, 'apparent_temperature', index),
    precipitationProbabilityPercent: seriesRequiredNumber(raw, 'precipitation_probability', index),
    precipitationMm: seriesRequiredNumber(raw, 'precipitation', index),
    weatherCode: seriesRequiredNumber(raw, 'weather_code', index),
    windSpeedKmh: seriesRequiredNumber(raw, 'wind_speed_10m', index),
    windGustsKmh: seriesRequiredNumber(raw, 'wind_gusts_10m', index),
    humidityPercent: seriesRequiredNumber(raw, 'relative_humidity_2m', index),
    cloudCoverPercent: seriesRequiredNumber(raw, 'cloud_cover', index),
    visibilityKm:
      seriesOptionalNumber(raw, 'visibility', index) === undefined
        ? undefined
        : seriesRequiredNumber(raw, 'visibility', index) / 1000,
    uvIndex: seriesOptionalNumber(raw, 'uv_index', index),
    isDay: seriesRequiredNumber(raw, 'is_day', index) === 1,
  }));
}

function normalizeDaily(raw: JsonRecord, offset: number): DailyWeather[] {
  const dates = series(raw, 'time');
  return dates.map((_, index) => ({
    date: seriesText(raw, 'time', index),
    temperatureMaxC: seriesRequiredNumber(raw, 'temperature_2m_max', index),
    temperatureMinC: seriesRequiredNumber(raw, 'temperature_2m_min', index),
    weatherCode: seriesRequiredNumber(raw, 'weather_code', index),
    sunrise: isoTime(seriesText(raw, 'sunrise', index), offset),
    sunset: isoTime(seriesText(raw, 'sunset', index), offset),
    precipitationProbabilityMaxPercent: seriesRequiredNumber(
      raw,
      'precipitation_probability_max',
      index,
    ),
    precipitationSumMm: seriesRequiredNumber(raw, 'precipitation_sum', index),
    windSpeedMaxKmh: seriesRequiredNumber(raw, 'wind_speed_10m_max', index),
    uvIndexMax: seriesOptionalNumber(raw, 'uv_index_max', index),
  }));
}

export async function getWeather(
  location: Location,
  signal?: AbortSignal,
): Promise<WeatherResponse> {
  const forecastUrl = query(FORECAST_URL, {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    forecast_days: 7,
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,is_day,visibility,uv_index',
    hourly:
      'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover,visibility,uv_index,is_day',
    daily:
      'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max',
  });
  const forecast = asRecord(await fetchJson(forecastUrl, signal), 'forecast');
  const offset = requiredNumber(forecast, 'utc_offset_seconds');
  return {
    location: { ...location, timezone: requiredText(forecast, 'timezone') },
    current: normalizeCurrent(asRecord(forecast.current, 'current'), offset),
    hourly: normalizeHourly(asRecord(forecast.hourly, 'hourly'), offset),
    daily: normalizeDaily(asRecord(forecast.daily, 'daily'), offset),
    airQuality: null,
    updatedAt: new Date().toISOString(),
  };
}
