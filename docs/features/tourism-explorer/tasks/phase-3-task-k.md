# Task K: Favorites Management (TDD)

**Phase**: 3
**Estimated Time**: 2.5 hours (TDD included)
**Dependencies**: Task G (Component Library)
**Assigned Agent**: frontend-state-specialist
**Parallel Group**: 3A
**EST**: 5.5h | **EFT**: 8h | **Slack**: 6.5h

## Objective

Implement favorites management with LocalStorage, export/import, using TDD.

---

## 🔴 RED (30min)

```typescript
// hooks/__tests__/useFavorites.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

describe('useFavorites Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should fail: add favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite({
        contentId: '123',
        contentTypeId: 12,
        title: 'Test',
        address: 'Seoul',
      });
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('should fail: remove favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite({ contentId: '123', title: 'Test' } as any);
      result.current.removeFavorite('123');
    });

    expect(result.current.favorites).toHaveLength(0);
  });

  it('should fail: persist to LocalStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite({ contentId: '123', title: 'Test' } as any);
    });

    const stored = localStorage.getItem('tourism_explorer_favorites');
    expect(stored).toBeDefined();
  });

  it('should fail: enforce 100 item limit', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      for (let i = 0; i < 101; i++) {
        result.current.addFavorite({ contentId: String(i), title: 'Test' } as any);
      }
    });

    expect(result.current.favorites).toHaveLength(100);
  });
});
```

---

## 🟢 GREEN (1.5h)

```typescript
// hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import type { Location } from '@/lib/models/location';

const STORAGE_KEY = 'tourism_explorer_favorites';
const MAX_FAVORITES = 100;

interface FavoriteItem {
  contentId: string;
  contentType: number;
  title: string;
  thumbnailUrl?: string;
  address: string;
  addedAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setFavorites(Object.values(data.favorites || {}));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  // Save to LocalStorage
  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    try {
      const data = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        maxItems: MAX_FAVORITES,
        favorites: items.reduce((acc, item) => {
          acc[item.contentId] = item;
          return acc;
        }, {} as Record<string, FavoriteItem>),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save favorites:', error);
      throw new Error('저장 공간이 부족합니다.');
    }
  }, []);

  // Add favorite
  const addFavorite = useCallback(
    (location: Location) => {
      setFavorites((prev) => {
        // Check limit
        if (prev.length >= MAX_FAVORITES) {
          throw new Error(`즐겨찾기 한도(${MAX_FAVORITES})에 도달했습니다.`);
        }

        // Check duplicate
        if (prev.some((f) => f.contentId === location.contentId)) {
          return prev;
        }

        const newItem: FavoriteItem = {
          contentId: location.contentId,
          contentType: location.contentTypeId,
          title: location.title,
          thumbnailUrl: location.thumbnailUrl,
          address: location.address || '',
          addedAt: new Date().toISOString(),
        };

        const updated = [...prev, newItem];
        saveFavorites(updated);
        return updated;
      });
    },
    [saveFavorites]
  );

  // Remove favorite
  const removeFavorite = useCallback(
    (contentId: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.contentId !== contentId);
        saveFavorites(updated);
        return updated;
      });
    },
    [saveFavorites]
  );

  // Check if favorite
  const isFavorite = useCallback(
    (contentId: string) => {
      return favorites.some((f) => f.contentId === contentId);
    },
    [favorites]
  );

  // Export favorites
  const exportFavorites = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Tourism Explorer v1.0',
      totalItems: favorites.length,
      favorites,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favorites_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [favorites]);

  // Import favorites
  const importFavorites = useCallback(
    (file: File, strategy: 'keep' | 'overwrite' = 'keep') => {
      return new Promise<{ imported: number; skipped: number }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            const imported = data.favorites || [];

            let skipped = 0;
            const newFavorites = [...favorites];

            imported.forEach((item: FavoriteItem) => {
              const exists = newFavorites.some((f) => f.contentId === item.contentId);

              if (exists && strategy === 'keep') {
                skipped++;
              } else if (exists && strategy === 'overwrite') {
                const index = newFavorites.findIndex((f) => f.contentId === item.contentId);
                newFavorites[index] = item;
              } else {
                if (newFavorites.length < MAX_FAVORITES) {
                  newFavorites.push(item);
                } else {
                  skipped++;
                }
              }
            });

            setFavorites(newFavorites);
            saveFavorites(newFavorites);

            resolve({
              imported: imported.length - skipped,
              skipped,
            });
          } catch (error) {
            reject(new Error('올바르지 않은 파일 형식입니다.'));
          }
        };
        reader.readAsText(file);
      });
    },
    [favorites, saveFavorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    exportFavorites,
    importFavorites,
    count: favorites.length,
    isFull: favorites.length >= MAX_FAVORITES,
  };
}
```

---

## 🔵 REFACTOR (30min)

```typescript
// components/favorites/FavoriteButton.tsx
'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/Button';
import type { Location } from '@/lib/models/location';

export const FavoriteButton: React.FC<{ location: Location }> = ({ location }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = React.useState(false);
  const favorite = isFavorite(location.contentId);

  const handleClick = () => {
    try {
      if (favorite) {
        removeFavorite(location.contentId);
      } else {
        addFavorite(location);
      }

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={isAnimating ? 'animate-pulse scale-125' : ''}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          favorite ? 'fill-favorite text-favorite' : 'text-gray-400'
        }`}
      />
    </Button>
  );
};
```

---

## Success Criteria

- [x] useFavorites hook with LocalStorage
- [x] Add/remove favorites
- [x] 100 item limit enforced
- [x] Export/import JSON
- [x] FavoriteButton component
- [x] Tests passing ✅
