import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NaverMapInstance, NaverMarkerInstance } from './types';

interface MyLocationButtonProps {
  map: NaverMapInstance | null;
  className?: string;
  onLocationFound?: (latitude: number, longitude: number) => void;
}

const USER_MARKER_ICON = {
  content:
    '<div class="relative flex items-center justify-center"><span style="width:18px;height:18px;border-radius:9999px;background:#2563eb;display:inline-block;border:3px solid rgba(37,99,235,0.35);"></span></div>',
  anchor: { x: 9, y: 9 },
};

export const MyLocationButton: React.FC<MyLocationButtonProps> = ({ map, className, onLocationFound }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<NaverMarkerInstance | null>(null);

  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, []);

  const handleSuccess = (position: GeolocationPosition) => {
    if (!window.naver?.maps || !map) {
      setError('Map is not ready yet.');
      setIsLocating(false);
      return;
    }

    const { latitude, longitude } = position.coords;
    const latLng = new window.naver.maps.LatLng(latitude, longitude);
    map.panTo(latLng);

    if (!markerRef.current) {
      markerRef.current = new window.naver.maps.Marker({
        position: latLng,
        map,
        icon: USER_MARKER_ICON,
      });
    } else {
      markerRef.current.setPosition(latLng);
      markerRef.current.setMap(map);
    }

    setIsLocating(false);
    setError(null);

    // Notify parent component of the location
    onLocationFound?.(latitude, longitude);
  };

  const handleError = (geolocationError: GeolocationPositionError) => {
    setIsLocating(false);
    setError(geolocationError.message || 'Unable to fetch your location.');
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  };

  return (
    <div className={cn('pointer-events-auto text-right', className)}>
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="min-h-11 min-w-[140px] rounded-2xl bg-white/95 text-sm font-semibold text-gray-800 shadow"
        onClick={requestLocation}
        loading={isLocating}
        aria-label="My Location"
      >
        My Location
      </Button>
      <p className="mt-2 text-xs text-red-600" aria-live="assertive">
        {error}
      </p>
    </div>
  );
};
