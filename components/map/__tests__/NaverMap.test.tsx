import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { NaverMap } from '../NaverMap';
import type { Location } from '@/lib/models/location';
import { useNaverMaps } from '@/lib/hooks/useNaverMaps';

vi.mock('@/lib/hooks/useNaverMaps', () => ({
  useNaverMaps: vi.fn(),
}));

const mockedUseNaverMaps = vi.mocked(useNaverMaps);

const buildLocation = (overrides: Partial<Location> = {}): Location => ({
  contentId: overrides.contentId ?? crypto.randomUUID(),
  contentTypeId: overrides.contentTypeId ?? 12,
  title: overrides.title ?? 'Sample Location',
  address: overrides.address,
  addr1: overrides.addr1 ?? '123 Seoul Street',
  addr2: overrides.addr2,
  zipcode: overrides.zipcode,
  mapX: overrides.mapX ?? 126.978,
  mapY: overrides.mapY ?? 37.5665,
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
});

type MarkerListener = Record<string, ((...args: unknown[]) => void) | undefined>;

const setupNaverMapsMock = () => {
  const mapInstances: Array<{ container: HTMLElement; options: any; instance: any }> = [];
  const markers: Array<{ options: any; instance: any; listeners: MarkerListener }> = [];
  const clusterCalls: any[] = [];

  class MockLatLng {
    lat: number;
    lng: number;

    constructor(lat: number, lng: number) {
      this.lat = lat;
      this.lng = lng;
    }
  }

  class MockMap {
    container: HTMLElement;
    options: any;
    zoom: number;
    mapTypeId = 'NORMAL';
    panTo = vi.fn();
    setZoom = vi.fn((value: number) => {
      this.zoom = value;
    });
    getZoom = vi.fn(() => this.zoom);
    setCenter = vi.fn((center: any) => {
      this.options.center = center;
    });
    getMapTypeId = vi.fn(() => this.mapTypeId);
    setMapTypeId = vi.fn((type: string) => {
      this.mapTypeId = type;
    });
    getElement = vi.fn(() => this.container);

    constructor(container: HTMLElement, options: any) {
      this.container = container;
      this.options = options;
      this.zoom = options?.zoom ?? 10;
      mapInstances.push({ container, options, instance: this });
    }
  }

  class MockMarker {
    options: any;
    listeners: MarkerListener = {};
    setMap = vi.fn();
    setPosition = vi.fn((latLng: any) => {
      this.options.position = latLng;
    });
    getPosition = vi.fn(() => this.options.position);

    constructor(options: any) {
      this.options = options;
      markers.push({ options, instance: this, listeners: this.listeners });
    }
  }

  class MockMarkerClustering {
    options: any;

    constructor(options: any) {
      this.options = options;
      clusterCalls.push(options);
    }

    setMap() {}
    setMarkers() {}
    repaint() {}
  }

  const Event = {
    addListener: (target: { listeners?: MarkerListener }, eventName: string, handler: (...args: unknown[]) => void) => {
      if (!target.listeners) {
        target.listeners = {};
      }
      target.listeners[eventName] = handler;
      return {
        remove: () => {
          if (target.listeners) {
            delete target.listeners[eventName];
          }
        },
      };
    },
    trigger: (target: { listeners?: MarkerListener }, eventName: string, ...args: unknown[]) => {
      target.listeners?.[eventName]?.(...args);
    },
  };

  class MockInfoWindow {
    constructor(public options: any) {}
    open() {}
    close() {}
  }

  (window as any).naver = {
    maps: {
      Map: MockMap,
      Marker: MockMarker,
      LatLng: MockLatLng,
      MarkerClustering: MockMarkerClustering,
      Event,
      InfoWindow: MockInfoWindow,
      MapTypeId: {
        NORMAL: 'NORMAL',
        SATELLITE: 'SATELLITE',
      },
    },
  };

  return {
    mapInstances,
    markers,
    clusterCalls,
    triggerMarkerClick: (index: number) => {
      const marker = markers[index];
      if (!marker) return;
      marker.listeners?.click?.({ overlay: marker.instance });
    },
    cleanup: () => {
      delete (window as any).naver;
    },
  };
};

const createLocations = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    buildLocation({
      contentId: `location-${index}`,
      title: `Location ${index}`,
      mapX: 126.9 + index * 0.001,
      mapY: 37.5 + index * 0.001,
    }),
  );

describe('NaverMap component', () => {
  let naverMock: ReturnType<typeof setupNaverMapsMock>;
  const onMarkerClick = vi.fn();

  beforeEach(() => {
    mockedUseNaverMaps.mockReturnValue({ isLoaded: true, error: null });
    naverMock = setupNaverMapsMock();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    naverMock.cleanup();
  });

  const renderMap = (props: Partial<React.ComponentProps<typeof NaverMap>> = {}) =>
    render(
      <NaverMap
        locations={props.locations ?? createLocations(3)}
        center={props.center}
        zoom={props.zoom}
        onMarkerClick={props.onMarkerClick ?? onMarkerClick}
        className={props.className}
      />,
    );

  it('renders the map container', () => {
    renderMap();
    expect(screen.getByTestId('naver-map')).toBeInTheDocument();
  });

  it('initializes Naver Map instance with provided center and zoom', async () => {
    const customCenter = { lat: 35.1796, lng: 129.0756 };
    renderMap({ center: customCenter, zoom: 12 });

    await waitFor(() => expect(naverMock.mapInstances).toHaveLength(1));
    const mapOptions = naverMock.mapInstances[0]?.options;

    expect(mapOptions?.zoom).toBe(12);
    expect(mapOptions?.center).toBeInstanceOf((window as any).naver.maps.LatLng);
    expect(mapOptions?.center?.lat).toBeCloseTo(customCenter.lat);
    expect(mapOptions?.center?.lng).toBeCloseTo(customCenter.lng);
  });

  it('creates markers for each provided location', async () => {
    const locations = createLocations(5);
    renderMap({ locations });

    await waitFor(() => expect(naverMock.markers).toHaveLength(locations.length));
    const [first] = naverMock.markers;
    expect(first.options.position.lat).toBeCloseTo(locations[0].mapY!);
    expect(first.options.position.lng).toBeCloseTo(locations[0].mapX!);
  });

  it('enables marker clustering with desktop threshold when 50+ markers are present', async () => {
    const locations = createLocations(60);
    renderMap({ locations });

    await waitFor(() => expect(naverMock.clusterCalls.length).toBeGreaterThan(0));
    const clusterOptions = naverMock.clusterCalls[0];
    expect(clusterOptions.markers).toHaveLength(locations.length);
    expect(clusterOptions.minClusterSize).toBe(50);
  });

  it('uses mobile clustering threshold when viewport is narrow', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    const locations = createLocations(40);
    renderMap({ locations });

    await waitFor(() => expect(naverMock.clusterCalls.length).toBeGreaterThan(0));
    expect(naverMock.clusterCalls[0].minClusterSize).toBe(30);
  });

  it('opens info window and notifies when marker is clicked', async () => {
    const locations = createLocations(2);
    renderMap({ locations });

    await waitFor(() => expect(naverMock.markers).toHaveLength(locations.length));
    naverMock.triggerMarkerClick(0);

    await waitFor(() => expect(screen.getByTestId('map-info-window')).toBeInTheDocument());
    expect(screen.getByTestId('map-info-window')).toHaveTextContent(locations[0].title);
    expect(onMarkerClick).toHaveBeenCalledWith(locations[0]);
  });

  it('requests geolocation when the My Location button is pressed', async () => {
    const geolocationMock = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(window.navigator, 'geolocation', {
      value: geolocationMock,
      configurable: true,
    });

    renderMap();
    const button = await screen.findByRole('button', { name: /my location/i });
    fireEvent.click(button);

    expect(geolocationMock.getCurrentPosition).toHaveBeenCalled();

    Object.defineProperty(window.navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });
});
