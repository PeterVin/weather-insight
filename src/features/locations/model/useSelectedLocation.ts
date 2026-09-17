import { useCallback, useEffect, useState } from 'react';

import type { Location } from '../../weather/model/weather.types';

const STORAGE_KEY = 'weather-insight:selected-location';

export const DEFAULT_LOCATION: Location = {
  id: 'budapest-hu',
  name: 'Budapest',
  country: 'Hungary',
  latitude: 47.4979,
  longitude: 19.0402,
  timezone: 'Europe/Budapest',
};

function locationFromUrl(): Location | null {
  const params = new URLSearchParams(window.location.search);
  const latitude = Number(params.get('lat'));
  const longitude = Number(params.get('lon'));
  const name = params.get('place');
  const country = params.get('country');
  const timezone = params.get('tz');

  if (
    name === null ||
    country === null ||
    timezone === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    id: params.get('locationId') ?? `${String(latitude)},${String(longitude)}`,
    name,
    country,
    adminArea: params.get('admin') ?? undefined,
    latitude,
    longitude,
    timezone,
  };
}

function storedLocation(): Location | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) return null;
    const candidate = JSON.parse(value) as Partial<Location>;
    return typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.country === 'string' &&
      typeof candidate.latitude === 'number' &&
      typeof candidate.longitude === 'number' &&
      typeof candidate.timezone === 'string'
      ? (candidate as Location)
      : null;
  } catch {
    return null;
  }
}

function initialLocation(): Location {
  return locationFromUrl() ?? storedLocation() ?? DEFAULT_LOCATION;
}

function writeLocation(location: Location): void {
  const params = new URLSearchParams(window.location.search);
  params.set('locationId', location.id);
  params.set('place', location.name);
  params.set('country', location.country);
  params.set('lat', String(location.latitude));
  params.set('lon', String(location.longitude));
  params.set('tz', location.timezone);
  if (location.adminArea) params.set('admin', location.adminArea);
  else params.delete('admin');
  window.history.pushState(
    null,
    '',
    `${window.location.pathname}?${params}${window.location.hash}`,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export function useSelectedLocation(): [Location, (location: Location) => void] {
  const [location, setLocationState] = useState<Location>(initialLocation);

  useEffect(() => {
    const handlePopState = (): void => {
      setLocationState(locationFromUrl() ?? DEFAULT_LOCATION);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setLocation = useCallback((nextLocation: Location): void => {
    writeLocation(nextLocation);
    setLocationState(nextLocation);
  }, []);

  return [location, setLocation];
}
