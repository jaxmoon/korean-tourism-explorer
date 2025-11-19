import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NaverMapInstance } from './types';

interface MapControlsProps {
  map: NaverMapInstance | null;
  container?: HTMLElement | null;
  className?: string;
}

const CONTROL_BUTTON_CLASSES = 'h-11 w-11 rounded-full bg-white/95 text-gray-800 shadow focus-visible:ring-2 focus-visible:ring-primary-500';

export const MapControls: React.FC<MapControlsProps> = ({ map, container, className }) => {
  const [mapType, setMapType] = useState('NORMAL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!map) return;
    setMapType(map.getMapTypeId?.() ?? 'NORMAL');
  }, [map]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomChange = (delta: number) => {
    if (!map) return;
    const nextZoom = map.getZoom?.() + delta;
    if (typeof nextZoom === 'number') {
      map.setZoom?.(nextZoom);
    }
  };

  const handleMapTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value;
    setMapType(nextType);
    map?.setMapTypeId?.(nextType);
  };

  const toggleFullscreen = async () => {
    const target = container ?? map?.getElement?.();
    if (!target) return;

    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (fsError) {
      console.error('Failed to toggle fullscreen', fsError);
    }
  };

  const controlsDisabled = !map;

  return (
    <div className={cn(
      'pointer-events-auto space-y-3 rounded-2xl bg-white/80 p-3 shadow-lg backdrop-blur',
      className,
    )}>
      <div className="flex gap-2" role="group" aria-label="Zoom controls">
        <Button
          type="button"
          variant="secondary"
          className={CONTROL_BUTTON_CLASSES}
          onClick={() => handleZoomChange(1)}
          aria-label="Zoom in"
          disabled={controlsDisabled}
        >
          +
        </Button>
        <Button
          type="button"
          variant="secondary"
          className={CONTROL_BUTTON_CLASSES}
          onClick={() => handleZoomChange(-1)}
          aria-label="Zoom out"
          disabled={controlsDisabled}
        >
          -
        </Button>
      </div>

      <label className="flex flex-col text-xs font-semibold text-gray-700" htmlFor="map-type-select">
        Map type
        <select
          id="map-type-select"
          aria-label="Map type selector"
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          onChange={handleMapTypeChange}
          value={mapType}
          disabled={controlsDisabled}
        >
          <option value="NORMAL">Default</option>
          <option value="SATELLITE">Satellite</option>
        </select>
      </label>

      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-xl"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        disabled={!container && !map}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </Button>
    </div>
  );
};
