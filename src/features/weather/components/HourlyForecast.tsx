import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  convertTemperature,
  formatHour,
  formatPercent,
  formatTemperature,
  temperatureSymbol,
  weatherDescription,
  weatherSymbol,
} from '../lib/weatherFormatting';
import type { HourlyWeather, TemperatureUnit } from '../model/weather.types';
import { SectionHeading } from './SectionHeading';

interface HourlyForecastProps {
  hourly: HourlyWeather[];
  unit: TemperatureUnit;
  compact?: boolean;
  timeZone?: string;
}

type ChartHour = HourlyWeather & { hour: string; temperature: number; apparent: number };

function HourlyTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: ChartHour }[];
  unit: TemperatureUnit;
}): React.JSX.Element | null {
  const item = active ? payload?.[0]?.payload : undefined;
  if (!item) return null;
  return (
    <div className="weather-tooltip">
      <strong>{item.hour}</strong>
      <span>{weatherDescription(item.weatherCode)}</span>
      <dl>
        <div>
          <dt>Temperature</dt>
          <dd>{formatTemperature(item.temperatureC, unit)}</dd>
        </div>
        <div>
          <dt>Feels like</dt>
          <dd>{formatTemperature(item.apparentTemperatureC, unit)}</dd>
        </div>
        <div>
          <dt>Rain chance</dt>
          <dd>{formatPercent(item.precipitationProbabilityPercent)}</dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>{item.precipitationMm.toFixed(1)} mm</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{item.windSpeedKmh.toFixed(0)} km/h</dd>
        </div>
      </dl>
    </div>
  );
}

export function HourlyForecast({
  hourly,
  unit,
  compact = false,
  timeZone,
}: HourlyForecastProps): React.JSX.Element {
  const visibleHours = hourly.slice(0, compact ? 12 : 24);
  const chartData: ChartHour[] = visibleHours.map((item) => ({
    ...item,
    hour: formatHour(item.time, timeZone),
    temperature: convertTemperature(item.temperatureC, unit),
    apparent: convertTemperature(item.apparentTemperatureC, unit),
  }));
  const interval = compact ? 1 : 2;
  if (visibleHours.length === 0)
    return (
      <section className="dashboard-section chart-card">
        <SectionHeading eyebrow="Hourly" title="Weather through the day" />
        <p className="empty-state">No hourly forecast is available for this period.</p>
      </section>
    );

  return (
    <section
      className="dashboard-section chart-card hourly-forecast"
      aria-labelledby="hourly-title"
    >
      <SectionHeading
        eyebrow="Hourly"
        title="Weather through the day"
        description={
          compact
            ? 'The next 12 hours, at a glance'
            : 'Temperature and precipitation use independent scales'
        }
      />
      <h3 className="visually-hidden" id="hourly-title">
        Hourly forecast chart
      </h3>
      <div className="hourly-icon-timeline" aria-label="Hourly weather conditions">
        {chartData
          .filter((_, index) => index % (compact ? 2 : 3) === 0)
          .map((item) => (
            <span key={item.time}>
              <time>{item.hour}</time>
              <b aria-label={weatherDescription(item.weatherCode)}>
                {weatherSymbol(item.weatherCode)}
              </b>
            </span>
          ))}
      </div>
      <div
        className="hourly-band hourly-band--temperature"
        data-tooltip-host="shared-hourly"
        role="img"
        aria-label="Hourly temperature and feels-like chart"
      >
        <p className="chart-band-label">
          Temperature <span>{temperatureSymbol(unit)}</span>
        </p>
        <ResponsiveContainer width="100%" height={compact ? 190 : 240}>
          <LineChart
            data={chartData}
            syncId="hourly-weather"
            margin={{ top: 8, right: 12, bottom: 0, left: -10 }}
          >
            <CartesianGrid strokeDasharray="2 8" vertical={false} />
            <XAxis dataKey="hour" hide />
            <YAxis tickLine={false} axisLine={false} width={46} unit="°" />
            <Tooltip
              cursor={{ stroke: 'var(--weather-sky)', strokeOpacity: 0.35 }}
              content={<HourlyTooltip unit={unit} />}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="var(--weather-sky)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="apparent"
              stroke="var(--color-chart-minimum)"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className="hourly-band hourly-band--precipitation"
        role="img"
        aria-label="Hourly precipitation amount chart"
      >
        <p className="chart-band-label">
          Precipitation <span>mm · percentage labels show chance</span>
        </p>
        <ResponsiveContainer width="100%" height={compact ? 112 : 136}>
          <BarChart
            data={chartData}
            syncId="hourly-weather"
            margin={{ top: 2, right: 12, bottom: 0, left: -10 }}
          >
            <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={interval} />
            <YAxis tickLine={false} axisLine={false} width={46} allowDecimals={false} />
            <Bar
              dataKey="precipitationMm"
              fill="var(--weather-rain)"
              radius={[3, 3, 0, 0]}
              activeBar={false}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="rain-chances" aria-label="Hourly chance of rain">
          {chartData
            .filter((_, index) => index % (compact ? 2 : 3) === 0)
            .map((item) => (
              <span key={item.time}>{formatPercent(item.precipitationProbabilityPercent)}</span>
            ))}
        </div>
      </div>
      {!compact && (
        <div className="forecast-table-wrapper">
          <table className="forecast-table">
            <caption>Hourly weather data</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Temperature</th>
                <th scope="col">Feels like</th>
                <th scope="col">Rain chance</th>
                <th scope="col">Precipitation</th>
                <th scope="col">Wind</th>
                <th scope="col">Cloud</th>
              </tr>
            </thead>
            <tbody>
              {visibleHours.map((item) => (
                <tr key={item.time}>
                  <th scope="row">{formatHour(item.time, timeZone)}</th>
                  <td>{formatTemperature(item.temperatureC, unit)}</td>
                  <td>{formatTemperature(item.apparentTemperatureC, unit)}</td>
                  <td>{formatPercent(item.precipitationProbabilityPercent)}</td>
                  <td>{item.precipitationMm.toFixed(1)} mm</td>
                  <td>{item.windSpeedKmh.toFixed(1)} km/h</td>
                  <td>{formatPercent(item.cloudCoverPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
