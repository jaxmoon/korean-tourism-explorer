# Task N: Responsive Layout (TDD) ⭐ CRITICAL

**Phase**: 5 | **Time**: 2h | **Agent**: frontend-ui-specialist
**Dependencies**: Task H, J, K | **On Critical Path**: ⭐ Yes
**EST**: 15h | **EFT**: 17h | **Slack**: 0h

## Objective
Implement fully responsive layouts for mobile, tablet, and desktop.

---

## 🔴 RED (30min)

```typescript
// components/layout/__tests__/ResponsiveLayout.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveLayout } from '../ResponsiveLayout';

describe('Responsive Layout', () => {
  it('should fail: show bottom nav on mobile', () => {
    // Mock mobile viewport
    global.innerWidth = 375;
    render(<ResponsiveLayout />);

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('top-nav')).not.toBeInTheDocument();
  });

  it('should fail: show top nav on desktop', () => {
    global.innerWidth = 1024;
    render(<ResponsiveLayout />);

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('should fail: adjust grid columns by breakpoint', () => {
    const { rerender } = render(<ResultsGrid />);

    // Mobile: 1 column
    global.innerWidth = 375;
    expect(screen.getByTestId('grid')).toHaveClass('grid-cols-1');

    // Tablet: 2 columns
    global.innerWidth = 768;
    rerender(<ResultsGrid />);
    expect(screen.getByTestId('grid')).toHaveClass('md:grid-cols-2');

    // Desktop: 3 columns
    global.innerWidth = 1024;
    rerender(<ResultsGrid />);
    expect(screen.getByTestId('grid')).toHaveClass('lg:grid-cols-3');
  });
});
```

---

## 🟢 GREEN (1h)

```typescript
// components/layout/ResponsiveLayout.tsx
'use client';

import React from 'react';
import { TopNavigation } from './TopNavigation';
import { BottomNavigation } from './BottomNavigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const ResponsiveLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation (Tablet & Desktop) */}
      {!isMobile && (
        <TopNavigation data-testid="top-nav" />
      )}

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      {isMobile && (
        <BottomNavigation data-testid="bottom-nav" />
      )}
    </div>
  );
};
```

```typescript
// hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

```typescript
// components/layout/BottomNavigation.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Heart, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: '홈', href: '/' },
    { icon: Search, label: '검색', href: '/search' },
    { icon: Heart, label: '즐겨찾기', href: '/favorites' },
    { icon: Menu, label: '더보기', href: '/more' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
```

---

## 🔵 REFACTOR (30min)

```typescript
// components/layout/TopNavigation.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Container } from '@/components/layout/Container';

export const TopNavigation: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary-600">
            Tourism Explorer
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-gray-700 hover:text-primary-600">
              검색
            </Link>
            <Link href="/favorites" className="text-gray-700 hover:text-primary-600">
              즐겨찾기
            </Link>
          </nav>

          {/* Search Icon */}
          <Link href="/search" className="md:hidden">
            <Search className="w-6 h-6" />
          </Link>
        </div>
      </Container>
    </header>
  );
};
```

```typescript
// Add responsive breakpoints to Tailwind
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
};
```

## Success Criteria

- [x] Mobile bottom navigation (< 768px)
- [x] Tablet/desktop top navigation (≥ 768px)
- [x] Responsive grid (1/2/3 columns)
- [x] Touch-optimized controls (mobile)
- [x] useMediaQuery hook
- [x] All breakpoints tested
- [x] Tests passing ✅
- [x] Critical path complete ⭐
