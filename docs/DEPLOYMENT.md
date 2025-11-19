# Tourism Explorer - Deployment Guide

## Prerequisites

1. **Production API Keys**
   - TourAPI Service Key (from https://api.visitkorea.or.kr)
   - Naver Maps Client ID (from https://console.ncloud.com)

2. **Vercel Account**
   - Sign up at https://vercel.com
   - Install Vercel CLI: `npm install -g vercel`

3. **Production Build Test**
   - Ensure all tests pass: `npm test`
   - Verify production build: `npm run build`

---

## Environment Variables

### Required Variables

Create these environment variables in Vercel dashboard or using Vercel CLI:

```bash
# TourAPI Configuration
TOURAPI_KEY=<your_production_tourapi_key>
TOURAPI_BASE_URL=http://apis.data.go.kr/B551011/KorService1

# Naver Maps API
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=<your_naver_map_client_id>

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<your-project>.vercel.app

# Cache Configuration
CACHE_TTL=300

# CORS Configuration (Optional)
ALLOWED_ORIGIN=https://<your-project>.vercel.app
```

### Setting Variables via Vercel CLI

```bash
# Add environment variables
vercel env add TOURAPI_KEY production
vercel env add NEXT_PUBLIC_NAVER_MAP_CLIENT_ID production
vercel env add NEXT_PUBLIC_API_URL production
```

### Setting Variables via Vercel Dashboard

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for "Production" environment
4. Click "Save"

---

## Deployment Steps

### 1. Initial Setup

```bash
# Login to Vercel
vercel login

# Link project to Vercel (first time only)
vercel link
```

### 2. Deploy to Preview

```bash
# Deploy to preview environment
vercel

# This generates a preview URL like:
# https://tourism-explorer-<hash>.vercel.app
```

### 3. Test Preview Deployment

Test all critical features on the preview URL:

- [ ] Homepage loads correctly
- [ ] Search functionality works
- [ ] Map renders with markers
- [ ] Location detail pages load
- [ ] API endpoints respond correctly
- [ ] Favorites feature works
- [ ] Mobile responsive layout works

### 4. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Production URL:
# https://tourism-explorer.vercel.app
```

### 5. Verify Production Deployment

Run smoke tests:

```bash
# Test homepage
curl -I https://tourism-explorer.vercel.app

# Test search API
curl https://tourism-explorer.vercel.app/api/tour/search?keyword=Seoul

# Test detail API
curl https://tourism-explorer.vercel.app/api/tour/detail/126508
```

---

## Post-Deployment Checklist

### Functionality Testing

- [ ] Homepage loads without errors
- [ ] Search returns results
- [ ] Filters work correctly
- [ ] Map displays markers
- [ ] Marker click shows info window
- [ ] Location cards are clickable
- [ ] Detail pages load correctly
- [ ] Share functionality works
- [ ] Favorites add/remove works
- [ ] Export/import favorites works
- [ ] Mobile bottom sheet swipes correctly
- [ ] Responsive layout works on all breakpoints

### Performance Verification

- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 95
- [ ] Lighthouse Best Practices score > 90
- [ ] Lighthouse SEO score > 90
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s

### Security Verification

- [ ] HTTPS enabled
- [ ] Security headers present (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] API keys not exposed in client code
- [ ] CORS configured correctly
- [ ] Rate limiting active

---

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

### GitHub Integration

1. Connect your GitHub repository in Vercel dashboard
2. Configure automatic deployments:
   - Production Branch: `main`
   - Install GitHub App: Allow Vercel to access repository

3. Every push to `main` triggers automatic production deployment
4. Every PR creates a preview deployment

---

## Rollback Procedure

If issues occur in production:

### Option 1: Vercel Dashboard

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find the last working deployment
4. Click "..." menu
5. Select "Promote to Production"

### Option 2: Vercel CLI

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Option 3: Git Revert

```bash
# Revert the problematic commit
git revert <commit-hash>

# Push to main (triggers automatic redeployment)
git push origin main
```

---

## Monitoring & Maintenance

### Check Deployment Status

```bash
# List all deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Inspect deployment details
vercel inspect <deployment-url>
```

### API Rate Limits

Monitor API usage to stay within limits:

- **TourAPI Free Tier**: 1,000 requests/day
- **TourAPI Paid Tier**: 10,000 requests/day

Check usage in Vercel Analytics dashboard.

### Cache Management

API responses are cached for 5 minutes (300 seconds). To clear cache:

1. Redeploy the application
2. Or wait for cache TTL to expire

---

## Troubleshooting

### Build Fails

```bash
# Run build locally to debug
npm run build

# Check for:
# - TypeScript errors
# - Missing dependencies
# - Invalid environment variables
```

### API Errors in Production

```bash
# Check Vercel logs
vercel logs --follow

# Verify environment variables
vercel env ls

# Test API endpoints directly
curl -v https://your-app.vercel.app/api/tour/search?keyword=test
```

### Environment Variables Not Working

```bash
# Ensure NEXT_PUBLIC_ prefix for client-side variables
# Server-side: TOURAPI_KEY
# Client-side: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

# Redeploy after adding new variables
vercel --prod
```

### Slow Performance

1. Check Lighthouse report
2. Analyze bundle size: `npm run build` (check output)
3. Enable CDN caching (already configured in vercel.json)
4. Optimize images (use Next.js Image component)

---

## Custom Domain Setup (Optional)

### Add Custom Domain

```bash
# Add domain via CLI
vercel domains add yourdomain.com

# Or use Vercel dashboard:
# Settings → Domains → Add Domain
```

### Configure DNS

1. Add DNS records pointing to Vercel:
   ```
   A Record: 76.76.21.21
   CNAME: cname.vercel-dns.com
   ```

2. Vercel automatically provisions SSL certificate

3. Update environment variables:
   ```bash
   NEXT_PUBLIC_API_URL=https://yourdomain.com
   ALLOWED_ORIGIN=https://yourdomain.com
   ```

---

## Production Optimization

### Bundle Size Optimization

- ✅ Next.js automatic code splitting enabled
- ✅ Dynamic imports for heavy components
- ✅ Tree shaking enabled in production build

### Image Optimization

- Use Next.js `Image` component for automatic optimization
- Serve images via Vercel CDN
- WebP/AVIF format support

### Caching Strategy

- **Static Assets**: Cached for 1 year (immutable)
- **API Responses**: Cached for 5 minutes (stale-while-revalidate)
- **HTML Pages**: Edge caching with ISR (Incremental Static Regeneration)

---

## Deployment Metrics

After successful deployment, monitor these metrics:

- **Uptime**: Target 99.9%
- **Response Time**: API < 500ms, Pages < 1s
- **Error Rate**: < 0.1%
- **Bounce Rate**: < 40%
- **Core Web Vitals**: All "Good" ratings

---

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **TourAPI Documentation**: https://api.visitkorea.or.kr
- **Naver Maps API**: https://www.ncloud.com/product/applicationService/maps

---

## Quick Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# List deployments
vercel ls

# Rollback
vercel rollback <deployment-url>

# Environment variables
vercel env ls
vercel env add <VAR_NAME> production
vercel env rm <VAR_NAME> production
```

---

**Last Updated**: 2025-11-10
**Deployment Status**: Ready for Production
