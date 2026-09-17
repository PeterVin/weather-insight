import { useEffect, useState } from 'react';

import { searchLocations } from '../../weather/api/openMeteo';
import type { Location } from '../../weather/model/weather.types';

interface LocationSearchState {
  locations: Location[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const INITIAL_STATE: LocationSearchState = {
  locations: [],
  status: 'idle',
  error: null,
};

export function useLocationSearch(query: string): LocationSearchState {
  const [state, setState] = useState<LocationSearchState>(INITIAL_STATE);
  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setState((current) => ({ ...current, status: 'loading', error: null }));
      void searchLocations(normalizedQuery, controller.signal)
        .then((locations) => {
          setState({ locations, status: 'success', error: null });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            locations: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'Search failed.',
          });
        });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canSearch, normalizedQuery]);

  return canSearch ? state : INITIAL_STATE;
}
