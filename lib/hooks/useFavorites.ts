import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Location } from '@/lib/models/location';
import { safeValidateLocation } from '@/lib/models/location';

const FAVORITES_STORAGE_KEY = 'tourism_explorer_favorites';

export const MAX_FAVORITES = 100;

type ImportStrategy = 'keep' | 'overwrite';

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const globalWithStorage = globalThis as { localStorage?: Storage };
  return globalWithStorage.localStorage ?? null;
};

const parseFavoritesPayload = (payload: string): Location[] => {
  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const validated: Location[] = [];
    parsed.forEach((item) => {
      const result = safeValidateLocation(item);
      if (result.success) {
        validated.push(result.data);
      }
    });
    return validated;
  } catch {
    return [];
  }
};

export const useFavorites = () => {
  const [favorites, setFavoritesState] = useState<Location[]>([]);
  const favoritesRef = useRef<Location[]>(favorites);

  const applyFavorites = useCallback(
    (next: Location[]) => {
      favoritesRef.current = next;
      setFavoritesState(next);
    },
    [setFavoritesState],
  );

  const persistFavorites = useCallback((next: Location[]) => {
    const storage = getStorage();
    if (!storage) {
      return true;
    }

    try {
      storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch (error) {
      console.error('Failed to persist favorites', error);
      return false;
    }
  }, []);

  const updateFavorites = useCallback(
    (createNext: (prev: Location[]) => Location[] | null) => {
      const previousSnapshot = favoritesRef.current;
      const nextSnapshot = createNext(previousSnapshot);

      if (!nextSnapshot) {
        return false;
      }

      applyFavorites(nextSnapshot);

      if (!persistFavorites(nextSnapshot)) {
        applyFavorites(previousSnapshot);
        return false;
      }

      return true;
    },
    [applyFavorites, persistFavorites],
  );

  useEffect(() => {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    const stored = storage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return;
    }

    const parsed = parseFavoritesPayload(stored);
    if (parsed.length === 0) {
      return;
    }

    applyFavorites(parsed.slice(0, MAX_FAVORITES));
  }, [applyFavorites]);

  const addFavorite = useCallback(
    (favorite: Location) =>
      updateFavorites((prev) => {
        if (prev.some((entry) => entry.contentId === favorite.contentId)) {
          return null;
        }

        if (prev.length >= MAX_FAVORITES) {
          return null;
        }

        return [...prev, favorite];
      }),
    [updateFavorites],
  );

  const removeFavorite = useCallback(
    (contentId: string) =>
      updateFavorites((prev) => {
        if (!prev.some((entry) => entry.contentId === contentId)) {
          return null;
        }

        return prev.filter((entry) => entry.contentId !== contentId);
      }),
    [updateFavorites],
  );

  const isFavorite = useCallback(
    (contentId: string) => favorites.some((entry) => entry.contentId === contentId),
    [favorites],
  );

  const exportFavorites = useCallback(() => JSON.stringify(favorites), [favorites]);

  const importFavorites = useCallback(
    (payload: string, strategy: ImportStrategy = 'keep') => {
      const incoming = parseFavoritesPayload(payload);
      if (incoming.length === 0) {
        return false;
      }

      const deduped = Array.from(
        incoming.reduce((map, favorite) => map.set(favorite.contentId, favorite), new Map<string, Location>()),
        ([, value]) => value,
      );

      if (strategy === 'keep') {
        return updateFavorites((prev) => {
          const existingIds = new Set(prev.map((favorite) => favorite.contentId));
          const next = [...prev];
          let changed = false;

          deduped.forEach((favorite) => {
            if (next.length >= MAX_FAVORITES || existingIds.has(favorite.contentId)) {
              return;
            }
            next.push(favorite);
            existingIds.add(favorite.contentId);
            changed = true;
          });

          return changed ? next : null;
        });
      }

      return updateFavorites((prev) => {
        const incomingMap = new Map(deduped.map((favorite) => [favorite.contentId, favorite]));
        let changed = false;

        const updated = prev.map((favorite) => {
          const replacement = incomingMap.get(favorite.contentId);
          if (replacement) {
            incomingMap.delete(favorite.contentId);
            changed = true;
            return replacement;
          }
          return favorite;
        });

        incomingMap.forEach((favorite) => {
          if (updated.length < MAX_FAVORITES) {
            updated.push(favorite);
            changed = true;
          }
        });

        return changed ? updated : null;
      });
    },
    [updateFavorites],
  );

  const count = useMemo(() => favorites.length, [favorites]);
  const isFull = useMemo(() => count >= MAX_FAVORITES, [count]);

  return {
    favorites,
    count,
    isFull,
    addFavorite,
    removeFavorite,
    isFavorite,
    exportFavorites,
    importFavorites,
  };
};
