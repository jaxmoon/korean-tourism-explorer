# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tourism Explorer is a Next.js 14 web application that helps users discover Korean tourist attractions using the Korea Tourism Organization's TourAPI and Naver Maps. The app features interactive maps, search functionality, detailed location pages, and favorites management with a focus on mobile-first responsive design and performance optimization.

## Development Commands

```bash
# Development
npm run dev                    # Start development server (localhost:3000)
npm run build                  # Production build (ALWAYS run after code changes)
npm run build:analyze          # Build with bundle analysis
npm start                      # Start production server

# Testing
npm test                       # Run unit tests with Vitest
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate test coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests with UI
npm run test:e2e:headed        # Run E2E tests in headed mode
npm run test:e2e:report        # Show E2E test report
npm run test:all               # Run all tests (unit + e2e)

# Code Quality
npm run lint                   # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
TOURAPI_KEY=your_key                              # From api.visitkorea.or.kr
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id   # From console.ncloud.com

# Optional
TOURAPI_BASE_URL=https://apis.data.go.kr/B551011/KorService2
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
ALLOWED_ORIGIN=https://yourapp.vercel.app
CACHE_TTL=300
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design tokens
- **Maps**: Naver Maps API with custom markers and clustering
- **API**: Korea Tourism Organization TourAPI 4.0
- **Testing**: Vitest (unit), React Testing Library, Playwright (E2E)
- **HTTP Client**: Custom vendored Axios (in `vendor/axios/`)
- **Validation**: Zod for runtime type safety

### Directory Structure

```
/app/                         # Next.js App Router pages and API routes
  /api/                       # Backend API routes (proxy to TourAPI)
    /tour/                    # Tour API endpoints
      /search/route.ts        # Keyword search endpoint
      /detail/[id]/route.ts   # Location detail endpoint
      /nearby/route.ts        # GPS-based nearby search
    middleware.ts             # Rate limiting and security middleware
  /attractions/[id]/          # Dynamic location detail pages
  /favorites/                 # Favorites management page
  /map/                       # Map-focused view
  page.tsx                    # Home page
  layout.tsx                  # Root layout with global config

/components/                  # React components (organized by feature)
  /map/                       # Map components (NaverMap, markers, info windows)
  /search/                    # Search UI (SearchBar, filters, pagination)
  /detail/                    # Detail page components (images, info sections)
  /favorites/                 # Favorites management components
  /layout/                    # Layout components (navigation, responsive containers)
  /sync/                      # Map-list synchronization components
  /ui/                        # Reusable UI primitives (Button, Card, Input, Badge)

/lib/                         # Core utilities and business logic
  /models/                    # TypeScript types and Zod schemas
    location.ts               # Location type definitions
    search-params.ts          # Search parameter schemas
    api-response.ts           # API response types
    helpers.ts                # Type transformers (API → internal)
  /services/                  # External service integrations
    tour-api.ts               # TourApiService class (singleton)
    errors.ts                 # Custom error classes
    logger.ts                 # Logging utilities
  /hooks/                     # Custom React hooks
    useNaverMaps.ts           # Naver Maps SDK loader hook
    useFavorites.ts           # LocalStorage favorites management
    useMapListSync.ts         # Map-list state synchronization
  /cache/                     # Server-side caching
    cache-manager.ts          # In-memory LRU cache
    cache-middleware.ts       # API route caching middleware
  /constants/                 # App constants and placeholder data
  config.ts                   # Environment configuration with Zod validation
  utils.ts                    # General utilities (cn, etc.)
  api-utils.ts                # API response helpers

/docs/                        # Documentation and feature specs
  /features/                  # Feature-specific documentation
    /tourism-explorer/        # Main feature docs
      tech-spec.md            # Technical specification
      TODO.md                 # Feature task list
      /tasks/                 # Individual task specifications

/e2e/                         # Playwright E2E tests
/public/                      # Static assets (images, icons)
/vendor/                      # Vendored dependencies (Axios)
/scripts/                     # Utility scripts

next.config.js                # Next.js configuration with security headers
tsconfig.json                 # TypeScript configuration with @ path alias
tailwind.config.ts            # Tailwind CSS configuration
vitest.config.ts              # Vitest configuration
playwright.config.ts          # Playwright E2E test configuration
vercel.json                   # Vercel deployment configuration
```

## Key Architectural Patterns

### API Route Pattern
All external API calls go through Next.js API routes (proxy pattern) to protect API keys:
- Client → `/api/tour/search` → `TourApiService.search()` → TourAPI
- Rate limiting via middleware (100 req/min per IP)
- Caching with `Cache-Control` headers (5min TTL)
- Zod validation on all inputs
- Custom error handling with specific error classes

### TourApiService
Singleton service class (`lib/services/tour-api.ts`) handles all TourAPI communication:
- Uses Node.js `https` module for requests (not Axios)
- Automatic retry logic with exponential backoff (3 attempts)
- Custom error types: `TourApiError`, `TourApiNetworkError`, `TourApiNotFoundError`, `TourApiRateLimitError`
- Query parameter sanitization and encoding
- Response transformation via `transformApiLocation()` helper

### Naver Maps Integration
- SDK loaded dynamically via `useNaverMaps` hook
- Map component wraps Naver Maps API with React lifecycle
- Custom marker icons by category (created via `createMarkerIcon()`)
- Marker clustering for performance with many locations
- Mobile vs desktop rendering (bottom sheet vs sidebar)
- Map-list synchronization via `useMapListSync` hook

### Type Safety
- Zod schemas validate all external data (API responses, env vars, search params)
- Strict TypeScript with no implicit any
- Runtime validation in API routes
- Internal types in `lib/models/` separate from API types
- Transform functions convert API data to internal types

### State Management
- No global state library (React state + URL params)
- Server state cached in memory (`lib/cache/cache-manager.ts`)
- Client state: localStorage for favorites, URL for search filters
- Map-list sync via custom hook with shared state

### Testing Strategy
- **Unit Tests**: Vitest + React Testing Library
  - Test files colocated with source: `__tests__/` folders
  - Mock external dependencies (APIs, SDK)
  - Focus on business logic and utilities
- **E2E Tests**: Playwright
  - Test real user flows across pages
  - Multi-device testing (desktop, mobile, tablet)
  - Visual regression testing via screenshots

## Important Patterns to Follow

### Path Aliases
Use `@/` prefix for all imports: `import { Location } from '@/lib/models/location'`

### Error Handling in API Routes
```typescript
try {
  const result = await tourApiService.search(params);
  return successResponse(result);
} catch (error) {
  if (error instanceof TourApiError) {
    return errorResponse(error.message, error.statusCode || 500);
  }
  return errorResponse('Unknown error', 500);
}
```

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('renders component', () => {
  render(<Component />);
  expect(screen.getByText('Expected')).toBeInTheDocument();
});
```

### Naver Maps Type Safety
Import types from `components/map/types.ts`:
```typescript
import type { NaverMapInstance, NaverMarkerInstance } from '@/components/map/types';
```

## Build Verification

ALWAYS run `npm run build` after making code changes to catch:
- TypeScript errors
- Next.js build-time errors
- Missing dependencies
- Configuration issues

## Feature Development Workflow

When working with feature specifications in `/docs/features/`:
1. Read `tech-spec.md` for requirements
2. Check `TODO.md` for task status
3. Follow TDD cycle (Red → Green → Refactor)
4. Update TODO status when tasks complete
5. Run tests and build before marking complete

## Security Considerations

- API keys NEVER exposed to client (server-side only in `lib/config.ts`)
- All API routes have rate limiting (100 req/min per IP)
- Input sanitization via Zod schemas
- CSP headers configured in `next.config.js`
- HTTPS enforced in production
- CORS restricted to allowed origins in production

## Performance Optimizations

- Image optimization via Next.js Image component
- Code splitting by route (automatic with App Router)
- Lazy loading for map component and images
- Server-side caching (5min TTL) for API responses
- Bundle analysis available via `npm run build:analyze`
- Marker clustering for maps with many locations
- Static generation where possible

## Mobile-First Design

- Bottom navigation on mobile (`<768px`)
- Touch-optimized controls
- Bottom sheet UI for location details on mobile
- Responsive breakpoints: mobile `<768px`, tablet `768-1024px`, desktop `>1024px`
- Swipeable image galleries on mobile
