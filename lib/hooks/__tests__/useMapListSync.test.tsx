import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { Location } from '@/lib/models/location';
import { useMapListSync } from '../useMapListSync';

const createLocation = (() => {
  let counter = 0;
  return (overrides: Partial<Location> = {}): Location => {
    counter += 1;
    return {
      contentId: overrides.contentId ?? `location-${counter}`,
      contentTypeId: overrides.contentTypeId ?? 12,
      title: overrides.title ?? `Location ${counter}`,
      addr1: overrides.addr1,
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

const createLocations = (count = 3) => Array.from({ length: count }, () => createLocation());

describe('useMapListSync', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('manages selectedLocationId state', () => {
    const locations = createLocations(2);
    const { result } = renderHook(() => useMapListSync({ locations }));

    expect(result.current.selectedLocationId).toBeNull();

    act(() => {
      result.current.onCardClick(locations[0]);
    });

    expect(result.current.selectedLocationId).toBe(locations[0].contentId);
  });

  it('manages highlightedCardId state', () => {
    const locations = createLocations(2);
    const { result } = renderHook(() => useMapListSync({ locations }));

    act(() => {
      result.current.onMarkerClick(locations[1]);
    });

    expect(result.current.highlightedCardId).toBe(locations[1].contentId);
  });

  it('scrolls to the appropriate card when a marker is clicked', async () => {
    vi.useFakeTimers();
    const locations = createLocations(1);
    const location = locations[0];
    const { result } = renderHook(() => useMapListSync({ locations }));

    const cardElement = document.createElement('div');
    const scrollSpy = vi.fn();
    (cardElement as HTMLElement & { scrollIntoView: typeof scrollSpy }).scrollIntoView = scrollSpy;

    act(() => {
      result.current.registerCardRef(location.contentId, cardElement);
      result.current.onMarkerClick(location);
    });

    await vi.advanceTimersByTimeAsync(350);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('centers the map when a card is clicked', () => {
    const locations = createLocations(1);
    const location = locations[0];
    const { result } = renderHook(() => useMapListSync({ locations }));

    act(() => {
      result.current.onCardClick(location);
    });

    expect(result.current.mapCenter).toEqual({
      lat: location.mapY,
      lng: location.mapX,
    });
  });

  it('scrollToCard scrolls the stored element into view', () => {
    const locations = createLocations(1);
    const location = locations[0];
    const { result } = renderHook(() => useMapListSync({ locations }));

    const cardElement = document.createElement('div');
    const scrollSpy = vi.fn();
    (cardElement as HTMLElement & { scrollIntoView: typeof scrollSpy }).scrollIntoView = scrollSpy;

    act(() => {
      result.current.registerCardRef(location.contentId, cardElement);
      result.current.scrollToCard(location.contentId);
    });

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('centerOnMarker updates the map center when coordinates exist', () => {
    const locations = createLocations(1);
    const location = locations[0];
    const { result } = renderHook(() => useMapListSync({ locations }));

    act(() => {
      result.current.centerOnMarker(location);
    });

    expect(result.current.mapCenter).toEqual({
      lat: location.mapY,
      lng: location.mapX,
    });
  });

  it('debounces rapid marker clicks', async () => {
    vi.useFakeTimers();
    const first = createLocation({ contentId: 'first' });
    const second = createLocation({ contentId: 'second' });
    const { result } = renderHook(() => useMapListSync({ locations: [first, second], debounceMs: 300 }));

    const firstCard = document.createElement('div');
    const secondCard = document.createElement('div');
    const firstScroll = vi.fn();
    const secondScroll = vi.fn();
    firstCard.scrollIntoView = firstScroll;
    secondCard.scrollIntoView = secondScroll;

    act(() => {
      result.current.registerCardRef(first.contentId, firstCard);
      result.current.registerCardRef(second.contentId, secondCard);
      result.current.onMarkerClick(first);
      result.current.onMarkerClick(second);
    });

    await vi.advanceTimersByTimeAsync(200);
    expect(firstScroll).not.toHaveBeenCalled();
    expect(secondScroll).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(firstScroll).not.toHaveBeenCalled();
    expect(secondScroll).toHaveBeenCalledTimes(1);
    expect(result.current.highlightedCardId).toBe(second.contentId);
  });
});
