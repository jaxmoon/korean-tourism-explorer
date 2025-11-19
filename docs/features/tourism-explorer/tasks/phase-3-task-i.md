# Task I: Map Integration with Naver Maps (TDD) ⭐ CRITICAL

**Phase**: 3
**Estimated Time**: 6 hours (TDD included)
**Dependencies**: Task G (Component Library)
**Assigned Agent**: frontend-ui-specialist
**Parallel Group**: 3A
**On Critical Path**: ⭐ Yes (LONGEST TASK - HIGHEST PRIORITY!)
**EST**: 5.5h | **EFT**: 11.5h | **Slack**: 0h

## ⚠️ PREREQUISITES - READ FIRST

**CRITICAL**: Before starting this task, you MUST:

1. **Read the Tech Spec**:
   ```
   Read @docs/features/tourism-explorer/tech-spec.md
   ```
   특히 Section 2.3.2 (Map Integration Specifications) 필독!

2. **TDD Approach**: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR

3. **Dependencies**: Task G must be complete (Component Library)

4. **Naver Map API Key**: Obtain from https://www.ncloud.com/

## Objective

Integrate Naver Maps SDK with custom markers, clustering, info windows, and geolocation, following TDD to ensure reliability.

## ⭐ CRITICAL PATH - HIGHEST PRIORITY

**This is the LONGEST task (6 hours) on the critical path!**

**Blocks**:
- Task M: Mobile Bottom Sheet (depends on map component)
- Task L: Map-List Synchronization
- All integration and testing tasks

**Any delay here delays the entire project!**

---

## 🔴 STEP 1: RED - Write Map Component Tests (1 hour)

### 1.1 Set up Naver Maps Testing

**Code**:
```typescript
// components/map/__tests__/NaverMap.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NaverMap } from '../NaverMap';
import type { Location } from '@/lib/models/location';

// Mock Naver Maps SDK
global.naver = {
  maps: {
    Map: vi.fn(),
    Marker: vi.fn(),
    InfoWindow: vi.fn(),
    LatLng: vi.fn((lat, lng) => ({ lat, lng })),
    MarkerClustering: vi.fn(),
  },
} as any;

describe('NaverMap Component', () => {
  const mockLocations: Location[] = [
    {
      contentId: '123',
      contentTypeId: 12,
      title: 'Test Location',
      mapX: 126.97,
      mapY: 37.56,
    },
  ];

  it('should fail: map container not rendered', () => {
    render(<NaverMap locations={mockLocations} />);
    const mapContainer = screen.getByTestId('naver-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should fail: initialize Naver Map instance', async () => {
    render(<NaverMap locations={mockLocations} />);

    await waitFor(() => {
      expect(global.naver.maps.Map).toHaveBeenCalled();
    });
  });

  it('should fail: render markers for each location', async () => {
    render(<NaverMap locations={mockLocations} />);

    await waitFor(() => {
      expect(global.naver.maps.Marker).toHaveBeenCalledTimes(mockLocations.length);
    });
  });
});
```

### 1.2 Write Marker Clustering Tests

**Code**:
```typescript
// components/map/__tests__/MarkerClustering.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NaverMap } from '../NaverMap';
import type { Location } from '@/lib/models/location';

describe('Marker Clustering', () => {
  it('should fail: enable clustering when >50 markers on desktop', () => {
    const manyLocations: Location[] = Array.from({ length: 60 }, (_, i) => ({
      contentId: String(i),
      contentTypeId: 12,
      title: `Location ${i}`,
      mapX: 126.97 + Math.random() * 0.1,
      mapY: 37.56 + Math.random() * 0.1,
    }));

    render(<NaverMap locations={manyLocations} />);

    // Should enable clustering
    expect(global.naver.maps.MarkerClustering).toHaveBeenCalled();
  });

  it('should fail: not cluster when <50 markers', () => {
    const fewLocations: Location[] = Array.from({ length: 10 }, (_, i) => ({
      contentId: String(i),
      contentTypeId: 12,
      title: `Location ${i}`,
      mapX: 126.97,
      mapY: 37.56,
    }));

    render(<NaverMap locations={fewLocations} />);

    // Should NOT enable clustering
    expect(global.naver.maps.MarkerClustering).not.toHaveBeenCalled();
  });
});
```

### 1.3 Write Geolocation Tests

**Code**:
```typescript
// components/map/__tests__/Geolocation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NaverMap } from '../NaverMap';

describe('Geolocation - My Location', () => {
  it('should fail: request geolocation permission', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({ coords: { latitude: 37.56, longitude: 126.97 } })
      ),
    };
    global.navigator.geolocation = mockGeolocation as any;

    render(<NaverMap locations={[]} />);

    const myLocationBtn = screen.getByLabelText(/my location/i);
    fireEvent.click(myLocationBtn);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('should fail: center map on user location', async () => {
    render(<NaverMap locations={[]} />);
    // Test implementation
  });
});
```

**Run tests**:
```bash
npm run test
```

**Expected**: ❌ All tests fail (map component doesn't exist)

---

## 🟢 STEP 2: GREEN - Implement Map Integration (3.5 hours)

### 2.1 Load Naver Maps SDK

**Code**:
```typescript
// hooks/useNaverMaps.ts
import { useEffect, useState } from 'react';

export function useNaverMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.naver && window.naver.maps) {
      setIsLoaded(true);
      return;
    }

    // Load SDK
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError(new Error('Failed to load Naver Maps SDK'));
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return { isLoaded, error };
}
```

### 2.2 Create Map Component

**Code**:
```typescript
// components/map/NaverMap.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useNaverMaps } from '@/hooks/useNaverMaps';
import type { Location } from '@/lib/models/location';
import { createMarkerIcon } from './marker-icons';

export interface NaverMapProps {
  locations: Location[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (location: Location) => void;
  className?: string;
}

export const NaverMap: React.FC<NaverMapProps> = ({
  locations,
  center = { lat: 37.5665, lng: 126.978 }, // Seoul
  zoom = 10,
  onMarkerClick,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [markers, setMarkers] = useState<naver.maps.Marker[]>([]);
  const { isLoaded, error } = useNaverMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const mapInstance = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    setMap(mapInstance);
  }, [isLoaded, center.lat, center.lng, zoom, map]);

  // Add markers
  useEffect(() => {
    if (!map || !locations.length) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers = locations
      .filter((loc) => loc.mapX && loc.mapY)
      .map((location) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(location.mapY!, location.mapX!),
          map,
          title: location.title,
          icon: createMarkerIcon(location.contentTypeId),
        });

        // Add click listener
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onMarkerClick?.(location);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Enable clustering if >50 markers
    if (newMarkers.length > 50) {
      new window.naver.maps.MarkerClustering({
        minClusterSize: 2,
        maxZoom: 13,
        map,
        markers: newMarkers,
        disableClickZoom: false,
        gridSize: 120,
      });
    }
  }, [map, locations, onMarkerClick]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-error">지도를 불러올 수 없습니다.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-600">지도 로딩 중...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      data-testid="naver-map"
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
```

### 2.3 Create Custom Marker Icons

**Code**:
```typescript
// components/map/marker-icons.ts
export function createMarkerIcon(contentTypeId: number): naver.maps.ImageIcon {
  const iconMap: Record<number, { url: string; color: string }> = {
    12: { url: '/icons/marker-attraction.svg', color: '#2196F3' },  // Blue
    14: { url: '/icons/marker-culture.svg', color: '#4CAF50' },     // Green
    15: { url: '/icons/marker-event.svg', color: '#FFC107' },       // Yellow
    32: { url: '/icons/marker-hotel.svg', color: '#9C27B0' },       // Purple
    39: { url: '/icons/marker-food.svg', color: '#F44336' },        // Red
  };

  const icon = iconMap[contentTypeId] || {
    url: '/icons/marker-default.svg',
    color: '#757575',
  };

  return {
    url: icon.url,
    size: new window.naver.maps.Size(32, 40),
    origin: new window.naver.maps.Point(0, 0),
    anchor: new window.naver.maps.Point(16, 40),
  };
}
```

### 2.4 Add Info Window Component

**Code**:
```typescript
// components/map/MapInfoWindow.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Location } from '@/lib/models/location';
import { Button } from '@/components/ui/Button';
import { Heart, Navigation } from 'lucide-react';

export interface MapInfoWindowProps {
  location: Location;
  map: naver.maps.Map;
  marker: naver.maps.Marker;
  onClose: () => void;
}

export const MapInfoWindow: React.FC<MapInfoWindowProps> = ({
  location,
  map,
  marker,
  onClose,
}) => {
  const [infoWindow, setInfoWindow] = useState<naver.maps.InfoWindow | null>(null);

  useEffect(() => {
    const content = `
      <div class="p-4 min-w-[250px] max-w-[300px]">
        ${location.thumbnailUrl ? `<img src="${location.thumbnailUrl}" alt="${location.title}" class="w-full h-32 object-cover rounded mb-2" />` : ''}
        <h3 class="font-semibold text-lg mb-1">${location.title}</h3>
        <p class="text-sm text-gray-600 mb-2">${location.address || ''}</p>
        <div class="flex gap-2">
          <button class="btn-primary" onclick="window.location.href='/attractions/${location.contentId}'">
            상세보기
          </button>
          <button class="btn-secondary">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const iw = new window.naver.maps.InfoWindow({
      content,
      maxWidth: 300,
      borderColor: '#2196F3',
      borderWidth: 2,
      anchorSize: new window.naver.maps.Size(10, 10),
    });

    iw.open(map, marker);
    setInfoWindow(iw);

    return () => {
      iw.close();
    };
  }, [location, map, marker]);

  return null;
};
```

### 2.5 Add Geolocation (My Location)

**Code**:
```typescript
// components/map/MyLocationButton.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Navigation } from 'lucide-react';

export interface MyLocationButtonProps {
  map: naver.maps.Map | null;
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

export const MyLocationButton: React.FC<MyLocationButtonProps> = ({
  map,
  onLocationFound,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMyLocation = () => {
    if (!map) return;

    if (!navigator.geolocation) {
      alert('위치 서비스를 사용할 수 없습니다.');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Center map on user location
        map.setCenter(new window.naver.maps.LatLng(latitude, longitude));
        map.setZoom(14);

        // Add user location marker
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(latitude, longitude),
          map,
          icon: {
            content: `
              <div class="relative">
                <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                <div class="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
              </div>
            `,
            size: new window.naver.maps.Size(16, 16),
            anchor: new window.naver.maps.Point(8, 8),
          },
        });

        onLocationFound?.({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('위치를 가져올 수 없습니다.');
        setIsLoading(false);
      }
    );
  };

  return (
    <Button
      variant="secondary"
      size="md"
      icon={<Navigation className="w-5 h-5" />}
      onClick={handleMyLocation}
      loading={isLoading}
      aria-label="My Location"
      className="absolute bottom-24 right-4 z-10 shadow-lg"
    >
      내 위치
    </Button>
  );
};
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ All tests pass

---

## 🔵 STEP 3: REFACTOR - Optimize & Error Handling (1.5 hours)

### 3.1 Add Map Controls Component

**Code**:
```typescript
// components/map/MapControls.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export interface MapControlsProps {
  map: naver.maps.Map | null;
  onFullscreen?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  map,
  onFullscreen,
}) => {
  const handleZoomIn = () => {
    if (!map) return;
    map.setZoom(map.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.setZoom(map.getZoom() - 1);
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={<ZoomIn className="w-4 h-4" />}
        onClick={handleZoomIn}
        aria-label="Zoom in"
      />
      <Button
        variant="secondary"
        size="sm"
        icon={<ZoomOut className="w-4 h-4" />}
        onClick={handleZoomOut}
        aria-label="Zoom out"
      />
      {onFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Maximize className="w-4 h-4" />}
          onClick={onFullscreen}
          aria-label="Fullscreen"
        />
      )}
    </div>
  );
};
```

### 3.2 Error Handling & Fallbacks

**Code**:
```typescript
// components/map/MapErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-8">
            <h3 className="text-lg font-semibold mb-2">
              지도를 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <Button onClick={this.handleReset}>다시 시도</Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 3.3 Performance Optimization

**Code**:
```typescript
// components/map/NaverMap.tsx (updated with optimization)
import { useMemo } from 'react';

export const NaverMap: React.FC<NaverMapProps> = ({
  locations,
  // ... other props
}) => {
  // Memoize filtered locations with coordinates
  const validLocations = useMemo(
    () => locations.filter((loc) => loc.mapX && loc.mapY),
    [locations]
  );

  // Debounce marker updates
  const [debouncedLocations, setDebouncedLocations] = useState(validLocations);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocations(validLocations);
    }, 300);

    return () => clearTimeout(timer);
  }, [validLocations]);

  // Rest of implementation...
};
```

### 3.4 Add TypeScript Declarations

**Code**:
```typescript
// types/naver-maps.d.ts
declare global {
  interface Window {
    naver: typeof naver;
  }
}

declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(center: LatLng): void;
      setZoom(zoom: number): void;
      getZoom(): number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class MarkerClustering {
      constructor(options: MarkerClusteringOptions);
    }

    // ... more types
  }
}

export {};
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ All tests still pass

---

## Success Criteria

- [x] Naver Maps SDK loaded dynamically
- [x] Map component renders with center and zoom
- [x] Custom markers for each content type
- [x] Marker clustering enabled (>50 markers)
- [x] Info windows display location info
- [x] Geolocation "My Location" feature
- [x] Map controls (zoom, fullscreen)
- [x] Error handling and fallbacks
- [x] TypeScript declarations
- [x] All tests passing ✅
- [x] Performance optimized (debouncing, memoization)
- [x] Test coverage >80%

---

## Update TODO.md

```markdown
#### Task I: Map Integration with Naver Maps (TDD) ⭐ CRITICAL
- [x] **RED (1h)**: Write failing tests ✅
- [x] **GREEN (3.5h)**: Implement Map integration ✅
- [x] **REFACTOR (1.5h)**: Optimize and polish ✅

**Status**: ✅ Completed
**Actual Time**: 6h
**Note**: Longest task on critical path completed successfully!
```

---

## Common Pitfalls

- ⚠️ **SDK Loading**: Always check if SDK is loaded before creating map
- ⚠️ **Memory Leaks**: Remove markers when component unmounts
- ⚠️ **API Key**: Never expose API key in client-side code
- ⚠️ **Coordinates**: Naver Maps uses (latitude, longitude) order
- ⚠️ **Mobile Performance**: Limit markers or use aggressive clustering on mobile

---

## Resources

- [Naver Maps Documentation](https://navermaps.github.io/maps.js/)
- [Naver Cloud Platform](https://www.ncloud.com/)
- Tech Spec Section 2.3.2: Map Integration Specifications

---

## Notes

**⭐ CRITICAL PATH - LONGEST TASK**
- This is the bottleneck task (6 hours)
- Any delay cascades to all subsequent tasks
- High priority - allocate best resources
- Complex integration - allow buffer time
- Test thoroughly - other features depend on this
