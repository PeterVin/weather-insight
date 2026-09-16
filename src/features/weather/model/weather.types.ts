export interface Location {
  id: string;
  name: string;
  country: string;
  adminArea?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  summary: string;
  humidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  cloudCoverPercent: number;
  isDay: boolean;
  pressureHpa?: number;
  visibilityKm?: number;
  uvIndex?: number;
}

export interface HourlyWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationProbabilityPercent: number;
  precipitationMm: number;
  weatherCode: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  humidityPercent: number;
  cloudCoverPercent: number;
  visibilityKm?: number;
  uvIndex?: number;
  isDay: boolean;
}

export interface DailyWeather {
  date: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  precipitationProbabilityMaxPercent: number;
  precipitationSumMm: number;
  windSpeedMaxKmh: number;
  uvIndexMax?: number;
}

export interface AirQualityReading {
  europeanAqi: number;
  usAqi?: number;
  pm25?: number;
  pm10?: number;
  nitrogenDioxide?: number;
  ozone?: number;
}

export interface HourlyAirQuality extends AirQualityReading {
  time: string;
}

export interface AirQuality {
  current: AirQualityReading;
  hourly: HourlyAirQuality[];
}

export interface WeatherResponse {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  airQuality: AirQuality | null;
  updatedAt: string;
}

export interface LocationSearchResponse {
  locations: Location[];
}

export type DashboardView =
  'overview' | 'hourly' | 'daily' | 'air-quality' | 'compare' | 'preferences';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
