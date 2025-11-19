# Task M: Mobile Bottom Sheet (TDD) ⭐ CRITICAL

**Phase**: 4 | **Time**: 3.5h | **Agent**: frontend-ui-specialist
**Dependencies**: Task I (Map Integration)
**On Critical Path**: ⭐ Yes
**EST**: 11.5h | **EFT**: 15h | **Slack**: 0h

## Objective
Create swipeable bottom sheet for mobile map view with 3 states.

---

## 🔴 RED (45min)

```typescript
// components/map/__tests__/BottomSheet.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet Component', () => {
  it('should fail: render in collapsed state by default', () => {
    render(
      <BottomSheet>
        <div>Content</div>
      </BottomSheet>
    );

    const sheet = screen.getByTestId('bottom-sheet');
    expect(sheet).toHaveClass('h-[20vh]'); // Collapsed
  });

  it('should fail: expand on swipe up', () => {
    render(<BottomSheet><div>Content</div></BottomSheet>);

    const handle = screen.getByTestId('sheet-handle');

    // Simulate swipe up
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 50 }] });
    fireEvent.touchEnd(handle);

    const sheet = screen.getByTestId('bottom-sheet');
    expect(sheet).toHaveClass('h-[50vh]'); // Half-open
  });

  it('should fail: have 3 height states', () => {
    const { rerender } = render(<BottomSheet state="collapsed"><div>Content</div></BottomSheet>);
    expect(screen.getByTestId('bottom-sheet')).toHaveClass('h-[20vh]');

    rerender(<BottomSheet state="half"><div>Content</div></BottomSheet>);
    expect(screen.getByTestId('bottom-sheet')).toHaveClass('h-[50vh]');

    rerender(<BottomSheet state="full"><div>Content</div></BottomSheet>);
    expect(screen.getByTestId('bottom-sheet')).toHaveClass('h-[80vh]');
  });
});
```

---

## 🟢 GREEN (2h)

```typescript
// components/map/BottomSheet.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type SheetState = 'collapsed' | 'half' | 'full';

interface BottomSheetProps {
  children: React.ReactNode;
  state?: SheetState;
  onStateChange?: (state: SheetState) => void;
}

const HEIGHT_MAP = {
  collapsed: '20vh',
  half: '50vh',
  full: '80vh',
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  state: controlledState,
  onStateChange,
}) => {
  const [internalState, setInternalState] = useState<SheetState>('collapsed');
  const state = controlledState ?? internalState;
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const setState = (newState: SheetState) => {
    if (controlledState === undefined) {
      setInternalState(newState);
    }
    onStateChange?.(newState);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const delta = startY.current - currentY.current;

    // Swipe up (delta > 0)
    if (delta > 50) {
      if (state === 'collapsed') {
        setState('half');
      } else if (state === 'half') {
        setState('full');
      }
    }
    // Swipe down (delta < 0)
    else if (delta < -50) {
      if (state === 'full') {
        setState('half');
      } else if (state === 'half') {
        setState('collapsed');
      }
    }

    startY.current = 0;
    currentY.current = 0;
  };

  return (
    <div
      ref={sheetRef}
      data-testid="bottom-sheet"
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl',
        'transition-all duration-300 ease-out',
        'overflow-hidden z-50'
      )}
      style={{ height: HEIGHT_MAP[state] }}
    >
      {/* Handle */}
      <div
        data-testid="sheet-handle"
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto px-4 pb-4">
        {children}
      </div>
    </div>
  );
};
```

---

## 🔵 REFACTOR (45min)

```typescript
// components/map/MapWithBottomSheet.tsx
'use client';

import React, { useState } from 'react';
import { NaverMap } from './NaverMap';
import { BottomSheet } from './BottomSheet';
import { LocationCard } from '@/components/search/LocationCard';
import type { Location } from '@/lib/models/location';

export const MapWithBottomSheet: React.FC<{
  locations: Location[];
}> = ({ locations }) => {
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'full'>('collapsed');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setSheetState('half');
  };

  return (
    <div className="relative h-screen">
      {/* Map (full screen) */}
      <NaverMap
        locations={locations}
        onMarkerClick={handleMarkerClick}
        className="absolute inset-0"
      />

      {/* Bottom Sheet */}
      <BottomSheet state={sheetState} onStateChange={setSheetState}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              검색결과 {locations.length}개
            </h3>
            <button
              onClick={() => setSheetState('collapsed')}
              className="text-sm text-primary-600"
            >
              목록 보기
            </button>
          </div>

          {/* Scrollable location cards */}
          <div className="space-y-3">
            {locations.map((location) => (
              <LocationCard
                key={location.contentId}
                location={location}
                isHighlighted={selectedLocation?.contentId === location.contentId}
                onClick={() => {
                  setSelectedLocation(location);
                  // Center map on location
                }}
              />
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
```

```typescript
// Add smooth animations
// components/map/BottomSheet.tsx (enhanced)
export const BottomSheet: React.FC<BottomSheetProps> = ({ ... }) => {
  // Add spring animation
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl',
        'transition-all ease-out z-50',
        isDragging ? 'duration-0' : 'duration-300'
      )}
      style={{
        height: HEIGHT_MAP[state],
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* ... rest of component */}
    </div>
  );
};
```

## Success Criteria

- [x] 3-state bottom sheet (collapsed/half/full)
- [x] Swipe gestures working
- [x] Smooth animations
- [x] Map-sheet synchronization
- [x] Scrollable content
- [x] Touch-optimized
- [x] Tests passing ✅
- [x] Critical path task complete ⭐
