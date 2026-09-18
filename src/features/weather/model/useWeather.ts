import { useCallback, useEffect, useReducer, useRef } from 'react';

import { getWeather } from '../api/openMeteo';
import type { Location, WeatherResponse } from './weather.types';
import { readCachedWeather, writeCachedWeather } from './weatherCache';

interface WeatherState {
  status: 'loading' | 'success' | 'error';
  data: WeatherResponse | null;
  error: string | null;
  isStale: boolean;
  lastSuccessfulAt: string | null;
}

type Action =
  | { type: 'loading'; payload: { data: WeatherResponse; savedAt: string } | null }
  | { type: 'success'; payload: { data: WeatherResponse; savedAt: string } }
  | { type: 'error'; payload: string };

function reducer(state: WeatherState, action: Action): WeatherState {
  switch (action.type) {
    case 'loading':
      return {
        status: 'loading',
        data: action.payload?.data ?? null,
        error: null,
        isStale: action.payload !== null,
        lastSuccessfulAt: action.payload?.savedAt ?? null,
      };
    case 'success':
      return {
        status: 'success',
        data: action.payload.data,
        error: null,
        isStale: false,
        lastSuccessfulAt: action.payload.savedAt,
      };
    case 'error':
      return { ...state, status: 'error', error: action.payload, isStale: state.data !== null };
  }
}

export function useWeather(location: Location): WeatherState & { refresh: () => void } {
  const [state, dispatch] = useReducer(reducer, {
    status: 'loading',
    data: null,
    error: null,
    isStale: false,
    lastSuccessfulAt: null,
  });
  const [refreshSequence, refresh] = useReducer((value: number) => value + 1, 0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const cachedWeather = readCachedWeather(location);
    dispatch({ type: 'loading', payload: cachedWeather });

    if (!navigator.onLine) {
      dispatch({
        type: 'error',
        payload: cachedWeather
          ? 'You are offline. Showing the most recent saved weather.'
          : 'You are offline and no saved forecast is available for this location.',
      });
      return () => {
        controller.abort();
      };
    }

    void getWeather(location, controller.signal)
      .then((response) => {
        if (currentRequest === requestId.current) {
          dispatch({
            type: 'success',
            payload: { data: response, savedAt: writeCachedWeather(location, response) },
          });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || currentRequest !== requestId.current) return;
        dispatch({
          type: 'error',
          payload: error instanceof Error ? error.message : 'Weather data could not be loaded.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [location, refreshSequence]);

  const refreshWeather = useCallback(() => {
    refresh();
  }, []);
  return { ...state, refresh: refreshWeather };
}
