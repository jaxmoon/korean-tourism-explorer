import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Location } from '@/lib/models/location';
import DetailPage, { generateMetadata } from '../page';

const mockNotFound = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}));

interface DetailLocation extends Location {
  images?: string[];
  related?: Location[];
  operatingHours?: string;
}

const createMockLocation = (overrides: Partial<DetailLocation> = {}): DetailLocation => ({
  contentId: overrides.contentId ?? '123',
  contentTypeId: overrides.contentTypeId ?? 12,
  title: overrides.title ?? 'Mock Location',
  overview: overrides.overview ?? 'Breathtaking skyline views from Seoul Tower.',
  address: overrides.address ?? '105 Namsangongwon-gil, Yongsan-gu, Seoul',
  tel: overrides.tel ?? '+82-2-1234-5678',
  images: overrides.images ?? [],
  related: overrides.related ?? [],
  operatingHours: overrides.operatingHours ?? 'Open daily 10:00 - 23:00',
  ...overrides,
});

const createFetchResponse = (data: any, ok = true, status = 200) =>
  ({
    ok,
    status,
    json: async () => data,
  }) as Response;

describe('Location Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/attractions/123');
  });

  afterEach(() => {
    delete (navigator as Navigator & { share?: any }).share;
    delete (navigator as Navigator & { clipboard?: any }).clipboard;
  });

  it('renders fetched location data with breadcrumb navigation', async () => {
    const location = createMockLocation();
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(createFetchResponse({ success: true, data: location }));

    const ui = await DetailPage({ params: { id: location.contentId } });
    render(ui);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/tour/detail/${location.contentId}?includeRelated=true`,
      expect.objectContaining({ next: { revalidate: 600 } })
    );

    expect(screen.getByRole('heading', { name: location.title })).toBeInTheDocument();
    expect(screen.getByText(location.address!)).toBeInTheDocument();
    expect(screen.getByText(location.overview!)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /attractions/i })).toHaveAttribute(
      'href',
      '/attractions'
    );
  });

  it('renders Swiper carousel and thumbnails when images exist', async () => {
    const location = createMockLocation({
      images: [
        'https://images.test/hero-1.jpg',
        'https://images.test/hero-2.jpg',
        'https://images.test/hero-3.jpg',
      ],
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    render(await DetailPage({ params: { id: location.contentId } }));

    expect(screen.getByTestId('image-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('image-carousel-thumbnails')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Mock Location image/i })).toHaveLength(3);
  });

  it('shows placeholder image when no gallery images available', async () => {
    const location = createMockLocation({ images: [] });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    render(await DetailPage({ params: { id: location.contentId } }));

    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
    expect(screen.getByText(/image unavailable/i)).toBeInTheDocument();
  });

  it('displays info sections with phone, address, and operating hours', async () => {
    const location = createMockLocation({
      tel: '+82-10-9876-5432',
      operatingHours: 'Weekdays 09:00 - 18:00',
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    render(await DetailPage({ params: { id: location.contentId } }));

    const telLink = screen.getByRole('link', { name: location.tel! });
    expect(telLink.getAttribute('href')).toContain('tel:+821098765432');
    expect(screen.getByText(location.address!)).toBeInTheDocument();
    expect(screen.getByText(location.operatingHours!)).toBeInTheDocument();
  });

  it('shares location via Web Share API when available', async () => {
    const location = createMockLocation();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(await DetailPage({ params: { id: location.contentId } }));

    const shareButton = await screen.findByRole('button', { name: /share location/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: location.title,
          text: expect.stringContaining(location.overview!),
          url: expect.stringContaining(`/attractions/${location.contentId}`),
        })
      );
    });
  });

  it('falls back to clipboard copy when Web Share API unavailable', async () => {
    const location = createMockLocation();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(await DetailPage({ params: { id: location.contentId } }));

    const shareButton = await screen.findByRole('button', { name: /share location/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining(`/attractions/${location.contentId}`)
      );
    });
  });

  it('renders related locations carousel linking to detail pages', async () => {
    const related = [
      createMockLocation({ contentId: '456', title: 'Bukchon Hanok Village' }),
      createMockLocation({ contentId: '789', title: 'Dongdaemun Design Plaza' }),
    ];

    const location = createMockLocation({ related });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    render(await DetailPage({ params: { id: location.contentId } }));

    const carousel = screen.getByTestId('similar-locations-carousel');
    expect(within(carousel).getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: related[0].title })).toHaveAttribute(
      'href',
      `/attractions/${related[0].contentId}`
    );
  });

  it('generates SEO metadata from fetched location data', async () => {
    const location = createMockLocation({
      images: ['https://images.test/seo-hero.jpg'],
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: true, data: location })
    );

    const metadata = await generateMetadata({ params: { id: location.contentId } });

    expect(metadata.title).toContain(location.title);
    expect(metadata.description).toContain(location.overview!);
    expect(metadata.openGraph?.images?.[0]?.url).toContain(location.images![0]);
    expect(metadata.openGraph?.url).toContain(`/attractions/${location.contentId}`);
  });

  it('calls notFound when API responds with error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      createFetchResponse({ success: false, error: 'Location not found' }, false, 404)
    );

    mockNotFound.mockImplementation(() => {
      throw new Error('NOT_FOUND');
    });

    await expect(DetailPage({ params: { id: 'missing' } })).rejects.toThrow('NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });
});
