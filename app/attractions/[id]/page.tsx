import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';

import { ImageCarousel } from '@/components/detail/ImageCarousel';
import { ShareButton } from '@/components/detail/ShareButton';
import { InfoSection } from '@/components/detail/InfoSection';
import { SimilarLocations } from '@/components/detail/SimilarLocations';
import type { Location } from '@/lib/models/location';
import { cn } from '@/lib/utils';

type LocationDetail = Location & {
  overview?: string;
  operatingHours?: string;
  homepage?: string;
  images?: string[];
  related?: Location[];
};

type PageProps = {
  params: { id: string };
};

export const revalidate = 600;

const buildAbsoluteUrl = (path: string) => {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
};

const getLocationDetail = cache(async (id: string): Promise<LocationDetail | null> => {
  const endpoint = buildAbsoluteUrl(`/api/tour/detail/${id}?includeRelated=true`);
  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data ?? null;
  } catch (error) {
    console.error('Failed to fetch location detail', error);
    return null;
  }
});

const stripHtml = (value?: string) => value?.replace(/<[^>]+>/g, '').trim() ?? '';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const location = await getLocationDetail(params.id);

  if (!location) {
    return {
      title: 'Location not found | Tourism Explorer',
      description: 'The requested location could not be found.',
    };
  }

  const description =
    stripHtml(location.overview)?.slice(0, 155) || `Discover ${location.title} on Tourism Explorer.`;
  const ogImage = location.images?.[0] || '/icons/marker-default.svg';
  const canonicalUrl = buildAbsoluteUrl(`/attractions/${location.contentId}`);

  return {
    title: `${location.title} | Tourism Explorer`,
    description,
    openGraph: {
      title: `${location.title} | Tourism Explorer`,
      description,
      url: canonicalUrl,
      images: [{ url: ogImage, alt: location.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${location.title} | Tourism Explorer`,
      description,
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl },
  };
}

export default async function AttractionDetailPage({ params }: PageProps) {
  const location = await getLocationDetail(params.id);

  if (!location) {
    notFound();
  }

  const address =
    location.address ||
    [location.addr1, location.addr2].filter(Boolean).join(' ') ||
    location.zipcode ||
    null;

  const infoSections = [
    {
      icon: <Phone className="h-5 w-5" aria-hidden="true" />,
      label: 'Phone',
      value: location.tel ? (
        <a
          href={`tel:${location.tel.replace(/[^\d+]/g, '')}`}
          className="text-primary-600 underline-offset-4 hover:underline"
        >
          {location.tel}
        </a>
      ) : null,
    },
    {
      icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
      label: 'Address',
      value: address,
    },
    {
      icon: <Clock className="h-5 w-5" aria-hidden="true" />,
      label: 'Operating hours',
      value: location.operatingHours,
    },
    {
      icon: <ExternalLink className="h-5 w-5" aria-hidden="true" />,
      label: 'Website',
      value: location.homepage ? (
        <a
          href={location.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 underline-offset-4 hover:underline"
        >
          Visit official site
        </a>
      ) : null,
    },
  ];

  return (
    <div className="bg-gradient-to-b from-white via-white to-gray-50">
      <a
        href="#location-overview"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-600"
      >
        Skip to main content
      </a>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="font-medium text-foreground transition hover:text-primary-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/attractions"
                className="font-medium text-foreground transition hover:text-primary-600"
              >
                Attractions
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-foreground">{location.title}</li>
          </ol>
        </nav>
      </div>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-4 sm:p-8">
            <ImageCarousel
              images={location.images ?? []}
              title={location.title}
              contentTypeId={location.contentTypeId}
            />

            <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                  Tourism Explorer
                </p>
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{location.title}</h1>

                {address && (
                  <p className="flex items-center gap-2 text-base text-muted-foreground">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    <span>{address}</span>
                  </p>
                )}
              </div>

              <ShareButton location={location} className="flex-shrink-0" />
            </div>
          </div>
        </div>
      </section>

      <main
        id="location-overview"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
          <div className="space-y-10">
            {location.overview && (
              <section aria-labelledby="overview-heading" className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 id="overview-heading" className="text-2xl font-semibold text-foreground">
                    Overview
                  </h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                  {stripHtml(location.overview)}
                </p>
              </section>
            )}

            {location.images && location.images.length > 1 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Gallery</h2>
                    <p className="text-sm text-muted-foreground">Tap any thumbnail to view in fullscreen.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {location.images.slice(0, 4).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className={cn(
                        'relative h-48 overflow-hidden rounded-2xl border border-gray-100',
                        index === 0 && 'sm:row-span-2 sm:h-full'
                      )}
                    >
                      <Image
                        src={image}
                        alt={`${location.title} gallery image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold text-foreground">Visitor information</h2>
            <div className="mt-4 space-y-4">
              {infoSections.map((section) => (
                <InfoSection
                  key={section.label}
                  icon={section.icon}
                  label={section.label}
                  value={section.value}
                />
              ))}
            </div>
          </aside>
        </div>

        <SimilarLocations locations={location.related} />
      </main>
    </div>
  );
}
