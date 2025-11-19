import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Location } from '@/lib/models/location';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useNaverMaps } from '@/lib/hooks/useNaverMaps';
import { MapInfoWindow } from './MapInfoWindow';
import { MyLocationButton } from './MyLocationButton';
import { MobileBottomSheet } from './MobileBottomSheet';
import { LocationDetail } from './LocationDetail';
import { MapErrorBoundary } from './MapErrorBoundary';
import { createMarkerIcon } from './marker-icons';
import type {
  NaverMapInstance,
  NaverMarkerClusteringInstance,
  NaverMarkerInstance,
} from './types';

export interface NaverMapProps {
  locations: Location[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (location: Location) => void;
  onNearbySearch?: (locations: Location[]) => void;
  onMapMove?: (center: { lat: number; lng: number }, radius: number) => void;
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
const DEFAULT_ZOOM = 16;

const isBrowser = () => typeof window !== 'undefined';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (isBrowser() ? window.innerWidth < 768 : false));

  useEffect(() => {
    if (!isBrowser()) return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

const MapContent: React.FC<NaverMapProps> = ({ locations, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, onMarkerClick, onNearbySearch, onMapMove, isLoading = false, className }) => {
  const { isLoaded, error, retry } = useNaverMaps();
  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [detailLocation, setDetailLocation] = useState<Location | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState('');
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [currentRadius, setCurrentRadius] = useState<number | null>(null);
  const [selectedContentTypes, setSelectedContentTypes] = useState<number[]>([]);
  const isInitialSearchDone = useRef(false);
  const lastSearchCenter = useRef<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const clusterRef = useRef<NaverMarkerClusteringInstance | null>(null);
  const markersRef = useRef<NaverMarkerInstance[]>([]);
  const markerListenersRef = useRef<Array<{ remove?: () => void }>>([]);

  const validLocations = useMemo(
    () => locations.filter((location) => typeof location.mapX === 'number' && typeof location.mapY === 'number'),
    [locations],
  );

  const filteredLocations = useMemo(() => {
    if (selectedContentTypes.length === 0) {
      return validLocations;
    }
    return validLocations.filter((location) => selectedContentTypes.includes(location.contentTypeId));
  }, [validLocations, selectedContentTypes]);

  const handleContentTypeToggle = useCallback((contentTypeId: number) => {
    setSelectedContentTypes((prev) => {
      if (prev.includes(contentTypeId)) {
        return prev.filter((id) => id !== contentTypeId);
      }
      return [...prev, contentTypeId];
    });
  }, []);

  const [debouncedLocations, setDebouncedLocations] = useState(filteredLocations);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedLocations(filteredLocations), 300);
    return () => window.clearTimeout(timeout);
  }, [filteredLocations]);

  const teardownMarkers = () => {
    markerListenersRef.current.forEach((listener) => listener.remove?.());
    markerListenersRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    return () => {
      teardownMarkers();
      clusterRef.current?.setMap(null);
      clusterRef.current = null;
    };
  }, []);

  // 두 좌표 간의 거리 계산 (하버사인 공식)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371000; // 지구 반지름 (미터)

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const calculateBoundsRadius = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps) return null;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return null;

    const ne = bounds.getNE();
    const sw = bounds.getSW();
    if (!ne || !sw) return null;

    const neLat = ne.lat();
    const neLng = ne.lng();
    const swLat = sw.lat();
    const swLng = sw.lng();

    // 값 검증
    if (isNaN(neLat) || isNaN(neLng) || isNaN(swLat) || isNaN(swLng)) {
      console.warn('[NaverMap] Invalid coordinates for radius calculation');
      return null;
    }

    // 하버사인 공식을 위한 헬퍼 함수
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371000; // 지구 반지름 (미터)

    // 실제 보이는 영역 계산 (검색창과 바텀시트 고려)
    // 모바일: 상단 검색창(~80px) + 하단 바텀시트(50vh) 제외
    // 데스크톱: 상단 검색창(~80px) 제외
    const latRange = neLat - swLat;
    const lngCenter = (neLng + swLng) / 2;

    if (isMobile) {
      // 모바일: 상단 ~5% (검색창) + 하단 50% (바텀시트) 가려짐
      // 실제 보이는 영역: 전체의 45% (5% ~ 50% 사이)
      // 보이는 영역의 중심: 전체의 27.5% 지점 = 5% + (45% / 2)
      // 위에서부터 계산하면: neLat - (latRange * 0.275)
      const visibleLatCenter = neLat - (latRange * 0.275);

      // 반경은 보이는 영역의 절반
      const visibleLatRange = latRange * 0.45;
      const dLat = toRad(visibleLatRange / 2);
      const dLng = toRad(neLng - lngCenter);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(visibleLatCenter)) * Math.cos(toRad(visibleLatCenter + visibleLatRange/2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const radius = Math.ceil(R * c);

      if (isNaN(radius) || radius <= 0) {
        console.warn('[NaverMap] Invalid radius calculated:', radius);
        return null;
      }

      return { center: { lat: visibleLatCenter, lng: lngCenter }, radius };
    }

    // 데스크톱: 상단 검색창만 고려 (~5% 높이)
    const visibleLatCenter = neLat - (latRange * 0.025);

    const dLat = toRad(neLat - visibleLatCenter);
    const dLng = toRad(neLng - lngCenter);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(visibleLatCenter)) * Math.cos(toRad(neLat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const radius = Math.ceil(R * c);

    if (isNaN(radius) || radius <= 0) {
      console.warn('[NaverMap] Invalid radius calculated:', radius);
      return null;
    }

    return { center: { lat: visibleLatCenter, lng: lngCenter }, radius };
  }, [isMobile]);

  const initializeMap = useCallback(() => {
    if (!isLoaded || !isBrowser() || !window.naver?.maps || !mapContainerRef.current) {
      return;
    }

    if (!mapRef.current) {
      const navermaps = window.naver.maps;
      mapRef.current = new navermaps.Map(mapContainerRef.current, {
        center: new navermaps.LatLng(center.lat, center.lng),
        zoom,
        disableDoubleClickZoom: false,
        scrollWheel: true,
        zoomControl: false,
        logoControl: false,
        scaleControl: false,
        mapDataControl: false,
      } as any);

      // 지도 이동/줌 이벤트 리스너 추가
      navermaps.Event.addListener(mapRef.current, 'idle', () => {
        console.log('[NaverMap] Map idle event triggered');
        const result = calculateBoundsRadius();
        if (!result) {
          console.log('[NaverMap] No result from calculateBoundsRadius');
          return;
        }

        console.log('[NaverMap] Bounds result:', result);
        setCurrentMapCenter(result.center);
        setCurrentRadius(result.radius);

        // idle 이벤트 발생 시 재검색 버튼 표시 여부 확인 (초기 검색 이후)
        if (isInitialSearchDone.current && lastSearchCenter.current) {
          // 마지막 검색 위치와의 거리 계산
          const distance = calculateDistance(
            lastSearchCenter.current.lat,
            lastSearchCenter.current.lng,
            result.center.lat,
            result.center.lng
          );

          console.log('[NaverMap] Distance from last search:', distance, 'm');

          // 200m 이상 이동했을 때만 재검색 버튼 표시
          if (distance >= 200) {
            console.log('[NaverMap] Showing refresh button (moved', distance, 'm)');
            setShowRefreshButton(true);
          }
        }
      });

      // 초기 검색 실행 (idle 이벤트를 기다리지 않고 직접 실행)
      if (!isInitialSearchDone.current && onMapMove) {
        console.log('[NaverMap] Executing initial search immediately after map init');
        setTimeout(() => {
          const result = calculateBoundsRadius();
          if (result) {
            console.log('[NaverMap] Initial search result:', result);
            isInitialSearchDone.current = true;
            lastSearchCenter.current = result.center; // 초기 검색 위치 저장
            setCurrentMapCenter(result.center);
            setCurrentRadius(result.radius);
            onMapMove(result.center, result.radius);
          }
        }, 500); // 지도가 완전히 로드될 시간을 줌
      }
    }
    // 지도가 이미 초기화된 경우 center/zoom을 변경하지 않음 (사용자가 이동한 위치 유지)
  }, [isLoaded, zoom, onMapMove, calculateBoundsRadius, calculateDistance]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const handleLocationFocus = useCallback(
    (location: Location) => {
      if (!window.naver?.maps || !mapRef.current || typeof location.mapX !== 'number' || typeof location.mapY !== 'number') {
        return;
      }
      const navermaps = window.naver.maps;
      const latLng = new navermaps.LatLng(location.mapY, location.mapX);
      mapRef.current.panTo(latLng);
      setSelectedLocation(location);
      onMarkerClick?.(location);
      setAnnouncement(`${location.title} selected`);
    },
    [onMarkerClick],
  );

  const handleMarkerClick = useCallback(
    (location: Location) => {
      // 마커 클릭 시 상세 정보 모달 표시
      setDetailLocation(location);
      setAnnouncement(`${location.title} selected`);
    },
    [],
  );

  const handleNearbySearch = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const params = new URLSearchParams({
          mapX: longitude.toString(),
          mapY: latitude.toString(),
          radius: '5000', // 5km radius
          numOfRows: '50',
        });

        const response = await fetch(`/api/tour/nearby?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch nearby locations');
        }

        const data = await response.json();
        if (data.success && data.data?.items) {
          onNearbySearch?.(data.data.items);
          setAnnouncement(`Found ${data.data.totalCount} places nearby`);
        }
      } catch (error) {
        console.error('Error fetching nearby locations:', error);
        setAnnouncement('Failed to load nearby places');
      }
    },
    [onNearbySearch],
  );

  const handleRefreshSearch = useCallback(() => {
    if (currentMapCenter && currentRadius && onMapMove) {
      lastSearchCenter.current = currentMapCenter; // 재검색 위치 저장
      onMapMove(currentMapCenter, currentRadius);
      setShowRefreshButton(false);
    }
  }, [currentMapCenter, currentRadius, onMapMove]);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    const navermaps = window.naver.maps;
    teardownMarkers();

    markersRef.current = debouncedLocations.map((location) => {
      const latLng = new navermaps.LatLng(location.mapY!, location.mapX!);
      const marker = new navermaps.Marker({
        position: latLng,
        map: mapRef.current,
        icon: createMarkerIcon(location.contentTypeId),
      });

      const listener = navermaps.Event.addListener(marker as any, 'click', () => handleMarkerClick(location));
      markerListenersRef.current.push(listener);
      return marker;
    });

    const threshold = isMobile ? 30 : 50;
    if (markersRef.current.length >= threshold && navermaps.MarkerClustering) {
      if (!clusterRef.current) {
        clusterRef.current = new navermaps.MarkerClustering({
          map: mapRef.current,
          markers: markersRef.current,
          minClusterSize: threshold,
          disableClickZoom: false,
          averageCenter: true,
        });
      } else {
        clusterRef.current.setMarkers(markersRef.current);
        clusterRef.current.setMap(mapRef.current);
      }
    } else if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }
  }, [debouncedLocations, handleMarkerClick, isMobile]);

  const toggleFavorite = (location: Location) => {
    setFavorites((prev) => ({ ...prev, [location.contentId]: !prev[location.contentId] }));
  };

  if (error) {
    return (
      <div className={cn('rounded-3xl border border-dashed border-gray-300 p-6', className)}>
        <p className="text-lg font-semibold text-gray-900">We could not load the interactive map.</p>
        <p className="mt-2 text-sm text-gray-600">
          You can still browse places below. Retry once you have a stable connection.
        </p>
        <Button variant="secondary" className="mt-4" onClick={retry}>
          Retry loading map
        </Button>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {validLocations.map((location) => (
            <article key={location.contentId} className="rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">{location.title}</h3>
              {location.addr1 && <p className="text-sm text-gray-600">{location.addr1}</p>}
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn('relative h-[420px] w-full overflow-hidden rounded-3xl bg-gray-100', className)}>
        {/* Map Skeleton */}
        <div className="absolute inset-0 animate-pulse">
          {/* Base map layer */}
          <div className="h-full w-full bg-gray-200" />

          {/* Simulated map markers */}
          <div className="absolute top-1/4 left-1/3 h-8 w-8 rounded-full bg-gray-300" />
          <div className="absolute top-1/3 right-1/4 h-8 w-8 rounded-full bg-gray-300" />
          <div className="absolute bottom-1/3 left-1/2 h-8 w-8 rounded-full bg-gray-300" />

          {/* Location button placeholder */}
          <div className="absolute right-4 bottom-4 h-12 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Loading text for screen readers */}
        <p className="sr-only" aria-live="polite">
          Loading map experience…
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full overflow-hidden rounded-3xl bg-gray-100', className)}>
      <div
        ref={mapContainerRef}
        data-testid="naver-map"
        className="h-full min-h-[420px] w-full"
        role="region"
        aria-label="Naver map display"
      />

      <MyLocationButton map={mapRef.current} className="absolute right-4 bottom-4" onLocationFound={handleNearbySearch} />

      <MapInfoWindow
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onViewDetails={handleLocationFocus}
        onFavoriteToggle={toggleFavorite}
        isFavorite={selectedLocation ? Boolean(favorites[selectedLocation.contentId]) : false}
      />

      <MobileBottomSheet
        locations={filteredLocations}
        activeLocationId={selectedLocation?.contentId}
        initialState="half"
        onLocationSelect={handleLocationFocus}
        onLocationDetail={setDetailLocation}
        isLoading={isLoading}
        showRefreshButton={showRefreshButton}
        onRefresh={handleRefreshSearch}
        selectedContentTypes={selectedContentTypes}
        onContentTypeToggle={handleContentTypeToggle}
      />

      <LocationDetail
        location={detailLocation}
        onClose={() => setDetailLocation(null)}
      />

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
};

const MemoizedMapContent = React.memo(MapContent);

export const NaverMap: React.FC<NaverMapProps> = (props) => (
  <MapErrorBoundary>
    <MemoizedMapContent {...props} />
  </MapErrorBoundary>
);
