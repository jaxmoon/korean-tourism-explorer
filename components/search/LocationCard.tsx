import React, { forwardRef } from 'react';

import type { Location } from '@/lib/models/location';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface LocationCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  location: Location;
  isHighlighted?: boolean;
  onSelect?: (location: Location) => void;
  onShowOnMap?: (location: Location) => void;
}

const getAddress = (location: Location): string => {
  return location.address ?? location.addr1 ?? location.addr2 ?? 'Address unavailable';
};

const getThumbnail = (location: Location): string | undefined => {
  return location.thumbnailUrl ?? location.firstImage ?? location.firstImage2 ?? undefined;
};

export const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  ({ location, isHighlighted = false, onSelect, onShowOnMap, className, ...props }, ref) => {
    const address = getAddress(location);
    const thumbnail = getThumbnail(location);

    const handleSelect = () => {
      onSelect?.(location);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        handleSelect();
      }
    };

    const handleShowOnMap: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      event.stopPropagation();
      onShowOnMap?.(location);
    };

    return (
      <article
        ref={ref}
        role="button"
        tabIndex={0}
        aria-current={isHighlighted ? 'true' : undefined}
        data-testid={`location-card-${location.contentId}`}
        data-highlighted={isHighlighted ? 'true' : undefined}
        className={cn(
          'group flex w-full cursor-pointer gap-4 rounded-2xl border p-4 transition-shadow',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          isHighlighted ? 'border-primary-400 bg-primary-50 shadow-lg' : 'border-gray-100 bg-white hover:shadow-md',
          className,
        )}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={location.title}
            className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
            No Image
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{location.title}</h3>
            <p className="mt-1 text-sm text-gray-600" aria-label="Address">
              {address}
            </p>
          </div>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={handleShowOnMap}>
              Show on Map
            </Button>
          </div>
        </div>
      </article>
    );
  },
);

LocationCard.displayName = 'LocationCard';
