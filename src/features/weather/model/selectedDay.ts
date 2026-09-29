import { weatherDescription } from '../lib/weatherFormatting';
import type { DailyWeather, HourlyWeather, WeatherResponse } from './weather.types';

export interface SelectedDayWeather {
  date: string;
  isToday: boolean;
  condition: string;
  temperatureC: number;
  apparentTemperatureC: number;
  highC: number;
  lowC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  hours: HourlyWeather[];
}

function localDate(time: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(time));
}

function average(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

export function selectedDayWeather(
  weather: WeatherResponse,
  requestedDate: string | null,
): SelectedDayWeather | null {
  const day: DailyWeather | undefined =
    weather.daily.find((item) => item.date === requestedDate) ?? weather.daily[0];
  if (!day) return null;
  const today = localDate(weather.current.time, weather.location.timezone);
  const hours = weather.hourly.filter(
    (hour) => localDate(hour.time, weather.location.timezone) === day.date,
  );
  const isToday = day.date === today;
  return {
    date: day.date,
    isToday,
    condition: isToday ? weather.current.summary : weatherDescription(day.weatherCode),
    temperatureC: isToday
      ? weather.current.temperatureC
      : average(hours.map((hour) => hour.temperatureC)),
    apparentTemperatureC: isToday
      ? weather.current.apparentTemperatureC
      : average(hours.map((hour) => hour.apparentTemperatureC)),
    highC: day.temperatureMaxC,
    lowC: day.temperatureMinC,
    humidityPercent: isToday
      ? weather.current.humidityPercent
      : average(hours.map((hour) => hour.humidityPercent)),
    windSpeedKmh: isToday
      ? weather.current.windSpeedKmh
      : average(hours.map((hour) => hour.windSpeedKmh)),
    precipitationMm: isToday ? weather.current.precipitationMm : day.precipitationSumMm,
    hours,
  };
}
