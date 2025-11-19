import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';

import type { Location } from '@/lib/models/location';
import { MapListLayout } from '../MapListLayout';

vi.mock('@/components/map/NaverMap', () => {
  return {
    NaverMap: ({
      locations,
      onMarkerClick,
      center,
    }: {
      locations: Location[];
      onMarkerClick?: (location: Location) => void;
      center?: { lat: number; lng: number };
    }) => (
      <div data-testid="naver-map-mock">
        <span data-testid="map-center">{center ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'default'}</span>
        <div role="group" aria-label="Map markers">
          {locations.map((location) => (
            <button
              key={location.contentId}
              type="button"
              data-testid={`marker-${location.contentId}`}
              onClick={() => onMarkerClick?.(location)}
            >
              Marker {location.title}
            </button>
          ))}
        </div>
      </div>
    ),
  };
});

vi.mock('@/components/map/MobileBottomSheet', () => ({
  MobileBottomSheet: () => null,
}));

vi.mock('@/components/map/MapInfoWindow', () => ({
  MapInfoWindow: ({ location }: { location: Location | null }) =>
    location ? (
      <div role="dialog" aria-label="Map info window" data-testid="info-window">
        {location.title}
      </div>
    ) : null,
}));

const createLocation = (() => {
  let counter = 0;
  return (overrides: Partial<Location> = {}): Location => {
    counter += 1;
    return {
      contentId: overrides.contentId ?? `location-${counter}`,
      contentTypeId: overrides.contentTypeId ?? 12,
      title: overrides.title ?? `Location ${counter}`,
      addr1: overrides.addr1 ?? '123 Seoul Street',
      addr2: overrides.addr2,
      address: overrides.address,
      zipcode: overrides.zipcode,
      mapX: overrides.mapX ?? 126.978 + counter * 0.01,
      mapY: overrides.mapY ?? 37.5665 + counter * 0.01,
      thumbnailUrl: overrides.thumbnailUrl,
      firstImage: overrides.firstImage,
      firstImage2: overrides.firstImage2,
      areaCode: overrides.areaCode,
      sigunguCode: overrides.sigunguCode,
      cat1: overrides.cat1,
      cat2: overrides.cat2,
      cat3: overrides.cat3,
      tel: overrides.tel,
      homepage: overrides.homepage,
      overview: overrides.overview,
      createdtime: overrides.createdtime,
      modifiedtime: overrides.modifiedtime,
      booktour: overrides.booktour,
      mlevel: overrides.mlevel,
    };
  };
})();

const createLocations = (count = 3) => Array.from({ length: count }, (_, index) => createLocation({ contentId: `location-${index + 1}`, title: `Location ${index + 1}` }));

describe('MapListLayout - Map/List synchronization', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('scrolls to card and highlights it when marker is clicked', async () => {
    vi.useFakeTimers();
    const locations = createLocations(3);
    render(<MapListLayout locations={locations} />);

    const targetCard = screen.getByTestId(`location-card-${locations[1].contentId}`);
    const scrollSpy = vi.fn();
    targetCard.scrollIntoView = scrollSpy;

    fireEvent.click(screen.getByTestId(`marker-${locations[1].contentId}`));
    await vi.advanceTimersByTimeAsync(350);

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(targetCard).toHaveAttribute('data-highlighted', 'true');
  });

  it('centers map and highlights marker when a card is clicked', () => {
    const locations = createLocations(2);
    render(<MapListLayout locations={locations} />);

    const targetCard = screen.getByTestId(`location-card-${locations[0].contentId}`);
    fireEvent.click(targetCard);

    const mapCenter = screen.getByTestId('map-center');
    const expectedCenter = `${locations[0].mapY?.toFixed(4)},${locations[0].mapX?.toFixed(4)}`;
    expect(mapCenter).toHaveTextContent(expectedCenter);
    expect(targetCard).toHaveAttribute('data-highlighted', 'true');
  });

  it('Show on Map button recenters map and opens info window', () => {
    const locations = createLocations(2);
    render(<MapListLayout locations={locations} />);

    const card = screen.getByTestId(`location-card-${locations[1].contentId}`);
    const showOnMapButton = within(card).getByRole('button', { name: /show on map/i });
    fireEvent.click(showOnMapButton);

    const mapCenter = screen.getByTestId('map-center');
    const expectedCenter = `${locations[1].mapY?.toFixed(4)},${locations[1].mapX?.toFixed(4)}`;
    expect(mapCenter).toHaveTextContent(expectedCenter);
    expect(screen.getByTestId('info-window')).toHaveTextContent(locations[1].title);
  });

  it('maintains highlight state across interactions', () => {
    const locations = createLocations(3);
    render(<MapListLayout locations={locations} />);

    const firstCard = screen.getByTestId(`location-card-${locations[0].contentId}`);
    const secondCard = screen.getByTestId(`location-card-${locations[1].contentId}`);

    fireEvent.click(firstCard);
    expect(firstCard).toHaveAttribute('data-highlighted', 'true');

    fireEvent.click(screen.getByTestId(`marker-${locations[1].contentId}`));
    expect(secondCard).toHaveAttribute('data-highlighted', 'true');
    expect(firstCard).not.toHaveAttribute('data-highlighted', 'true');
  });

  it('scrolls with smooth animation semantics', async () => {
    vi.useFakeTimers();
    const locations = createLocations(4);
    render(<MapListLayout locations={locations} />);

    const farLocation = locations[locations.length - 1];
    const farCard = screen.getByTestId(`location-card-${farLocation.contentId}`);
    const scrollSpy = vi.fn();
    farCard.scrollIntoView = scrollSpy;

    fireEvent.click(screen.getByTestId(`marker-${farLocation.contentId}`));
    await vi.advanceTimersByTimeAsync(400);

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('toggles view modes between list, split, and map', () => {
    const locations = createLocations(2);
    render(<MapListLayout locations={locations} />);

    const listViewButton = screen.getByRole('button', { name: /list view/i });
    const splitViewButton = screen.getByRole('button', { name: /split view/i });
    const mapViewButton = screen.getByRole('button', { name: /map view/i });

    fireEvent.click(mapViewButton);
    expect(screen.getByTestId('naver-map-mock')).toBeVisible();
    expect(screen.queryByTestId('map-list-container')).not.toBeInTheDocument();

    fireEvent.click(listViewButton);
    expect(screen.getByTestId('map-list-container')).toBeVisible();

    fireEvent.click(splitViewButton);
    expect(screen.getByTestId('naver-map-mock')).toBeVisible();
    expect(screen.getByTestId('map-list-container')).toBeVisible();
  });

  it('persists view preference to localStorage', () => {
    const locations = createLocations(2);
    const storageKey = 'tourism_explorer_view_preference';

    const { unmount } = render(<MapListLayout locations={locations} storageKey={storageKey} />);
    const mapViewButton = screen.getByRole('button', { name: /map view/i });
    fireEvent.click(mapViewButton);

    expect(localStorage.getItem(storageKey)).toBe('"map"');

    unmount();

    render(<MapListLayout locations={locations} storageKey={storageKey} />);
    expect(screen.getByRole('button', { name: /map view/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
