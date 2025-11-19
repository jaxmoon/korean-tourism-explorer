'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

import type { Location } from '@/lib/models/location';
import { Card, CardContent } from '@/components/ui/Card';

type SimilarLocationsProps = {
  locations?: Location[];
};

const FALLBACK_IMAGE = '/icons/marker-default.svg';

export function SimilarLocations({ locations = [] }: SimilarLocationsProps) {
  const entries = useMemo(() => locations.slice(0, 6), [locations]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  if (entries.length === 0) return null;

  return (
    <section aria-label="Similar locations" className="mt-12 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            You might also like
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Similar Locations</h2>
        </div>

        <div className="hidden gap-3 md:flex">
          <button
            type="button"
            aria-label="Scroll similar locations left"
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll similar locations right"
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4"
          data-testid="similar-locations-carousel"
        >
          {entries.map((location) => {
            const hero =
              location.thumbnailUrl || location.firstImage || location.firstImage2 || FALLBACK_IMAGE;

            return (
              <Card
                key={location.contentId}
                className="w-64 flex-shrink-0 overflow-hidden rounded-2xl border-0 shadow-lg transition hover:shadow-xl"
              >
                <Link
                  href={`/attractions/${location.contentId}`}
                  className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={hero}
                      alt={location.title}
                      fill
                      sizes="256px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-foreground">{location.title}</p>
                      {location.addr1 && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {location.addr1}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary-600">View details →</span>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-white to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-white to-transparent md:block" />
      </div>
    </section>
  );
}
