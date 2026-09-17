import { useCallback, useEffect, useState } from 'react';
import { LocationSearch } from '../features/locations/components/LocationSearch';
import {
  DEFAULT_LOCATION,
  useSelectedLocation,
} from '../features/locations/model/useSelectedLocation';
import type { DashboardView } from '../features/weather/model/weather.types';

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
  const [location, setLocation] = useSelectedLocation();
  const [view, setViewState] = useState<DashboardView>(viewFromUrl);
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <strong>Weather Insight</strong>
        <span>The #1,243,163 weather app </span>
        <LocationSearch selectedLocation={location} onSelect={setLocation} />
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
        <p className="eyebrow">Selected location</p>
        <h1>{location.name}</h1>
        <p>
          {location.adminArea ?? DEFAULT_LOCATION.adminArea}, {location.country}
        </p>
        <p className="muted">
          {VIEWS.find((item) => item.id === view)?.label} will use {location.timezone}.
        </p>
      </main>
    </div>
  );
}
