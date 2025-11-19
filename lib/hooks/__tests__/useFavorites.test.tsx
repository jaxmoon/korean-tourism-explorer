import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFavorites, MAX_FAVORITES } from '@/lib/hooks/useFavorites';
import type { Location } from '@/lib/models/location';

const FAVORITES_STORAGE_KEY = 'tourism_explorer_favorites';

type LocalStorageMock = Storage & {
  setQuotaError: (enabled: boolean) => void;
};

const createLocalStorageMock = (): LocalStorageMock => {
  const store = new Map<string, string>();
  let quotaError = false;

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      if (quotaError) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store.set(key, value);
    },
    setQuotaError(enabled: boolean) {
      quotaError = enabled;
    },
  } as LocalStorageMock;
};

const createLocation = (() => {
  let counter = 0;
  return (overrides: Partial<Location> = {}): Location => {
    counter += 1;
    return {
      contentId: overrides.contentId ?? `content-${counter}`,
      contentTypeId: overrides.contentTypeId ?? 12,
      title: overrides.title ?? `Location ${counter}`,
      ...overrides,
    };
  };
})();

describe('useFavorites hook', () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds a favorite to an empty list', () => {
    const favorite = createLocation({ contentId: 'fav-1' });
    const { result } = renderHook(() => useFavorites());

    let success: boolean | undefined;
    act(() => {
      success = result.current.addFavorite(favorite);
    });

    expect(success).toBe(true);
    expect(result.current.favorites).toEqual([favorite]);
    expect(result.current.count).toBe(1);
    expect(result.current.isFull).toBe(false);
  });

  it('removes a favorite by contentId', () => {
    const first = createLocation({ contentId: 'fav-1' });
    const second = createLocation({ contentId: 'fav-2' });
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(first);
      result.current.addFavorite(second);
    });

    let removed: boolean | undefined;
    act(() => {
      removed = result.current.removeFavorite(first.contentId);
    });

    expect(removed).toBe(true);
    expect(result.current.favorites).toEqual([second]);
    expect(result.current.isFavorite(first.contentId)).toBe(false);
    expect(result.current.count).toBe(1);
  });

  it('reports favorite membership via isFavorite', () => {
    const favorite = createLocation({ contentId: 'fav-1' });
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(favorite);
    });

    expect(result.current.isFavorite(favorite.contentId)).toBe(true);
    expect(result.current.isFavorite('missing')).toBe(false);
  });

  it('persists favorites to localStorage with the expected key', () => {
    const favorite = createLocation({ contentId: 'persist-me' });
    const { result } = renderHook(() => useFavorites());
    const setItemSpy = vi.spyOn(localStorageMock, 'setItem');

    act(() => {
      result.current.addFavorite(favorite);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      FAVORITES_STORAGE_KEY,
      expect.any(String),
    );
    const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual([favorite]);
  });

  it('loads favorites from localStorage on mount', () => {
    const storedFavorite = createLocation({ contentId: 'stored-1' });
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([storedFavorite]));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([storedFavorite]);
    expect(result.current.count).toBe(1);
  });

  it('enforces the MAX_FAVORITES limit and prevents overflow', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      for (let i = 0; i < MAX_FAVORITES; i += 1) {
        result.current.addFavorite(
          createLocation({ contentId: `fav-${i}`, title: `Favorite ${i}` }),
        );
      }
    });

    const overflowFavorite = createLocation({ contentId: 'overflow' });
    let success: boolean | undefined;
    act(() => {
      success = result.current.addFavorite(overflowFavorite);
    });

    expect(success).toBe(false);
    expect(result.current.favorites).toHaveLength(MAX_FAVORITES);
    expect(result.current.isFavorite(overflowFavorite.contentId)).toBe(false);
    expect(result.current.count).toBe(MAX_FAVORITES);
    expect(result.current.isFull).toBe(true);
  });

  it('handles localStorage quota errors gracefully', () => {
    const { result } = renderHook(() => useFavorites());
    const favorite = createLocation({ contentId: 'quota' });
    localStorageMock.setQuotaError(true);

    let success: boolean | undefined;
    expect(() => {
      act(() => {
        success = result.current.addFavorite(favorite);
      });
    }).not.toThrow();

    expect(success).toBe(false);
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it('exports favorites to JSON format', () => {
    const favorites = [
      createLocation({ contentId: 'export-1', title: 'Export One' }),
      createLocation({ contentId: 'export-2', title: 'Export Two' }),
    ];
    const { result } = renderHook(() => useFavorites());

    act(() => {
      favorites.forEach((favorite) => {
        result.current.addFavorite(favorite);
      });
    });

    const exported = result.current.exportFavorites();
    expect(typeof exported).toBe('string');

    const parsed = JSON.parse(exported);
    expect(parsed).toEqual(favorites);
  });

  it("imports favorites from JSON using the 'keep' strategy", () => {
    const existing = createLocation({ contentId: 'keep-1', title: 'Existing' });
    const updatedDuplicate = { ...existing, title: 'Updated Title' };
    const incoming = createLocation({ contentId: 'keep-2', title: 'Incoming' });
    const payload = JSON.stringify([updatedDuplicate, incoming]);
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(existing);
    });

    act(() => {
      result.current.importFavorites(payload, 'keep');
    });

    const stored = result.current.favorites.find(
      (favorite) => favorite.contentId === existing.contentId,
    );
    const newFavorite = result.current.favorites.find(
      (favorite) => favorite.contentId === incoming.contentId,
    );

    expect(stored?.title).toBe(existing.title);
    expect(newFavorite).toMatchObject(incoming);
    expect(result.current.favorites).toHaveLength(2);
  });

  it("imports favorites from JSON using the 'overwrite' strategy", () => {
    const existing = createLocation({ contentId: 'overwrite-1', title: 'Existing' });
    const updatedDuplicate = { ...existing, title: 'Updated Title' };
    const incoming = createLocation({ contentId: 'overwrite-2', title: 'Incoming' });
    const payload = JSON.stringify([updatedDuplicate, incoming]);
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(existing);
    });

    act(() => {
      result.current.importFavorites(payload, 'overwrite');
    });

    const stored = result.current.favorites.find(
      (favorite) => favorite.contentId === existing.contentId,
    );

    expect(stored?.title).toBe(updatedDuplicate.title);
    expect(result.current.isFavorite(incoming.contentId)).toBe(true);
    expect(result.current.favorites).toHaveLength(2);
  });
});
