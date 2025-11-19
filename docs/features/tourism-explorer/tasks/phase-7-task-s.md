# Task S: Code Review & Security Audit ⭐ CRITICAL

**Phase**: 7 | **Time**: 2h | **Agent**: security-engineer-specialist
**Dependencies**: Task R complete | **On Critical Path**: ⭐ Yes
**EST**: 22h | **EFT**: 24h | **Slack**: 0h

## Objective
Comprehensive security audit and code review for production readiness.

---

## Security Checklist (1h)

### 1. API Key Security

```typescript
// ✅ GOOD - API keys in environment variables (server-side)
// app/api/tour/search/route.ts
const apiKey = process.env.TOURAPI_KEY; // Server-side only

// ❌ BAD - Never expose in client
// NEXT_PUBLIC_TOURAPI_KEY // This would be exposed!
```

**Verify**:
```bash
# Check for leaked keys
git secrets --scan
grep -r "NEXT_PUBLIC.*KEY" .
```

### 2. XSS Protection

```typescript
// ✅ GOOD - React auto-escapes
<div>{location.title}</div>

// ✅ GOOD - Use dangerouslySetInnerHTML only when necessary
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(location.overview)
}} />

// ❌ BAD - Never trust user input
// <div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Install sanitizer**:
```bash
npm install dompurify
npm install -D @types/dompurify
```

### 3. CSRF Protection

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' openapi.map.naver.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};
```

### 4. Rate Limiting

```typescript
// Verify rate limiting is active
// app/api/middleware.ts
const RATE_LIMIT = 100; // requests per minute
const WINDOW_MS = 60 * 1000;

// Test:
describe('Rate Limiting', () => {
  it('should block after 100 requests', async () => {
    for (let i = 0; i < 101; i++) {
      await fetch('/api/tour/search');
    }

    const response = await fetch('/api/tour/search');
    expect(response.status).toBe(429);
  });
});
```

### 5. Input Validation

```typescript
// ✅ GOOD - Zod validation on all API routes
import { z } from 'zod';

const searchSchema = z.object({
  keyword: z.string().max(100),
  pageNo: z.number().int().positive().max(1000),
  numOfRows: z.number().int().positive().max(100),
});

// Validate ALL user inputs
```

---

## Code Review (1h)

### Accessibility Audit

```bash
# Run axe-core
npm install -D @axe-core/playwright
npm run test:a11y

# Verify:
# - All images have alt text
# - Forms have labels
# - Buttons have aria-labels
# - Semantic HTML used
# - Keyboard navigation works
# - Screen reader compatible
```

```typescript
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have any automatically detectable violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Best Practices Review

```typescript
// Checklist:
// ✅ TypeScript strict mode enabled
// ✅ ESLint + Prettier configured
// ✅ No console.log in production
// ✅ Error boundaries implemented
// ✅ Loading states for async operations
// ✅ Proper error messages (Korean)
// ✅ Mobile-first responsive design
// ✅ SEO meta tags
// ✅ Analytics (if needed)
```

### Performance Review

```bash
# Verify optimizations from Task R
npm run build

# Check bundle sizes
# ✅ Initial bundle < 500KB
# ✅ Each route < 200KB
# ✅ No duplicate dependencies
```

---

## WCAG 2.1 AA Compliance

```bash
# Install WAVE browser extension
# Test all pages:
# - Home
# - Search results
# - Detail page
# - Favorites
# - Mobile views

# Verify:
# ✅ Color contrast ratio ≥ 4.5:1
# ✅ Focus indicators visible
# ✅ Touch targets ≥ 44x44px
# ✅ Text resizable to 200%
# ✅ No keyboard traps
```

---

## Security Scan

```bash
# Run security audit
npm audit
npm audit fix

# Check dependencies
npx depcheck

# OWASP check
npx eslint . --ext .ts,.tsx
```

---

## Final Checklist

```bash
# Run all tests
npm run test              # ✅ Unit tests pass
npm run test:integration  # ✅ Integration tests pass
npm run test:e2e         # ✅ E2E tests pass
npm run test:a11y        # ✅ Accessibility tests pass

# Build
npm run build            # ✅ No errors
npm run lint             # ✅ No lint errors

# Security
npm audit                # ✅ No vulnerabilities

# Generate report
npm run test:coverage    # ✅ Coverage > 80%
```

## Success Criteria

- [x] No security vulnerabilities
- [x] API keys secured (server-side only)
- [x] XSS protection verified
- [x] CSRF protection active
- [x] Rate limiting works
- [x] Input validation on all endpoints
- [x] WCAG 2.1 AA compliant
- [x] All tests passing ✅
- [x] Security scan passed
- [x] Code review complete
- [x] Critical path complete ⭐
