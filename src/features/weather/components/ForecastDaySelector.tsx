import type { DailyWeather, TemperatureUnit } from '../model/weather.types';
import {
  formatCompactTemperature,
  formatForecastDate,
  formatPercent,
  weatherDescription,
  weatherSymbol,
} from '../lib/weatherFormatting';

interface ForecastDaySelectorProps {
  daily: DailyWeather[];
  selectedDate: string | null;
  unit: TemperatureUnit;
  onSelect: (date: string) => void;
}

export function ForecastDaySelector({
  daily,
  selectedDate,
  unit,
  onSelect,
}: ForecastDaySelectorProps): React.JSX.Element {
  const days = daily.slice(0, 7);
  return (
    <section className="dashboard-section forecast-day-selector" aria-labelledby="next-days-title">
      <div className="forecast-day-selector__heading">
        <div>
          <p className="eyebrow">Forecast</p>
          <h2 id="next-days-title">Next 7 days</h2>
        </div>
        <p>Choose a day to update the weather overview.</p>
      </div>
      {days.length === 0 ? (
        <p className="empty-state">No daily forecast is available.</p>
      ) : (
        <div className="forecast-day-selector__strip" aria-label="Select forecast date">
          {days.map((day) => {
            const selected = day.date === selectedDate;
            const label = `${formatForecastDate(day.date)}, ${weatherDescription(day.weatherCode)}, high ${formatCompactTemperature(day.temperatureMaxC, unit)}, low ${formatCompactTemperature(day.temperatureMinC, unit)}, ${formatPercent(day.precipitationProbabilityMaxPercent)} chance of rain`;
            return (
              <button
                className={`forecast-day-selector__day${selected ? ' forecast-day-selector__day--selected' : ''}`}
                key={day.date}
                type="button"
                aria-current={selected ? 'date' : undefined}
                aria-label={label}
                onClick={(event) => {
                  onSelect(day.date);
                  event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center' });
                }}
              >
                <span>{formatForecastDate(day.date).split(',')[0]}</span>
                <small>{formatForecastDate(day.date).split(', ')[1]}</small>
                <span className="forecast-day-selector__symbol" aria-hidden="true">
                  {weatherSymbol(day.weatherCode)}
                </span>
                <strong>{formatCompactTemperature(day.temperatureMaxC, unit)}</strong>
                <em>{formatCompactTemperature(day.temperatureMinC, unit)}</em>
                <small>☂ {formatPercent(day.precipitationProbabilityMaxPercent)}</small>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
