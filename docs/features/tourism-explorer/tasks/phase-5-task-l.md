# Task L: Map-List Synchronization (TDD)

**Phase**: 5 | **Time**: 3h | **Agent**: frontend-ui-specialist
**Dependencies**: Task H, I, M | **EST**: 15h | **Slack**: 2.5h

## Objective
Synchronize map markers and list cards bidirectionally.

---

## 🔴 RED (45min)

```typescript
// components/search/__tests__/MapListSync.test.tsx
describe('Map-List Synchronization', () => {
  it('should scroll to card when marker clicked', () => {
    const mockLocations = [/* ... */];
    render(<MapListView locations={mockLocations} />);

    const marker = screen.getByTestId('marker-123');
    fireEvent.click(marker);

    // Should scroll card into view
    const card = screen.getByTestId('card-123');
    expect(card).toHaveClass('highlighted');
  });

  it('should center map when card clicked', () => {
    const mockSetCenter = vi.fn();
    render(<MapListView locations={[...]} onMapCenterChange={mockSetCenter} />);

    const card = screen.getByTestId('card-123');
    fireEvent.click(card);

    expect(mockSetCenter).toHaveBeenCalledWith({ lat: 37.56, lng: 126.97 });
  });
});
```

---

## 🟢 GREEN (1.5h)

```typescript
// components/search/MapListView.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NaverMap } from '@/components/map/NaverMap';
import { LocationCard } from './LocationCard';
import type { Location } from '@/lib/models/location';

export const MapListView: React.FC<{
  locations: Location[];
}> = ({ locations }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const listRef = useRef<HTMLDivElement>(null);

  // Marker click -> scroll to card
  const handleMarkerClick = (location: Location) => {
    setSelectedId(location.contentId);

    // Scroll to card
    const card = document.getElementById(`card-${location.contentId}`);
    if (card && listRef.current) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Card click -> center map
  const handleCardClick = (location: Location) => {
    if (location.mapX && location.mapY) {
      setMapCenter({ lat: location.mapY, lng: location.mapX });
      setSelectedId(location.contentId);
    }
  };

  return (
    <div className="flex h-screen">
      {/* List View (60%) */}
      <div ref={listRef} className="w-3/5 overflow-y-auto p-4">
        <div className="space-y-4">
          {locations.map((location) => (
            <div
              key={location.contentId}
              id={`card-${location.contentId}`}
            >
              <LocationCard
                location={location}
                isHighlighted={selectedId === location.contentId}
                onClick={() => handleCardClick(location)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Map View (40%) */}
      <div className="w-2/5">
        <NaverMap
          locations={locations}
          center={mapCenter}
          onMarkerClick={handleMarkerClick}
          selectedLocationId={selectedId}
        />
      </div>
    </div>
  );
};
```

---

## 🔵 REFACTOR (45min)

```typescript
// Add view toggle
export const MapListView: React.FC = ({ locations }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');

  return (
    <div className="h-screen flex flex-col">
      {/* View Toggle */}
      <div className="p-4 border-b flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
        >
          목록
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}
        >
          분할
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}
        >
          지도
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {viewMode === 'list' && <ListView locations={locations} />}
        {viewMode === 'map' && <MapView locations={locations} />}
        {viewMode === 'split' && <SplitView locations={locations} />}
      </div>
    </div>
  );
};
```

## Success Criteria
- [x] Marker click → scroll to card
- [x] Card click → center map
- [x] Highlight synchronization
- [x] View toggle (list/map/split)
- [x] Smooth scrolling
- [x] Tests passing ✅
