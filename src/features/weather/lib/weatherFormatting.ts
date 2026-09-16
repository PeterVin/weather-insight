import type { TemperatureUnit } from '../model/weather.types';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function convertTemperature(valueC: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
}

export function temperatureSymbol(unit: TemperatureUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(valueC: number, unit: TemperatureUnit): string {
  return `${numberFormat.format(convertTemperature(valueC, unit))} ${temperatureSymbol(unit)}`;
}

export function formatCompactTemperature(valueC: number, unit: TemperatureUnit): string {
  return `${integerFormat.format(convertTemperature(valueC, unit))}°`;
}

export function formatNumber(value: number | undefined, unit: string): string {
  if (value === undefined) return 'Unavailable';
  return unit ? `${numberFormat.format(value)} ${unit}` : numberFormat.format(value);
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? 'Unavailable' : `${integerFormat.format(value)}%`;
}

export function formatHour(isoDate: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(isoDate));
}

export function formatDate(isoDate: string, timeZone?: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return formatForecastDate(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(isoDate));
}

export function formatForecastDate(date: string, long = false): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return date;
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: long ? 'long' : 'short',
    timeZone: 'UTC',
  }).format(parsed);
  const month = new Intl.DateTimeFormat('en-US', {
    month: long ? 'long' : 'short',
    timeZone: 'UTC',
  }).format(parsed);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(parsed);
  return `${weekday}, ${month} ${day}`;
}

export function formatUpdatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function windDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  const normalized = ((degrees % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % directions.length] ?? '-';
}

export function weatherSymbol(code: number): string {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Weather conditions';
}

export function aqiDetails(value: number): {
  label: string;
  level: 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' | 'extreme';
} {
  if (value <= 20) return { label: 'Good', level: 'good' };
  if (value <= 40) return { label: 'Fair', level: 'fair' };
  if (value <= 60) return { label: 'Moderate', level: 'moderate' };
  if (value <= 80) return { label: 'Poor', level: 'poor' };
  if (value <= 100) return { label: 'Very poor', level: 'very-poor' };
  return { label: 'Extremely poor', level: 'extreme' };
}
