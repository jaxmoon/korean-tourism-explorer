'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/lib/hooks/useFavorites';
import type { Location } from '@/lib/models/location';

type FavoriteButtonProps = {
  location: Location;
};

function FavoriteButtonComponent({ location }: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  const triggerAnimation = useCallback(() => {
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }
    setIsAnimating(true);
    animationTimeout.current = setTimeout(() => {
      setIsAnimating(false);
      animationTimeout.current = null;
    }, 180);
  }, []);

  const currentFavorite = optimisticFavorite ?? isFavorite(location.contentId);

  const handleToggle = useCallback(() => {
    triggerAnimation();
    const nextFavoriteState = !currentFavorite;
    setOptimisticFavorite(nextFavoriteState);

    try {
      const success = nextFavoriteState
        ? addFavorite(location)
        : removeFavorite(location.contentId);

      if (!success) {
        throw new Error('Favorite mutation failed');
      }

      toast.success(nextFavoriteState ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      toast.error(nextFavoriteState ? 'Unable to add to favorites' : 'Unable to remove from favorites');
      setOptimisticFavorite(null);
      return;
    }

    setOptimisticFavorite(null);
  }, [addFavorite, currentFavorite, location, removeFavorite, triggerAnimation]);

  const ariaLabel = currentFavorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      aria-label={ariaLabel}
      aria-pressed={currentFavorite}
      title={ariaLabel}
      className={cn(
        'rounded-full px-2 transition-transform duration-150 active:scale-95',
        currentFavorite && 'text-rose-500',
        isAnimating && 'scale-110',
      )}
    >
      <Heart
        className="h-4 w-4"
        aria-hidden="true"
        fill={currentFavorite ? 'currentColor' : 'none'}
      />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  );
}

// Memoize to prevent unnecessary re-renders
export const FavoriteButton = memo(FavoriteButtonComponent, (prevProps, nextProps) => {
  return prevProps.location.contentId === nextProps.location.contentId;
});
