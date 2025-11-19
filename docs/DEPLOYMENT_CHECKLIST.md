# Deployment Checklist

## Pre-Deployment

### Code Quality

- [x] Production build successful (`npm run build`)
- [x] All tests passing (`npm test`)
- [x] Linting passes (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] No console.log() in production code
- [ ] No TODO/FIXME comments in critical paths

### Environment Configuration

- [x] .env.production file created (not committed)
- [x] .env.example updated with all variables
- [x] Production API keys obtained
- [ ] Environment variables added to Vercel
- [ ] CORS configuration verified
- [ ] API rate limits understood

### Security

- [ ] API keys not exposed in client-side code
- [ ] Security headers configured (vercel.json)
- [ ] Input validation implemented
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] No sensitive data in git history

### Performance

- [ ] Bundle size acceptable (< 500KB first load)
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching headers configured
- [ ] Lazy loading for heavy components

---

## Deployment Steps

### 1. Vercel Setup

- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Project linked (`vercel link`)

### 2. Environment Variables

Configure these in Vercel dashboard or via CLI:

```bash
# Server-side variables
vercel env add TOURAPI_KEY production
vercel env add TOURAPI_BASE_URL production

# Client-side variables (NEXT_PUBLIC_ prefix)
vercel env add NEXT_PUBLIC_NAVER_MAP_CLIENT_ID production
vercel env add NEXT_PUBLIC_API_URL production

# Optional
vercel env add CACHE_TTL production
vercel env add ALLOWED_ORIGIN production
```

- [ ] TOURAPI_KEY set
- [ ] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID set
- [ ] NEXT_PUBLIC_API_URL set
- [ ] All variables verified

### 3. Preview Deployment

```bash
# Deploy to preview
vercel
```

- [ ] Preview deployment successful
- [ ] Preview URL tested
- [ ] No console errors in browser
- [ ] API calls working

### 4. Production Deployment

```bash
# Deploy to production
vercel --prod

# OR use deployment script
./scripts/deploy.sh production
```

- [ ] Production deployment successful
- [ ] Production URL accessible
- [ ] DNS propagated (if custom domain)
- [ ] SSL certificate active

---

## Post-Deployment Verification

### Functionality Tests

Manual testing on production URL:

- [ ] **Homepage**
  - [ ] Loads without errors
  - [ ] Search bar visible
  - [ ] Map loads correctly

- [ ] **Search**
  - [ ] Keyword search works
  - [ ] Filters apply correctly
  - [ ] Results display properly
  - [ ] Pagination works

- [ ] **Map**
  - [ ] Map renders
  - [ ] Markers display
  - [ ] Marker click shows info
  - [ ] Geolocation works
  - [ ] Map controls functional

- [ ] **Detail Page**
  - [ ] Detail page loads
  - [ ] Images display
  - [ ] Information correct
  - [ ] Share functionality works

- [ ] **Favorites**
  - [ ] Add to favorites works
  - [ ] Remove from favorites works
  - [ ] Export to JSON works
  - [ ] Import from JSON works
  - [ ] LocalStorage persists

- [ ] **Mobile**
  - [ ] Bottom navigation works
  - [ ] Bottom sheet swipes
  - [ ] Touch targets adequate
  - [ ] Responsive layout correct

### API Endpoint Tests

```bash
# Test search endpoint
curl https://tourism-explorer.vercel.app/api/tour/search?keyword=Seoul

# Test detail endpoint
curl https://tourism-explorer.vercel.app/api/tour/detail/126508

# Verify response headers
curl -I https://tourism-explorer.vercel.app/api/tour/search?keyword=test
```

- [ ] Search API returns 200
- [ ] Detail API returns 200
- [ ] Error handling works (404, 500)
- [ ] Rate limiting active
- [ ] Cache headers present

### Performance Tests

Run Lighthouse audit:

```bash
npx lighthouse https://tourism-explorer.vercel.app --view
```

Target scores:

- [ ] Performance > 90
- [ ] Accessibility > 95
- [ ] Best Practices > 90
- [ ] SEO > 90

Core Web Vitals:

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

### Security Tests

- [ ] HTTPS enabled (https://)
- [ ] Security headers present
  ```bash
  curl -I https://tourism-explorer.vercel.app | grep -i "x-"
  ```
- [ ] No API keys in client code
  ```bash
  # View source, search for API keys
  curl https://tourism-explorer.vercel.app | grep -i "tourapi"
  ```
- [ ] CORS configured correctly
- [ ] Rate limiting prevents abuse

---

## Monitoring Setup

### Vercel Analytics

- [ ] Analytics enabled in Vercel dashboard
- [ ] Tracking code present (automatically added)
- [ ] Metrics visible in dashboard

### Error Monitoring (Optional)

- [ ] Sentry configured (if using)
- [ ] Error alerts set up
- [ ] Slack/email notifications configured

### Uptime Monitoring (Optional)

- [ ] Uptime monitoring service configured
- [ ] Health check endpoint working (`/api/health`)
- [ ] Alerts configured

---

## Post-Launch Tasks

### Documentation

- [ ] Update README.md with production URL
- [ ] Document any deployment issues encountered
- [ ] Create runbook for common operations

### Team Communication

- [ ] Notify team of deployment
- [ ] Share production URL
- [ ] Document any breaking changes
- [ ] Update project status

### Maintenance

- [ ] Schedule first post-deployment review (24h)
- [ ] Monitor error rates (first 48h)
- [ ] Review performance metrics (first week)
- [ ] Plan first iteration/updates

---

## Rollback Plan

If critical issues occur:

### Immediate Rollback

```bash
# Via Vercel dashboard
1. Go to Deployments
2. Find last stable deployment
3. Click "Promote to Production"

# Via Vercel CLI
vercel rollback <previous-deployment-url>
```

### Rollback Checklist

- [ ] Identify issue
- [ ] Document issue for post-mortem
- [ ] Execute rollback
- [ ] Verify rollback successful
- [ ] Notify stakeholders
- [ ] Plan fix deployment

---

## Success Criteria

Deployment is considered successful when:

- [x] Production build completes with 0 errors
- [ ] All environment variables configured
- [ ] Production deployment succeeds
- [ ] All manual tests pass
- [ ] Lighthouse score targets met
- [ ] No critical errors in first 24 hours
- [ ] API rate limits respected
- [ ] Core features working as expected

---

## Emergency Contacts

**Technical Issues**:
- Vercel Support: https://vercel.com/support
- TourAPI Support: Contact via API portal
- Naver Cloud Support: https://www.ncloud.com/support

**Escalation**:
1. Check Vercel status page
2. Review deployment logs
3. Check GitHub Actions workflow
4. Contact Vercel support if platform issue

---

## Notes

- Keep this checklist updated with each deployment
- Document any issues encountered
- Update rollback procedures based on experience
- Review and improve deployment process regularly

---

**Last Updated**: 2025-11-10
**Deployment Version**: v1.0.0
**Status**: Ready for Production
