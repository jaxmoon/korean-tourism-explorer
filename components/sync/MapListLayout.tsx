import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { NaverMap } from '@/components/map/NaverMap';
import { MapInfoWindow } from '@/components/map/MapInfoWindow';
import { MobileBottomSheet } from '@/components/map/MobileBottomSheet';
import { LocationCard } from '@/components/search/LocationCard';
import { Button } from '@/components/ui/Button';
import type { Location } from '@/lib/models/location';
import { useMapListSync, type ViewMode } from '@/lib/hooks/useMapListSync';
import { cn } from '@/lib/utils';

type ScrollBehaviorOption = ScrollBehavior | 'auto';

interface MapListLayoutProps {
  locations: Location[];
  initialCenter?: { lat: number; lng: number };
  initialViewMode?: ViewMode;
  scrollBehavior?: ScrollBehaviorOption;
  debounceMs?: number;
  storageKey?: string;
  className?: string;
}

const VIEW_OPTIONS: Array<{ mode: ViewMode; label: string }> = [
  { mode: 'list', label: 'List View' },
  { mode: 'split', label: 'Split View' },
  { mode: 'map', label: 'Map View' },
];

export const MapListLayout: React.FC<MapListLayoutProps> = ({
  locations,
  initialCenter,
  initialViewMode,
  scrollBehavior,
  debounceMs,
  storageKey,
  className,
}) => {
  const {
    selectedLocationId,
    highlightedCardId,
    mapCenter,
    viewMode,
    setViewMode,
    listRef,
    registerCardRef,
    onMarkerClick,
    onCardClick,
  } = useMapListSync({
    locations,
    initialCenter,
    initialViewMode,
    scrollBehavior,
    debounceMs,
    storageKey,
  });

  const [activeLocation, setActiveLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!selectedLocationId) {
      setActiveLocation(null);
      return;
    }
    const next = locations.find((location) => location.contentId === selectedLocationId) ?? null;
    setActiveLocation(next);
  }, [locations, selectedLocationId]);

  const handleMarkerClick = useCallback(
    (location: Location) => {
      onMarkerClick(location);
    },
    [onMarkerClick],
  );

  const handleCardSelect = useCallback(
    (location: Location) => {
      onCardClick(location);
    },
    [onCardClick],
  );

  const handleShowOnMap = useCallback(
    (location: Location) => {
      onCardClick(location);
    },
    [onCardClick],
  );

  const handleMobileSelection = useCallback(
    (location: Location) => {
      onCardClick(location);
    },
    [onCardClick],
  );

  const handleInfoClose = useCallback(() => {
    setActiveLocation(null);
  }, []);

  const isListVisible = viewMode !== 'map';
  const isMapVisible = viewMode !== 'list';

  const registerRefFor = useCallback(
    (contentId: string) => (element: HTMLDivElement | null) => {
      registerCardRef(contentId, element ?? null);
    },
    [registerCardRef],
  );

  const totalResults = useMemo(() => locations.length, [locations]);

  return (
    <section className={cn('space-y-6', className)} aria-label="Map and list synchronized layout">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Explore with Map
          </p>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="map-list-title">
            {totalResults} places found
          </h2>
        </div>
        <div className="flex items-center gap-2 self-start">
          {VIEW_OPTIONS.map(({ mode, label }) => (
            <Button
              key={mode}
              type="button"
              variant={viewMode === mode ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={viewMode === mode}
              onClick={() => setViewMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
      </header>

      <div
        className={cn(
          'flex flex-col gap-6 lg:grid',
          viewMode === 'split' ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
        )}
      >
        {isMapVisible && (
          <div
            className={cn(
              'relative w-full rounded-3xl bg-gray-100',
              viewMode === 'split' ? 'h-[480px] lg:h-[560px]' : 'h-[420px] lg:h-[600px]',
            )}
          >
            <NaverMap locations={locations} center={mapCenter} onMarkerClick={handleMarkerClick} />
            <MapInfoWindow location={activeLocation} onClose={handleInfoClose} />
          </div>
        )}

        {isListVisible && (
          <div
            ref={listRef}
            data-testid="map-list-container"
            className={cn('max-h-[640px] space-y-4 overflow-y-auto pr-2', 'md:pr-4')}
          >
            {locations.length === 0 ? (
              <p className="text-sm text-gray-600">No locations available.</p>
            ) : (
              locations.map((location) => (
                <LocationCard
                  key={location.contentId}
                  ref={registerRefFor(location.contentId)}
                  location={location}
                  isHighlighted={location.contentId === highlightedCardId}
                  onSelect={handleCardSelect}
                  onShowOnMap={handleShowOnMap}
                />
              ))
            )}
          </div>
        )}
      </div>

      <MobileBottomSheet
        locations={locations}
        activeLocationId={highlightedCardId ?? undefined}
        onLocationSelect={handleMobileSelection}
        className="md:hidden"
      />
    </section>
  );
};
