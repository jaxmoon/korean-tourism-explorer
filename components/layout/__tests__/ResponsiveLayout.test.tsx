import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { ResponsiveLayout } from '../ResponsiveLayout';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockUsePathname.mockReturnValue('/');
});

const evaluateQueryMatch = (query: string, width: number) => {
  const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
  const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);

  let matches = true;

  if (minMatch) {
    matches = matches && width >= Number(minMatch[1]);
  }

  if (maxMatch) {
    matches = matches && width <= Number(maxMatch[1]);
  }

  return matches;
};

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: evaluateQueryMatch(query, width),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ResponsiveLayout', () => {
  it('shows bottom nav on mobile viewports and hides top nav', () => {
    setViewportWidth(375);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('top-nav')).not.toBeInTheDocument();
  });

  it('shows top nav on desktop viewports and hides bottom nav', () => {
    setViewportWidth(1024);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('shows top nav on tablet viewports (>=768px)', () => {
    setViewportWidth(768);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('renders navigation items with correct labels and routes', () => {
    setViewportWidth(375);

    const { unmount } = render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    const bottomNav = screen.getByTestId('bottom-nav');
    const bottomLinks = within(bottomNav).getAllByRole('link');

    expect(bottomLinks).toHaveLength(4);
    expect(bottomLinks.map((link) => link.textContent?.trim())).toEqual(['홈', '검색', '즐겨찾기', '더보기']);
    expect(bottomLinks[0]).toHaveAttribute('href', '/');
    expect(bottomLinks[1]).toHaveAttribute('href', '/search');
    expect(bottomLinks[2]).toHaveAttribute('href', '/favorites');
    expect(bottomLinks[3]).toHaveAttribute('href', '/more');

    unmount();
    setViewportWidth(1024);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    const topNav = screen.getByTestId('top-nav');
    expect(within(topNav).getByRole('link', { name: 'Tourism Explorer' })).toHaveAttribute('href', '/');
    expect(within(topNav).getByRole('link', { name: '검색' })).toHaveAttribute('href', '/search');
    expect(within(topNav).getByRole('link', { name: '즐겨찾기' })).toHaveAttribute('href', '/favorites');
  });

  it('highlights the active route for both navigations', () => {
    mockUsePathname.mockReturnValue('/search');
    setViewportWidth(375);

    const { unmount } = render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    const searchLinkMobile = screen.getByRole('link', { name: '검색' });
    expect(searchLinkMobile).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');

    unmount();
    mockUsePathname.mockReturnValue('/favorites');
    setViewportWidth(1024);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    const favoritesLinkDesktop = screen.getByRole('link', { name: '즐겨찾기' });
    expect(favoritesLinkDesktop).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '검색' })).not.toHaveAttribute('aria-current');
  });

  it('provides data-testid attributes for both navigations', () => {
    setViewportWidth(1024);

    const { unmount } = render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();

    unmount();
    setViewportWidth(375);

    render(
      <ResponsiveLayout>
        <div>content</div>
      </ResponsiveLayout>
    );

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });
});
