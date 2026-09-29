import { formatTemperature } from '../lib/weatherFormatting';
import type { TemperatureUnit, WeatherResponse } from '../model/weather.types';

interface CurrentConditionsProps {
  weather: WeatherResponse;
  unit: TemperatureUnit;
}

export function CurrentConditions({ weather, unit }: CurrentConditionsProps): React.JSX.Element {
  const { current, location } = weather;
  return (
    <section className="panel" aria-labelledby="current-title">
      <p className="eyebrow">Current weather</p>
      <h1 id="current-title">{location.name}</h1>
      <p className="hero-temperature">{formatTemperature(current.temperatureC, unit)}</p>
      <h2>{current.summary}</h2>
      <div className="metrics" aria-label="Current weather details">
        <div className="metric">
          <span>Feels like</span>
          <strong>{formatTemperature(current.apparentTemperatureC, unit)}</strong>
        </div>
        <div className="metric">
          <span>Humidity</span>
          <strong>{current.humidityPercent}%</strong>
        </div>
        <div className="metric">
          <span>Wind</span>
          <strong>{current.windSpeedKmh} km/h</strong>
        </div>
        <div className="metric">
          <span>Rain</span>
          <strong>{current.precipitationMm} mm</strong>
        </div>
      </div>
    </section>
  );
}
