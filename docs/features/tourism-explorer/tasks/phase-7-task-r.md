# Task R: Performance Optimization ⭐ CRITICAL

**Phase**: 7 | **Time**: 3h | **Agent**: frontend-performance-specialist
**Dependencies**: Phase 6 complete | **On Critical Path**: ⭐ Yes
**EST**: 19h | **EFT**: 22h | **Slack**: 0h

## Objective
Optimize bundle size, Core Web Vitals, and implement lazy loading.

---

## Performance Audit (30min)

```bash
# Run Lighthouse
npm run build
npm start
npx lighthouse http://localhost:3000 --view

# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

**Target Metrics**:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- FCP < 1.5s
- Bundle size < 500KB (initial)

---

## Bundle Optimization (1h)

```typescript
// next.config.js
module.exports = {
  // Code splitting
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name: 'lib',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    };
    return config;
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Compression
  compress: true,

  // Remove unused CSS
  experimental: {
    optimizeCss: true,
  },
};
```

```typescript
// Dynamic imports for heavy components
// app/search/page.tsx
import dynamic from 'next/dynamic';

const NaverMap = dynamic(() => import('@/components/map/NaverMap'), {
  ssr: false,
  loading: () => <div>지도 로딩 중...</div>,
});

const ImageGallery = dynamic(() => import('@/components/detail/ImageGallery'), {
  loading: () => <div className="skeleton h-64" />,
});
```

---

## Core Web Vitals Optimization (1h)

```typescript
// Optimize LCP - Preload critical resources
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://openapi.map.naver.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/pretendard.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```typescript
// Optimize CLS - Reserve space for images
// components/search/LocationCard.tsx
export const LocationCard = ({ location }) => {
  return (
    <div className="card">
      <div className="relative aspect-video bg-gray-100">
        {location.thumbnailUrl && (
          <Image
            src={location.thumbnailUrl}
            alt={location.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
};
```

```typescript
// Optimize FID - Reduce JavaScript execution
// Use React.memo for expensive components
export const LocationCard = React.memo(({ location }) => {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.location.contentId === nextProps.location.contentId;
});
```

---

## Service Worker (30min)

```typescript
// public/service-worker.js
const CACHE_NAME = 'tourism-explorer-v1';
const URLS_TO_CACHE = [
  '/',
  '/search',
  '/favorites',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## Verify (30min)

```bash
# Run Lighthouse again
npx lighthouse http://localhost:3000 --view

# Check bundle size
npm run build
# Verify < 500KB initial bundle

# Run performance tests
npm run test:performance
```

## Success Criteria

- [x] Lighthouse Performance > 90
- [x] LCP < 2.5s ✅
- [x] FID < 100ms ✅
- [x] CLS < 0.1 ✅
- [x] Bundle size optimized
- [x] Lazy loading implemented
- [x] Service worker added
- [x] Critical path complete ⭐
