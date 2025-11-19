import React, { useEffect, useRef } from 'react';
import { Heart, X } from 'lucide-react';
import type { Location } from '@/lib/models/location';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface MapInfoWindowProps {
  location: Location | null;
  onClose?: () => void;
  onViewDetails?: (location: Location) => void;
  onFavoriteToggle?: (location: Location) => void;
  isFavorite?: boolean;
}

export const MapInfoWindow: React.FC<MapInfoWindowProps> = ({
  location,
  onClose,
  onViewDetails,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location) {
      containerRef.current?.focus();
    }
  }, [location]);

  if (!location) {
    return null;
  }

  const handleViewDetails = () => onViewDetails?.(location);
  const handleFavorite = () => onFavoriteToggle?.(location);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={`${location.title} details`}
      tabIndex={-1}
      data-testid="map-info-window"
      className={cn(
        'pointer-events-auto',
        'fixed inset-x-0 bottom-0 z-30 rounded-t-3xl bg-white p-4 shadow-xl md:absolute md:inset-auto md:bottom-auto md:left-1/2 md:top-6 md:w-[320px] md:-translate-x-1/2 md:rounded-3xl',
      )}
    >
      <div className="flex items-start gap-3">
        {location.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={location.thumbnailUrl}
            alt={location.title}
            className="h-20 w-20 rounded-2xl object-cover"
            loading="lazy"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{location.title}</h3>
          {location.addr1 && <p className="text-sm text-gray-600">{location.addr1}</p>}
          {location.cat2 && <p className="text-xs text-primary-600">{location.cat2}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close info window"
          className="h-8 w-8 rounded-full p-0 text-gray-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button type="button" size="sm" onClick={handleViewDetails} className="flex-1">
          View Details
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-pressed={isFavorite}
          onClick={handleFavorite}
        >
          <Heart className={cn('mr-2 h-4 w-4', isFavorite ? 'fill-current text-red-500' : 'text-gray-600')} />
          Favorite
        </Button>
      </div>
    </div>
  );
};
