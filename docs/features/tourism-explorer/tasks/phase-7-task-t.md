# Task T: Final Build & Deployment ⭐ CRITICAL

**Phase**: 7 | **Time**: 2h | **Agent**: devops-infrastructure-specialist
**Dependencies**: Task S complete | **On Critical Path**: ⭐ Yes
**EST**: 24h | **EFT**: 26h | **Slack**: 0h

## Objective
Production build, deployment setup, and final verification.

---

## Production Build (30min)

### Environment Variables

```bash
# .env.production
TOURAPI_KEY=your_production_key_here
TOURAPI_BASE_URL=http://apis.data.go.kr/B551011/KorService1
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tourism-explorer.vercel.app

# Verify .env.production is in .gitignore
cat .gitignore | grep .env.production
```

### Build

```bash
# Clean previous builds
rm -rf .next
rm -rf out

# Production build
npm run build

# Verify build output
# ✅ No errors
# ✅ No warnings (or only acceptable ones)
# ✅ Bundle sizes acceptable

# Test production build locally
npm start
# Open http://localhost:3000 and test
```

---

## Deployment (1h)

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Test preview URL
# Verify all features work

# Deploy to production
vercel --prod
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "env": {
    "TOURAPI_KEY": "@tourapi-key",
    "TOURAPI_BASE_URL": "@tourapi-base-url",
    "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID": "@naver-map-client-id"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Add Secrets

```bash
# Add production secrets to Vercel
vercel secrets add tourapi-key "your_actual_key"
vercel secrets add tourapi-base-url "http://apis.data.go.kr/B551011/KorService1"
vercel secrets add naver-map-client-id "your_naver_client_id"
```

---

## Post-Deployment Verification (30min)

### Smoke Tests

```bash
# Test all critical paths on production

# 1. Homepage loads
curl -I https://tourism-explorer.vercel.app

# 2. Search works
curl https://tourism-explorer.vercel.app/api/tour/search?keyword=Seoul

# 3. Detail page works
curl https://tourism-explorer.vercel.app/api/tour/detail/123456

# 4. Static assets load
curl -I https://tourism-explorer.vercel.app/_next/static/...
```

### Run E2E Tests Against Production

```typescript
// playwright.config.ts (production)
export default defineConfig({
  use: {
    baseURL: 'https://tourism-explorer.vercel.app',
  },
});
```

```bash
# Run E2E tests against production
npm run test:e2e:prod
```

### Lighthouse Audit

```bash
# Run Lighthouse on production
npx lighthouse https://tourism-explorer.vercel.app --view

# Verify:
# ✅ Performance > 90
# ✅ Accessibility > 95
# ✅ Best Practices > 90
# ✅ SEO > 90
```

### Manual Testing Checklist

```bash
# Desktop (Chrome)
✅ Home page loads
✅ Search works
✅ Filters work
✅ Map loads and markers appear
✅ Click marker shows info
✅ Click card centers map
✅ Detail page loads
✅ Share works
✅ Favorites add/remove
✅ Export/import favorites

# Mobile (iPhone Safari)
✅ Bottom navigation works
✅ Search bar expands
✅ Map full-screen works
✅ Bottom sheet swipes
✅ Touch targets adequate (44px)
✅ Responsive layout correct

# Tablet (iPad)
✅ Split view works
✅ Layout adjusts properly
```

---

## Monitoring Setup (Optional)

### Vercel Analytics

```bash
# Enable Vercel Analytics
npm install @vercel/analytics

# Add to layout
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Monitoring (Optional - Sentry)

```bash
npm install @sentry/nextjs

# sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## Documentation

### Deployment Docs

```markdown
# docs/DEPLOYMENT.md

## Deployment Checklist

1. Update environment variables
2. Run `npm run build`
3. Test locally with `npm start`
4. Deploy to Vercel preview: `vercel`
5. Test preview URL
6. Deploy to production: `vercel --prod`
7. Run smoke tests
8. Monitor for errors

## Rollback

vercel rollback
```

### API Usage Documentation

```markdown
# docs/API_USAGE.md

## TourAPI Rate Limits

- Free tier: 1,000 requests/day
- Paid tier: 10,000 requests/day

## Monitoring

Check Vercel dashboard for:
- API usage
- Error rates
- Performance metrics
```

---

## Final Checklist

```bash
Production Deployment:
✅ Environment variables set
✅ Build successful
✅ No build warnings
✅ Deployed to Vercel
✅ Custom domain configured (optional)
✅ HTTPS enabled
✅ CDN active

Testing:
✅ Smoke tests passed
✅ E2E tests on production passed
✅ Lighthouse score > 90
✅ Manual testing complete
✅ Mobile testing complete
✅ Tablet testing complete

Monitoring:
✅ Analytics configured
✅ Error tracking setup (optional)
✅ Performance monitoring active

Documentation:
✅ Deployment docs written
✅ API usage documented
✅ README updated
✅ User guide created (optional)
```

---

## Success Criteria

- [x] Production build successful
- [x] Deployed to Vercel
- [x] All environment variables set
- [x] HTTPS enabled
- [x] Smoke tests passed ✅
- [x] E2E tests on production passed ✅
- [x] Lighthouse score verified
- [x] Manual testing complete
- [x] Documentation updated
- [x] Project complete! 🎉
- [x] **CRITICAL PATH COMPLETE** ⭐

---

## 🎉 PROJECT COMPLETE

**Total Time**: 26 hours (critical path)
**Parallel Time**: 30 hours (with all phases)
**Sequential Time**: 58 hours
**Time Saved**: 48% faster! 🚀

**All 18 tasks completed with TDD methodology!**
