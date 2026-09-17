import { useEffect, useId, useRef, useState } from 'react';

import type { Location } from '../../weather/model/weather.types';
import { useLocationSearch } from '../model/useLocationSearch';

interface LocationSearchProps {
  selectedLocation: Location;
  onSelect: (location: Location) => void;
}

export function LocationSearch({
  selectedLocation,
  onSelect,
}: LocationSearchProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const search = useLocationSearch(query);
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent): void => {
      const container = containerRef.current;
      if (container && !event.composedPath().includes(container)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, []);

  const selectLocation = (location: Location): void => {
    onSelect(location);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const hasQuery = query.trim().length >= 2;
  const selectedIndex =
    search.locations.length === 0 || activeIndex >= search.locations.length
      ? -1
      : Math.max(0, activeIndex);

  return (
    <div className="location-search" ref={containerRef}>
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="search-form__label" htmlFor={inputId}>
          Search locations
        </label>
        <div className="search-form__field">
          <span className="search-form__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            id={inputId}
            className="search-form__input"
            type="search"
            autoComplete="off"
            placeholder={`Search from ${selectedLocation.name}…`}
            value={query}
            role="combobox"
            aria-expanded={isOpen && hasQuery}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              isOpen && selectedIndex >= 0
                ? `${listboxId}-option-${String(selectedIndex)}`
                : undefined
            }
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsOpen(false);
              if (event.key === 'ArrowDown' && search.locations.length > 0) {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((current) => (current + 1) % search.locations.length);
              }
              if (event.key === 'ArrowUp' && search.locations.length > 0) {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((current) =>
                  current <= 0 ? search.locations.length - 1 : current - 1,
                );
              }
              if (event.key === 'Enter' && isOpen && selectedIndex >= 0) {
                const activeLocation = search.locations[selectedIndex];
                if (activeLocation) {
                  event.preventDefault();
                  selectLocation(activeLocation);
                }
              }
            }}
          />
          {query.length > 0 && (
            <button
              className="search-form__clear"
              type="button"
              aria-label="Clear location search"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
          {search.status === 'loading' && (
            <span className="search-form__spinner" role="status" aria-label="Searching locations" />
          )}
        </div>
      </form>

      {isOpen && hasQuery && (
        <div className="search-popover">
          <ul
            className="search-results"
            id={listboxId}
            role="listbox"
            aria-label="Location search results"
          >
            {search.locations.map((location, index) => (
              <li
                key={location.id}
                id={`${listboxId}-option-${String(index)}`}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <button
                  className={`search-result${selectedIndex === index ? ' search-result--active' : ''}`}
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                  }}
                  onClick={() => {
                    selectLocation(location);
                  }}
                >
                  <span className="search-result__pin" aria-hidden="true">
                    ●
                  </span>
                  <span className="search-result__text">
                    <strong>{location.name}</strong>
                    <span>{[location.adminArea, location.country].filter(Boolean).join(', ')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {search.status === 'success' && search.locations.length === 0 && (
            <p className="search-empty" role="status">
              No matching locations found.
            </p>
          )}
          {search.status === 'error' && (
            <p className="search-error" role="alert">
              {search.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
