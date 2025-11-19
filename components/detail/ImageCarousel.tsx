'use client';

import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getPlaceholderImage } from '@/lib/constants/placeholders';
import { ImageLightbox } from './ImageLightbox';

type ImageCarouselProps = {
  images?: string[];
  title: string;
  contentTypeId?: number;
};

type NormalizedImage = {
  id: string;
  src: string;
  alt: string;
};

export function ImageCarousel({ images = [], title, contentTypeId }: ImageCarouselProps) {
  const normalizedImages = useMemo<NormalizedImage[]>(
    () =>
      images
        .filter(Boolean)
        .map((src, index) => ({
          id: `${src}-${index}`,
          src,
          alt: `${title} image ${index + 1}`,
        })),
    [images, title]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const showPlaceholder = normalizedImages.length === 0;

  const goToIndex = useCallback(
    (index: number) => {
      if (showPlaceholder) return;
      const total = normalizedImages.length;
      const nextIndex = (index + total) % total;
      setActiveIndex(nextIndex);
    },
    [normalizedImages.length, showPlaceholder]
  );

  const handlePointerDown = (clientX: number) => {
    touchStartX.current = clientX;
    touchDelta.current = 0;
  };

  const handlePointerMove = (clientX: number) => {
    if (touchStartX.current === null) return;
    touchDelta.current = clientX - touchStartX.current;
  };

  const handlePointerUp = () => {
    if (touchStartX.current === null) return;

    if (Math.abs(touchDelta.current) > 50) {
      if (touchDelta.current > 0) {
        goToIndex(activeIndex - 1);
      } else {
        goToIndex(activeIndex + 1);
      }
    }

    touchStartX.current = null;
    touchDelta.current = 0;
  };

  const placeholder = getPlaceholderImage(contentTypeId);

  return (
    <>
      <div
        className="relative overflow-hidden rounded-3xl bg-black"
        data-testid="image-carousel"
        onTouchStart={(event) => handlePointerDown(event.touches[0].clientX)}
        onTouchMove={(event) => handlePointerMove(event.touches[0].clientX)}
        onTouchEnd={handlePointerUp}
        onMouseDown={(event) => handlePointerDown(event.clientX)}
        onMouseMove={(event) => handlePointerMove(event.clientX)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        role="region"
        aria-label="Location photos"
      >
        {showPlaceholder ? (
          <div
            className={cn(
              'flex h-[360px] flex-col items-center justify-center gap-4 bg-gradient-to-br text-white sm:h-[480px]',
              placeholder.gradient
            )}
            data-testid="image-placeholder"
          >
            <placeholder.icon className="h-12 w-12" aria-hidden="true" />
            <div className="text-center">
              <p className="text-xl font-semibold">{placeholder.title}</p>
              <p className="text-sm text-white/80">Image unavailable</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative h-[360px] sm:h-[520px]">
              {normalizedImages.map((image, index) => (
                <Image
                  key={image.id}
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 70vw"
                  priority={index === 0}
                  className={cn(
                    'object-cover transition-opacity duration-300',
                    index === activeIndex ? 'opacity-100' : 'opacity-0'
                  )}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                aria-label="View photos in lightbox"
                className="pointer-events-auto rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => setLightboxOpen(true)}
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              aria-label="View previous photo"
              className="pointer-events-auto absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:block"
              onClick={() => goToIndex(activeIndex - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="View next photo"
              className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:block"
              onClick={() => goToIndex(activeIndex + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {!showPlaceholder && (
        <div className="mt-4" data-testid="image-carousel-thumbnails">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {normalizedImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={cn(
                  'relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-transparent transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                  index === activeIndex && 'border-primary-500'
                )}
                onClick={() => goToIndex(index)}
                aria-label={`Show image ${index + 1}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="160px"
                  className="object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <ImageLightbox
        images={normalizedImages.map((image) => image.src)}
        initialIndex={activeIndex}
        isOpen={isLightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
