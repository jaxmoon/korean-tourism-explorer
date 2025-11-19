import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Location } from '@/lib/models/location';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_VIEW_MODE: ViewMode = 'split';
const DEFAULT_STORAGE_KEY = 'tourism_explorer_view_preference';

type ScrollBehaviorOption = ScrollBehavior | 'auto';

export type ViewMode = 'list' | 'map' | 'split';

interface UseMapListSyncParams {
  locations: Location[];
  initialCenter?: { lat: number; lng: number };
  initialViewMode?: ViewMode;
  scrollBehavior?: ScrollBehaviorOption;
  debounceMs?: number;
  storageKey?: string;
}

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const globalWithStorage = globalThis as { localStorage?: Storage };
  return globalWithStorage.localStorage ?? null;
};

const isViewMode = (value: string): value is ViewMode =>
  value === 'list' || value === 'map' || value === 'split';

export interface UseMapListSyncResult {
  selectedLocationId: string | null;
  highlightedCardId: string | null;
  mapCenter: { lat: number; lng: number };
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  listRef: React.RefObject<HTMLDivElement>;
  registerCardRef: (contentId: string, element: HTMLElement | null) => void;
  scrollToCard: (contentId: string) => void;
  centerOnMarker: (location: Location) => void;
  onMarkerClick: (location: Location) => void;
  onCardClick: (location: Location) => void;
}

export const useMapListSync = ({
  locations,
  initialCenter = DEFAULT_CENTER,
  initialViewMode = DEFAULT_VIEW_MODE,
  scrollBehavior = 'smooth',
  debounceMs = 300,
  storageKey = DEFAULT_STORAGE_KEY,
}: UseMapListSyncParams): UseMapListSyncResult => {
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const pendingInteraction = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);

  const resolvedStorageKey = storageKey ?? DEFAULT_STORAGE_KEY;

  const computeInitialViewMode = useCallback((): ViewMode => {
    const storage = getStorage();
    if (!storage) {
      return initialViewMode;
    }

    const stored = storage.getItem(resolvedStorageKey);
    if (!stored) {
      return initialViewMode;
    }

    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'string' && isViewMode(parsed)) {
        return parsed;
      }
    } catch {
      /* no-op */
    }
    return initialViewMode;
  }, [initialViewMode, resolvedStorageKey]);

  const [viewMode, setViewModeState] = useState<ViewMode>(() => computeInitialViewMode());

  const persistViewMode = useCallback(
    (mode: ViewMode) => {
      const storage = getStorage();
      if (!storage) {
        return;
      }
      try {
        storage.setItem(resolvedStorageKey, JSON.stringify(mode));
      } catch (error) {
        console.warn('Failed to persist view mode', error);
      }
    },
    [resolvedStorageKey],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      persistViewMode(mode);
    },
    [persistViewMode],
  );

  useEffect(() => {
    return () => {
      if (pendingInteraction.current !== null) {
        clearTimeout(pendingInteraction.current);
      }
    };
  }, []);

  const registerCardRef = useCallback((contentId: string, element: HTMLElement | null) => {
    if (!element) {
      cardRefs.current.delete(contentId);
      return;
    }
    cardRefs.current.set(contentId, element);
  }, []);

  const scrollToCard = useCallback(
    (contentId: string) => {
      const target = cardRefs.current.get(contentId);
      if (!target) return;
      target.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
    },
    [scrollBehavior],
  );

  const centerOnMarker = useCallback(
    (location: Location) => {
      if (typeof location.mapY !== 'number' || typeof location.mapX !== 'number') {
        return;
      }
      setMapCenter({ lat: location.mapY, lng: location.mapX });
    },
    [],
  );

  const scheduleInteraction = useCallback(
    (callback: () => void) => {
      if (!debounceMs) {
        callback();
        return;
      }

      if (pendingInteraction.current !== null) {
        clearTimeout(pendingInteraction.current);
      }

      pendingInteraction.current = setTimeout(() => {
        pendingInteraction.current = null;
        callback();
      }, debounceMs);
    },
    [debounceMs],
  );

  const onMarkerClick = useCallback(
    (location: Location) => {
      setSelectedLocationId(location.contentId);
      setHighlightedCardId(location.contentId);
      scheduleInteraction(() => scrollToCard(location.contentId));
    },
    [scheduleInteraction, scrollToCard],
  );

  const onCardClick = useCallback(
    (location: Location) => {
      setSelectedLocationId(location.contentId);
      setHighlightedCardId(location.contentId);
      centerOnMarker(location);
    },
    [centerOnMarker],
  );

  useEffect(() => {
    if (selectedLocationId && !locations.some((location) => location.contentId === selectedLocationId)) {
      setSelectedLocationId(null);
    }
  }, [locations, selectedLocationId]);

  return useMemo(
    () => ({
      selectedLocationId,
      highlightedCardId,
      mapCenter,
      viewMode,
      setViewMode,
      listRef,
      registerCardRef,
      scrollToCard,
      centerOnMarker,
      onMarkerClick,
      onCardClick,
    }),
    [
      centerOnMarker,
      highlightedCardId,
      mapCenter,
      onCardClick,
      onMarkerClick,
      registerCardRef,
      scrollToCard,
      selectedLocationId,
      setViewMode,
      viewMode,
    ],
  );
};
