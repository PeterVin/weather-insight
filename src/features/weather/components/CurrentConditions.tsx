import {
  formatCompactTemperature,
  formatForecastDate,
  formatTemperature,
} from '../lib/weatherFormatting';
import type { Location, TemperatureUnit } from '../model/weather.types';
import type { SelectedDayWeather } from '../model/selectedDay';

interface CurrentConditionsProps {
  selectedDay: SelectedDayWeather;
  location: Location;
  unit: TemperatureUnit;
}

export function CurrentConditions({
  selectedDay,
  location,
  unit,
}: CurrentConditionsProps): React.JSX.Element {
  return (
    <section className="panel weather-hero" aria-labelledby="current-title">
      <p className="eyebrow">{selectedDay.isToday ? 'Current weather' : 'Forecast'}</p>
      <h1 id="current-title">{location.name}</h1>
      <p className="muted">
        {selectedDay.isToday
          ? [location.adminArea, location.country].filter(Boolean).join(', ')
          : formatForecastDate(selectedDay.date, true)}
      </p>
      <p className="hero-temperature">{formatTemperature(selectedDay.temperatureC, unit)}</p>
      <h2>{selectedDay.condition}</h2>
      <p>
        ↑ {formatCompactTemperature(selectedDay.highC, unit)} · ↓{' '}
        {formatCompactTemperature(selectedDay.lowC, unit)}
      </p>
      <div className="metrics" aria-label="Selected day weather details">
        <div className="metric">
          <span>Feels like</span>
          <strong>{formatTemperature(selectedDay.apparentTemperatureC, unit)}</strong>
        </div>
        <div className="metric">
          <span>Humidity</span>
          <strong>{Math.round(selectedDay.humidityPercent)}%</strong>
        </div>
        <div className="metric">
          <span>Wind</span>
          <strong>{Math.round(selectedDay.windSpeedKmh)} km/h</strong>
        </div>
        <div className="metric">
          <span>Rain</span>
          <strong>{selectedDay.precipitationMm.toFixed(1)} mm</strong>
        </div>
      </div>
    </section>
  );
}
