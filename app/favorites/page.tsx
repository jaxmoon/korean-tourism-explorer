'use client';

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { Download, Upload } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useFavorites } from '@/lib/hooks/useFavorites';
import type { Location } from '@/lib/models/location';
import { cn } from '@/lib/utils';

const CATEGORY_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Tourist Spots', value: '12' },
  { label: 'Cultural', value: '14' },
  { label: 'Festivals', value: '15' },
  { label: 'Travel Courses', value: '25' },
  { label: 'Leisure Sports', value: '28' },
  { label: 'Accommodation', value: '32' },
  { label: 'Shopping', value: '38' },
  { label: 'Food', value: '39' },
] as const;

type CategoryValue = (typeof CATEGORY_TABS)[number]['value'];

const CATEGORY_LABELS = CATEGORY_TABS.reduce<Record<string, string>>((acc, tab) => {
  if (tab.value !== 'all') {
    acc[tab.value] = tab.label;
  }
  return acc;
}, {});

const getLocationImage = (location: Location) =>
  location.thumbnailUrl ?? location.firstImage ?? location.firstImage2 ?? null;

const getLocationAddress = (location: Location) =>
  location.address ?? location.addr1 ?? location.addr2 ?? 'Address unavailable';

const truncate = (value: string, limit = 140) =>
  value.length > limit ? `${value.slice(0, limit)}…` : value;

const formatDateStamp = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const FavoritesCardComponent = ({ location }: { location: Location }) => {
  const imageSrc = getLocationImage(location);
  const address = getLocationAddress(location);
  const categoryLabel = CATEGORY_LABELS[String(location.contentTypeId)] ?? 'Favorite';
  const overview = location.overview ? truncate(location.overview, 160) : null;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative h-48 w-full">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={location.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-white text-sm text-gray-500">
            Image coming soon
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur">
          <FavoriteButton location={location} />
        </div>
      </div>

      <CardHeader className="border-0 pb-0">
        <div className="flex flex-col gap-2">
          <Badge variant="info" size="sm">
            {categoryLabel}
          </Badge>
          <h3 className="text-lg font-semibold text-gray-900">{location.title}</h3>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 text-sm text-gray-600">
        <div className="space-y-2">
          <p className="font-medium text-gray-800">{address}</p>
          {overview && <p className="text-gray-600">{overview}</p>}
        </div>
        <div className="text-xs text-gray-500">
          Content ID: <span className="font-mono">{location.contentId}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize FavoritesCard to prevent unnecessary re-renders
const FavoritesCard = memo(FavoritesCardComponent, (prevProps, nextProps) => {
  return prevProps.location.contentId === nextProps.location.contentId;
});

export default function FavoritesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>('all');
  const { favorites, count, exportFavorites, importFavorites } = useFavorites();

  const categoryCounts = useMemo(
    () =>
      favorites.reduce<Record<string, number>>((acc, favorite) => {
        const key = String(favorite.contentTypeId);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [favorites],
  );

  const filteredFavorites = useMemo(
    () =>
      selectedCategory === 'all'
        ? favorites
        : favorites.filter((favorite) => String(favorite.contentTypeId) === selectedCategory),
    [favorites, selectedCategory],
  );

  const handleExport = useCallback(() => {
    if (count === 0) {
      toast.error('No favorites to export yet');
      return;
    }

    try {
      const payload = exportFavorites();
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const filename = `favorites_${formatDateStamp(new Date())}.json`;
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Favorites exported');
    } catch (error) {
      console.error(error);
      toast.error('Unable to export favorites');
    }
  }, [count, exportFavorites]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = '';

      if (!file) {
        return;
      }

      try {
        const payload = await file.text();
        const success = importFavorites(payload, 'keep');
        if (success) {
          toast.success('Favorites imported');
        } else {
          toast.error('No new favorites were added');
        }
      } catch (error) {
        console.error(error);
        toast.error('Unable to import favorites');
      }
    },
    [importFavorites],
  );

  const tabPanelId = 'favorites-grid-panel';

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <Toaster position="top-right" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">My Favorites ({count})</h1>
            <p className="mt-2 text-base text-gray-600">
              Keep track of places you love and import or export your list any time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Upload className="h-4 w-4" aria-hidden="true" />}
              onClick={handleImportClick}
            >
              Import
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={handleExport}
              disabled={count === 0}
            >
              Export
            </Button>
          </div>
        </header>

        <section
          role="tablist"
          aria-label="Favorite categories"
          className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.value;
            const tabCount = tab.value === 'all' ? count : categoryCounts[tab.value] ?? 0;
            const tabId = `favorites-tab-${tab.value}`;

            return (
              <button
                key={tab.value}
                type="button"
                id={tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={tabPanelId}
                onClick={() => setSelectedCategory(tab.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  isActive
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900',
                )}
              >
                {tab.label}
                <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-gray-700">
                  {tabCount}
                </span>
              </button>
            );
          })}
        </section>

        <section
          id={tabPanelId}
          role="tabpanel"
          aria-live="polite"
          aria-labelledby={`favorites-tab-${selectedCategory}`}
          className="space-y-6"
        >
          {filteredFavorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">No favorites yet</p>
              <p className="mt-2 text-sm text-gray-500">
                Start exploring and tap the heart icon to add places to your favorites.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredFavorites.map((location) => (
                <FavoritesCard key={location.contentId} location={location} />
              ))}
            </div>
          )}
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleImport}
      />
    </main>
  );
}
