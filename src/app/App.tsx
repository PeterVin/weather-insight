import { useCallback, useEffect, useState } from 'react';

import { LocationSearch } from '../features/locations/components/LocationSearch';
import { useSelectedLocation } from '../features/locations/model/useSelectedLocation';
import { formatTemperature, formatUpdatedAt } from '../features/weather/lib/weatherFormatting';
import { useWeather } from '../features/weather/model/useWeather';
import { useOnlineStatus } from '../shared/model/useOnlineStatus';

import type { DashboardView, TemperatureUnit } from '../features/weather/model/weather.types';

const VIEWS: readonly { id: DashboardView; label: string }[] = [
  { id: 'overview', label: 'Today' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'air-quality', label: 'Air quality' },
  { id: 'compare', label: 'Compare' },
  { id: 'preferences', label: 'Preferences' },
];

function viewFromUrl(): DashboardView {
  const value = new URLSearchParams(window.location.search).get('view');
  return VIEWS.some((view) => view.id === value) ? (value as DashboardView) : 'overview';
}

export function App(): React.JSX.Element {
  const [location, selectLocation] = useSelectedLocation();
  const [view, setViewState] = useState<DashboardView>(viewFromUrl);
  const [unit, setUnit] = useState<TemperatureUnit>(() =>
    localStorage.getItem('weather-insight:temperature-unit') === 'fahrenheit'
      ? 'fahrenheit'
      : 'celsius',
  );
  const weather = useWeather(location);
  const online = useOnlineStatus();

  useEffect(() => {
    const sync = (): void => {
      setViewState(viewFromUrl());
    };
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const setView = useCallback((next: DashboardView): void => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', next);
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    setViewState(next);
  }, []);

  const selectUnit = (next: TemperatureUnit): void => {
    localStorage.setItem('weather-insight:temperature-unit', next);
    setUnit(next);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <strong>Weather Insight</strong>
        <span>The #1,243,163 weather app </span>
        <LocationSearch selectedLocation={location} onSelect={selectLocation} />
        <div className="unit-switch" role="group" aria-label="Temperature unit">
          <button
            type="button"
            aria-pressed={unit === 'celsius'}
            onClick={() => {
              selectUnit('celsius');
            }}
          >
            °C
          </button>
          <button
            type="button"
            aria-pressed={unit === 'fahrenheit'}
            onClick={() => {
              selectUnit('fahrenheit');
            }}
          >
            °F
          </button>
        </div>
      </header>
      <nav className="view-tabs" aria-label="Weather views">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => {
              setView(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main>
        {weather.status === 'loading' && weather.data === null && (
          <p role="status">Loading forecast…</p>
        )}
        {weather.status === 'error' && weather.data === null && <p role="alert">{weather.error}</p>}
        {weather.data && (
          <>
            <p className="eyebrow">
              {location.name} · {online ? 'Live' : 'Saved data'}
            </p>
            <h1>{formatTemperature(weather.data.current.temperatureC, unit)}</h1>
            <h2>{weather.data.current.summary}</h2>
            <p className="muted">
              Updated {formatUpdatedAt(weather.lastSuccessfulAt ?? weather.data.updatedAt)}
            </p>
            <section className="metrics">
              <div className="metric">
                <span>Feels like</span>
                <strong>
                  {formatTemperature(weather.data.current.apparentTemperatureC, unit)}
                </strong>
              </div>
              <div className="metric">
                <span>Humidity</span>
                <strong>{weather.data.current.humidityPercent}%</strong>
              </div>
              <div className="metric">
                <span>Wind</span>
                <strong>{weather.data.current.windSpeedKmh} km/h</strong>
              </div>
              <div className="metric">
                <span>Rain</span>
                <strong>{weather.data.current.precipitationMm} mm</strong>
              </div>
            </section>
            <p className="status">
              The {VIEWS.find((item) => item.id === view)?.label} data will visible be here.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
