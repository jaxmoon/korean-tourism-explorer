# TechSpec: Tourism Explorer

## 1. Overview

**Purpose**: Tourism Explorer is a high-performance, mobile-optimized web application that enables users to discover and explore Korean tourist attractions, restaurants, accommodations, and cultural events. The application leverages the Korea Tourism Organization's TourAPI 4.0 to provide comprehensive, up-to-date information about 260,000+ tourism-related locations across South Korea.

**Target Audience**:
- Domestic and international tourists planning trips to Korea
- Local residents seeking nearby attractions and dining options
- Travel enthusiasts looking for cultural events and festivals

**Success Criteria**:
- Initial page load under 3 seconds on 4G mobile networks
- Support for 1,000+ concurrent users without performance degradation
- 95%+ mobile responsiveness score on Google Lighthouse
- API response caching achieving 70%+ cache hit rate
- User engagement: average session duration > 3 minutes

**Business Value**:
- Provides practical, real-world value to tourists and travelers
- Demonstrates full-stack development capabilities
- Potential for monetization through partnerships or advertising
- Portfolio piece showcasing modern web development practices

## 2. Requirements

### 2.1 Functional Requirements

**[FR-1] Search & Discovery**
- Users can search for locations by keyword
- Users can filter by region (17 provinces and major cities)
- Users can filter by content type (attractions, restaurants, accommodations, events)
- Users can filter by sub-categories (e.g., Korean food, museums, beaches)
- Search results display with pagination (20 items per page)
- Real-time search suggestions as users type

**[FR-2] Map Integration**
- Display search results on interactive Naver Map
- Cluster markers for performance when many results exist
- Custom marker icons by category
- Click markers to view location info windows
- Pan and zoom map controls
- "Show on map" button for each search result

**[FR-3] Detailed Information Display**
- Each location has a dedicated detail page
- Display comprehensive information:
  - Name, address, phone number
  - Operating hours and admission fees
  - High-quality image galleries
  - Detailed descriptions
  - Amenities and facilities
  - Public transit directions
- Share location via social media or copy link

**[FR-4] Favorites Management**
- Users can add/remove items to favorites without authentication
- Favorites persist in browser LocalStorage
- Favorites accessible from dedicated "My Favorites" page
- Organize favorites by category
- Export favorites as JSON
- Import favorites from JSON file

**[FR-5] Responsive Design**
- Fully responsive layout for mobile, tablet, desktop
- Touch-optimized controls for mobile devices
- Bottom navigation bar on mobile
- Hamburger menu for mobile navigation
- Swipeable image galleries on mobile

**[FR-6] Performance Optimization**
- Lazy load images below the fold
- Lazy load map component until needed
- Infinite scroll or pagination for search results
- API response caching (server-side)
- Static page generation where possible
- Service Worker for offline basic functionality

### 2.2 Non-Functional Requirements

**[NFR-1] Performance**
- First Contentful Paint (FCP) < 1.5 seconds
- Largest Contentful Paint (LCP) < 2.5 seconds
- Time to Interactive (TTI) < 3.5 seconds
- Cumulative Layout Shift (CLS) < 0.1
- API response time < 500ms (with caching)
- Support 1,000+ concurrent users

**[NFR-2] Scalability**
- Horizontal scaling capability via serverless architecture
- CDN distribution for static assets
- Database connection pooling (if applicable)
- Rate limiting to prevent abuse (100 requests/minute per IP)

**[NFR-3] Security**
- API keys stored in environment variables (never exposed to client)
- Input sanitization to prevent XSS attacks
- CSRF protection on API routes
- HTTPS enforced in production
- Content Security Policy (CSP) headers
- Rate limiting on API endpoints

**[NFR-4] Maintainability**
- TypeScript for type safety
- ESLint and Prettier for code consistency
- Component-driven architecture
- Comprehensive unit and integration tests (>80% coverage)
- Clear documentation and inline comments
- Git workflow with feature branches

**[NFR-5] Accessibility**
- WCAG 2.1 Level AA compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios (4.5:1 minimum)

**[NFR-6] Browser Compatibility**
- Modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Mobile browsers: iOS Safari, Chrome Mobile
- Graceful degradation for older browsers

### 2.3 Detailed Feature Specifications

This section provides comprehensive specifications for core features, addressing implementation details, edge cases, and UX considerations.

#### 2.3.1 Search & Filter System

**Search Input Behavior**

*Keyword Search*:
- **Trigger**: User types in search box
- **Debounce**: 300ms delay before API call
- **Minimum Characters**: 2 characters minimum to trigger search
- **Search Scope**: Searches across `title` field in TourAPI
- **Clear Button**: X icon appears when text is present, clears input on click
- **Search History**: Last 10 searches stored in LocalStorage, recent 5 displayed as quick suggestions

*Real-time Suggestions*:
- **Source**: Pre-cached popular keywords + recent searches
- **Display**: Dropdown below search input, maximum 8 suggestions
- **Selection**: Click or keyboard navigation (Arrow keys + Enter)
- **Rate Limiting**: Maximum 1 request per 300ms (debounced)
- **Empty State**: "No suggestions found" when query has no matches
- **Mobile**: Full-screen overlay with suggestions on mobile devices

**Filter Behavior**

*Filter Combination Logic*:
- **Default Logic**: AND operation between different filter types
  - Example: Region=Seoul AND ContentType=Restaurant
- **Within Same Type**: OR operation (e.g., Restaurant OR Cafe)
- **Applied Filters**: Display as removable chips above results
- **Reset Filters**: "Clear All" button visible when any filter active

*Filter Types & Options*:

1. **Content Type Filter** (Required)
   - Options: All, Attractions (관광지), Restaurants (음식점), Accommodations (숙박), Events (행사)
   - Default: All
   - Display: Toggle buttons (pills) on desktop, dropdown on mobile
   - TourAPI Mapping: contentTypeId (12, 14, 15, 28, 32, 38, 39)

2. **Region Filter** (Optional)
   - Options: 17 provinces/cities (서울, 부산, 제주 등)
   - Default: None (all regions)
   - Display: Dropdown select on both desktop and mobile
   - Cascading: Selecting region enables sub-region (sigungu) filter
   - TourAPI Mapping: areaCode

3. **Sub-Category Filter** (Optional, depends on Content Type)
   - Dynamically loaded based on selected Content Type
   - Example for Restaurants: Korean, Chinese, Japanese, Western, Cafe
   - Display: Multi-select checkboxes in dropdown
   - TourAPI Mapping: cat1, cat2, cat3

4. **Sort Order**
   - Options: Relevance (default), Distance (if location available), Name (A-Z), Recently Added
   - Display: Dropdown select, label shows current sort
   - Persistence: Saved in session storage

**Search Results Display**

*Default Sort Order*:
- With Keyword: Relevance (API default)
- Without Keyword: Recently Added (modifiedtime DESC)
- With Location: Distance (closest first)

*Pagination vs Infinite Scroll*:
- **Desktop (≥ 1024px)**: Pagination (20 items per page)
  - Numbered page buttons: [1] [2] [3] ... [10]
  - Previous/Next buttons
  - Jump to page input
  - Reason: Mouse interaction + larger screen supports traditional pagination
- **Tablet (768-1023px)**: Pagination (20 items per page)
  - Simplified pagination: Previous/Next buttons only (no numbered buttons)
  - Page indicator: "Page 2 of 10" text display
  - Reason: Sufficient screen space, but simplified for touch interaction
- **Mobile (< 768px)**: Infinite scroll
  - Auto-load next 20 when user scrolls to bottom
  - "Loading..." indicator while fetching
  - "End of results" message when no more data
  - Reason: Touch-friendly, continuous scrolling experience

*Empty Results Handling*:
- **No Results Found**:
  - Display: Large empty state illustration + message
  - Message: "죄송합니다. '{keyword}' 검색 결과가 없습니다."
  - Suggestions:
    - Check spelling
    - Try different keywords
    - Remove some filters
    - Browse popular destinations (show 6 random attractions)

*Error Handling*:
- **API Error (500, 503)**:
  - Display: Error icon + "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  - Action: "Retry" button (re-attempts the query)
  - Fallback: Show cached results if available
- **Rate Limit (429)**:
  - Display: "일일 조회 한도에 도달했습니다. 내일 다시 이용해주세요."
  - Action: Disable search, show favorites instead
- **Network Error**:
  - Display: "인터넷 연결을 확인해주세요."
  - Action: Offline mode - show cached/favorite locations only

*Loading States*:
- **Initial Search**: Full-page skeleton (6 card skeletons)
- **Filter Change**: Overlay with spinner on results area
- **Pagination**: Disable pagination buttons, show spinner
- **Infinite Scroll**: Bottom loading indicator (spinner + "검색 중...")

#### 2.3.2 Map Integration Specifications

**Map Display Modes**

*View Toggle*:
- **List View** (Default on Tablet & Desktop): Search results as cards in grid
- **Map View** (Mobile): Full-screen map modal overlay
- **Split View** (Tablet & Desktop ≥ 768px):
  - Tablet (768-1023px): Map 50% / List 50% (equal split)
  - Desktop (≥ 1024px): Map 40% (right) / List 60% (left)
  - Toggle between List Only / Split View / Map Only
- **Toggle Button**: "지도 보기" / "목록 보기" / "분할 보기" in results header
- **Persistence**: Last selected view saved in session storage

*Map-List Synchronization*:
- **Bidirectional Sync**:
  - Clicking marker → Scrolls to corresponding card in bottom sheet + highlights it
  - Clicking card in bottom sheet → Centers map on location + highlights marker
  - Clicking "Show on Map" in card → Centers map on location + opens info window

**Mobile Map View UI Structure** (< 768px):

*Layout Composition*:
```
┌────────────────────────┐
│ [🔍 Search...      ✕] │ ← Top search bar (floating overlay)
│                        │
│        📍             │
│   📍      📍          │ ← Full-screen map
│      Cluster(8)        │
│   📍      📍          │
│                        │
├────────────────────────┤
│ ▬▬▬ (swipe handle)    │ ← Bottom sheet handle
│ [Results: 18]  [List] │ ← Bottom sheet header
│ ┌────────────────────┐│
│ │  Card 1   📍 ❤️   ││ ← Scrollable results
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │  Card 2   📍 ❤️   ││
│ └────────────────────┘│
└────────────────────────┘
```

*Top Search Bar*:
- **Position**: Fixed top overlay with semi-transparent background blur
- **Content**: Search input + close [✕] button
- **Behavior**:
  - Type to search → Map markers + bottom sheet update instantly
  - Auto-complete suggestions dropdown below search bar
  - Search history accessible via magnifying glass icon
- **Sticky**: Remains visible when scrolling map

*Bottom Sheet*:
- **3-State Heights**:
  1. **Collapsed** (20% screen): Header + top 2 cards visible
  2. **Half-Open** (50% screen): ~6-8 cards visible, swipeable
  3. **Fully Extended** (80% screen): All results, scrollable list
- **Swipe Gestures**:
  - Swipe up from handle → Expand to next state
  - Swipe down from handle → Collapse to previous state
  - Swipe down fully → Dismiss to collapsed state (not close)
- **Header**:
  - Swipe handle indicator (centered horizontal bar)
  - Results count: "검색결과 18개"
  - "[목록 보기]" button → Returns to full list view (exit map mode)
- **Content**: Scrollable card list showing search results
- **Card Actions**:
  - Tap card → Navigate to detail page
  - Tap 📍 icon → Center map on location
  - Tap ❤️ icon → Add/remove favorite

*Map Interaction with Bottom Sheet*:
- **Marker Click**:
  - Bottom sheet auto-expands to Half-Open
  - Scrolls to clicked location's card
  - Highlights card with border glow
  - Map centers on marker
- **Pan/Zoom Map**:
  - Bottom sheet remains at current state
  - Search results refresh if "search in this area" enabled
- **Search in Visible Area**:
  - Optional toggle: "이 지역에서 검색"
  - When enabled: Auto-search when map stops moving

*Tablet & Desktop Map View* (≥ 768px):
- No bottom sheet
- Split view with side-by-side list and map
- Search bar integrated in header (not floating)
- Refer to Section 3.3 Responsive Breakpoints for details

**Marker Behavior**

*Custom Marker Icons*:
```typescript
// Marker icon by content type
const markerIcons = {
  tourist_attraction: '/icons/marker-attraction.svg',  // Blue pin
  restaurant: '/icons/marker-food.svg',                // Red fork/knife
  accommodation: '/icons/marker-hotel.svg',            // Purple bed
  festival: '/icons/marker-event.svg',                 // Yellow star
  culture_facility: '/icons/marker-culture.svg',       // Green building
  default: '/icons/marker-default.svg'                 // Gray pin
};
```

*Marker States*:
- **Normal**: Default icon color
- **Hover** (Desktop only): Icon grows 1.2x, shows tooltip with title
- **Active/Selected**: Icon changes to highlighted color, z-index increased
- **Cluster**: Circle with number, color indicates category majority

*Marker Clustering*:
- **Enable When**: More than 50 markers on screen
- **Cluster Algorithm**: Grid-based clustering (Google Maps style)
- **Cluster Appearance**:
  - Small (2-9 items): 30px circle
  - Medium (10-99 items): 40px circle
  - Large (100+ items): 50px circle
  - Color: Gradient based on density (light blue → dark blue)
- **Cluster Interaction**:
  - Click → Zoom in to expand cluster
  - Hover → Show count tooltip "25개 장소"
- **Mobile**: More aggressive clustering (threshold: 30 markers)

**Info Window (Marker Popup)**

*Content Fields*:
```typescript
interface InfoWindowContent {
  thumbnail: string;        // Image (200x150px)
  title: string;           // Location name
  category: string;        // "음식점" / "관광지" etc.
  address: string;         // Short address (시/도 + 구)
  rating?: number;         // Future: user ratings
  distance?: string;       // "2.3km" (if user location available)
  isFavorite: boolean;     // Heart icon state
}
```

*Actions*:
- **View Details**: Button → Navigate to detail page
- **Directions**: Button → Opens Naver Map app (mobile) or web (desktop) with directions
- **Add to Favorites**: Heart icon toggle
- **Close**: X button or click outside

*Mobile Optimization*:
- Info window → Bottom sheet (slides up from bottom)
- Swipe down to dismiss
- Larger touch targets (min 44x44px)

**Map Controls**

*Desktop Controls*:
- Zoom: +/- buttons (top right)
- My Location: Target icon button (top right)
- Map Type: Dropdown (Default, Satellite, Terrain)
- Fullscreen: Expand icon (bottom right)

*Mobile Controls*:
- Zoom: Pinch gesture
- My Location: Floating action button (bottom right)
- Map Type: Hidden, access via hamburger menu
- Fullscreen: Not needed (always fullscreen in map view)

**Geolocation & "Near Me"**

*My Location Feature*:
- **Trigger**: Click "My Location" button or "Near Me" filter
- **Permission Request**: Browser geolocation API
- **On Success**:
  - Center map on user's location
  - Add blue dot marker for user position
  - Search for locations within 5km radius
  - Sort results by distance
- **On Denial**:
  - Show toast: "위치 권한을 허용하면 주변 장소를 찾을 수 있습니다."
  - Hide "Near Me" filter option
- **Accuracy**: Show accuracy circle around user position (light blue circle)

**Naver Maps SDK Error Handling**

*SDK Loading Failure*:
```typescript
// Fallback strategy
if (naverMapSDKFailed) {
  // Option 1: Show static map image (Naver Static Map API)
  showStaticMap(locations);

  // Option 2: List-only mode
  showMessage("지도를 불러올 수 없습니다. 목록으로 보기 중입니다.");
  forceListView();
}
```

*Error Scenarios*:
1. **SDK Script Load Failure**:
   - Fallback to list view only
   - Hide map toggle button
   - Show notification: "현재 지도 기능을 사용할 수 없습니다."

2. **API Key Invalid**:
   - Log error to monitoring service
   - Disable map feature app-wide
   - Admin notification

3. **Quota Exceeded**:
   - Show static maps for detail pages
   - Disable interactive map
   - Display message: "지도 사용량 한도 초과. 내일 다시 이용 가능합니다."

4. **Network Timeout**:
   - Retry once automatically
   - On second failure, show list view
   - Cache map tiles for offline viewing (future)

#### 2.3.3 Favorites Management Specifications

**Add/Remove Favorites**

*Favorite Button Location*:
- **Search Result Cards**: Top-right corner heart icon
- **Detail Page**: Top-right header next to share button
- **Map Info Window**: Bottom action bar

*Button States*:
```typescript
type FavoriteButtonState =
  | 'inactive'      // Outline heart (gray)
  | 'active'        // Filled heart (red)
  | 'adding'        // Heart with pulse animation
  | 'removing';     // Heart with fade-out animation
```

*Interaction Flow*:
1. User clicks heart icon
2. Icon animates (scale up 1.2x → scale down 1.0x, 300ms)
3. State changes (outline → filled or vice versa)
4. LocalStorage updated
5. Toast notification: "즐겨찾기에 추가했습니다" / "즐겨찾기에서 제거했습니다"
6. If on Favorites page, item removed with fade-out animation

*Optimistic Updates*:
- UI updates immediately (don't wait for storage write)
- If storage fails, revert and show error toast

**Favorites Page Structure**

*Layout*:
```
┌─────────────────────────────────────────┐
│  [My Favorites]            [Export ▼]   │ ← Header
├─────────────────────────────────────────┤
│  [All (12)] [Attractions (5)]           │ ← Category Tabs
│  [Restaurants (4)] [Hotels (3)]         │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  Card   │  │  Card   │  │  Card   │ │ ← Grid of cards
│  └─────────┘  └─────────┘  └─────────┘ │
│  ┌─────────┐  ┌─────────┐              │
│  │  Card   │  │  Card   │              │
│  └─────────┘  └─────────┘              │
└─────────────────────────────────────────┘
```

*Category Tabs*:
- **Auto-Generated**: Based on content types in favorites
- **Badge Count**: Shows number of items per category
- **All Tab**: Shows all favorites sorted by date added (newest first)
- **Empty Categories**: Hidden (don't show tabs with 0 items)

*Empty State*:
```
┌─────────────────────────────────────────┐
│         🤍                               │
│   아직 즐겨찾기가 없습니다                 │
│   마음에 드는 장소를 추가해보세요          │
│   [둘러보기] 버튼                         │
└─────────────────────────────────────────┘
```

*Bulk Actions* (Future Enhancement):
- Select multiple items (checkbox on each card)
- Bulk delete
- Bulk export selected

**LocalStorage Management**

*Data Structure*:
```typescript
interface FavoritesStorage {
  version: '1.0';
  lastUpdated: string;        // ISO timestamp
  maxItems: 100;              // Hard limit
  favorites: {
    [contentId: string]: {
      contentId: string;
      contentType: ContentType;
      title: string;
      thumbnailUrl?: string;
      address: string;
      addedAt: string;        // ISO timestamp
    };
  };
}
```

*Storage Key*: `tourism_explorer_favorites`

*Storage Limit Handling*:
- **Soft Limit**: 100 items (warn user at 90)
- **Hard Limit**: 100 items (prevent adding more)
- **Warning at 90 items**:
  - Toast: "즐겨찾기가 거의 찼습니다 (90/100). 불필요한 항목을 삭제하거나 내보내기하세요."
- **Block at 100 items**:
  - Disable heart button (show disabled state)
  - Toast: "즐겨찾기 한도에 도달했습니다 (100/100). 일부 항목을 삭제하거나 내보내기하세요."
- **LocalStorage Full**:
  - Catch QuotaExceededError
  - Show alert: "저장 공간이 부족합니다. 일부 즐겨찾기를 삭제하거나 내보내기하세요."
  - Disable add functionality

*Data Validation*:
```typescript
function validateFavoritesData(data: any): boolean {
  // Check version compatibility
  if (data.version !== '1.0') return false;

  // Validate structure
  if (!data.favorites || typeof data.favorites !== 'object') return false;

  // Validate each item
  for (const item of Object.values(data.favorites)) {
    if (!item.contentId || !item.contentType || !item.title) {
      return false;
    }
  }

  return true;
}
```

**Export Functionality**

*Export Format*:
```json
{
  "exportedAt": "2025-11-10T12:00:00Z",
  "exportedBy": "Tourism Explorer v1.0",
  "totalItems": 12,
  "favorites": [
    {
      "contentId": "123456",
      "contentType": "restaurant",
      "title": "Seoul Restaurant",
      "address": "Seoul, Gangnam",
      "thumbnailUrl": "https://...",
      "addedAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

*Export Flow*:
1. Click "Export" button in favorites page header
2. Generate JSON file with timestamp
3. Trigger browser download: `favorites_YYYYMMDD_HHmmss.json`
4. Show toast: "즐겨찾기를 내보냈습니다 (12개 항목)"

*Export Options Dropdown*:
- Export All (JSON)
- Export Selected (if bulk selection enabled)
- Export as CSV (future)
- Share via Email (future)

**Import Functionality**

*Import Flow*:
1. Click "Import" in favorites page
2. File input dialog opens (accept: `.json`)
3. Validate file format
4. Handle conflicts (see below)
5. Merge data into LocalStorage
6. Refresh favorites page
7. Show toast: "12개 항목을 가져왔습니다 (중복 3개 건너뜀)"

*Conflict Handling*:
- **Duplicate Detection**: By `contentId`
- **Resolution Strategy Options**:
  1. **Keep Existing** (기존 항목 유지, default):
     - Skip duplicates, preserve current favorites
     - Keep original `addedAt` timestamp
     - Recommended for safety
  2. **Overwrite** (덮어쓰기):
     - Replace existing with imported data
     - Update with imported `addedAt` timestamp
     - Use when imported data is newer/more important
- **User Choice**: Show dialog if conflicts detected:
  ```
  ┌─────────────────────────────────────────────────┐
  │  중복된 항목 발견                                │
  │  3개 항목이 이미 즐겨찾기에 있습니다             │
  │                                                 │
  │  어떻게 처리할까요?                              │
  │                                                 │
  │  ⦿ 기존 항목 유지 (권장)                        │
  │    현재 저장된 즐겨찾기를 그대로 유지합니다      │
  │                                                 │
  │  ○ 덮어쓰기                                     │
  │    가져온 데이터로 기존 항목을 덮어씁니다        │
  │                                                 │
  │  [취소]                    [가져오기]           │
  └─────────────────────────────────────────────────┘
  ```
- **Default Behavior**: "기존 항목 유지" pre-selected
- **Summary Message**: "총 15개 가져옴, 성공 12개, 중복 3개 건너뜀"

*Import Validation Errors*:
- **Invalid JSON**: "올바르지 않은 파일 형식입니다."
- **Wrong Format**: "Tourism Explorer 형식이 아닙니다."
- **Corrupted Data**: "파일이 손상되었습니다. 다른 파일을 선택해주세요."
- **Empty File**: "빈 파일입니다. 즐겨찾기 항목이 없습니다."
- **Too Large**: "파일이 너무 큽니다 (최대 100개 항목)."

*Post-Import Actions*:
- Auto-sync imported items to current categories
- Show summary: "총 15개 가져옴, 성공 12개, 중복 3개"
- Option to undo import (keep previous state in temp storage for 1 minute)

**Category Management**

*Auto-Categorization*:
- Categories are automatically created based on `contentType`
- No manual category creation needed
- Mapping:
  ```typescript
  const categoryLabels = {
    tourist_attraction: '관광지',
    restaurant: '음식점',
    accommodation: '숙박',
    festival: '행사',
    culture_facility: '문화시설',
    shopping: '쇼핑',
    leisure_sports: '레저/스포츠'
  };
  ```

*Custom Categories (Future Enhancement)*:
- Allow users to create custom tags
- Multi-tag support (one item can have multiple tags)
- Tag management page

#### 2.3.4 Detail Page Specifications

**Content Sections**

*Section Order*:
1. **Hero Section**: Large image carousel + title overlay
2. **Quick Info Bar**: Category badge, rating (future), favorite button, share button
3. **Overview**: Description text (expandable if > 200 chars)
4. **Key Information**: Icons + text for address, phone, hours, fees
5. **Image Gallery**: Grid of all images (lightbox on click)
6. **Map Section**: Embedded map with single marker
7. **Similar Locations**: Carousel of 6 related places
8. **User Reviews** (Future): Review cards

*Responsive Behavior*:
- **Desktop**: 2-column layout (content left 70%, info right 30%)
- **Tablet**: 1-column layout, info sections stacked
- **Mobile**: 1-column, compact spacing

**Share Functionality**

*Share Options*:
- **Native Web Share API** (Mobile):
  ```typescript
  if (navigator.share) {
    navigator.share({
      title: location.title,
      text: location.description,
      url: window.location.href
    });
  }
  ```
- **Fallback Share Menu** (Desktop):
  - Copy Link (copies to clipboard)
  - Share to KakaoTalk (Kakao SDK)
  - Share to Facebook
  - Share to Twitter
  - Share via Email

*Share Link Format*:
```
https://tourism-explorer.com/attractions/123456?utm_source=share
```

*Copy Link Toast*:
- "링크가 복사되었습니다" (with checkmark icon)
- Auto-dismiss after 2 seconds

## 3. User Flows & Screen Definitions

This section documents end-to-end user journeys through the application, including wireframes, screen transitions, and interaction patterns across different devices.

### 3.1 Primary User Flows

#### Flow 1: Search to Detail View

**Desktop Flow**:
```
[Homepage] → [Search Results] → [Detail Page]
```

**Step-by-Step (Desktop)**:

1. **Homepage** (`/`)
   - User lands on homepage
   - Sees hero section with search bar
   - Featured destinations carousel below
   - **Action**: User enters "Busan beach" in search box
   - **Transition**: Form submit or Enter key press

2. **Search Results Page** (`/search?keyword=Busan+beach&contentType=12`)
   - URL updates with query params
   - Loading skeleton appears (6 card skeletons)
   - API call to `/api/tour/search`
   - **Results Load**: 18 results found
   - **Display**: 3-column grid of location cards
   - **Filters**: Left sidebar (sticky) with content type, region filters
   - **Map Toggle**: "Show Map" button in top-right
   - **Action**: User clicks on "Haeundae Beach" card

3. **Detail Page** (`/attractions/264553`)
   - New page loads (or client-side navigation)
   - Hero image carousel at top
   - Breadcrumb: Home > Search > Haeundae Beach
   - Title, category badge, rating, favorite + share buttons
   - **Content Sections**: Overview, info, gallery, map, similar places
   - **Sticky Right Sidebar** (desktop only): Quick info card with CTA buttons
   - **Action**: User clicks "Add to Favorites" heart icon
   - **Feedback**: Heart fills with animation, toast appears

**Mobile Flow**:
```
[Homepage] → [Search Results] → [Detail Page]
   (mobile)      (infinite scroll)    (full-width)
```

**Step-by-Step (Mobile)**:

1. **Homepage** (`/`) - Mobile
   - Full-width hero image
   - Search bar sticky at top after scroll
   - Bottom navigation: [Home] [Search] [Favorites] [More]
   - **Action**: User taps search bar
   - **Transition**: Search bar expands to full-screen overlay

2. **Search Overlay** (Mobile)
   - Full-screen modal with search input at top
   - Recent searches below (last 5)
   - Popular keywords as chips
   - **Action**: User types "Busan"
   - **Real-time**: Suggestions appear (debounced 300ms)
   - **Action**: User taps "Busan restaurants" suggestion

3. **Search Results** (`/search?keyword=Busan+restaurants`)
   - Back to main screen, search overlay closes
   - **Filter Bar**: Horizontal scrollable chips (All, Food, Hotels, etc.)
   - **Results**: Single-column cards (full width)
   - **Infinite Scroll**: Loads next 20 on scroll to bottom
   - **Action**: User taps "Map View" button in header

4. **Map View** (Modal Overlay)
   - Full-screen map modal slides up from bottom
   - Markers clustered on map
   - **Action**: User taps a marker
   - **Info Window**: Bottom sheet slides up (40% screen height)
   - **Content**: Thumbnail, title, address, "View Details" button
   - **Action**: User taps "View Details"

5. **Detail Page** (`/restaurants/123456`) - Mobile
   - Full-screen page
   - Image carousel (swipeable)
   - Content sections stacked vertically
   - **Floating Action Button**: Heart icon (bottom-right)
   - **Bottom Bar**: [Directions] [Call] [Share] buttons
   - **Back Button**: Top-left arrow
   - **Action**: User taps heart FAB
   - **Feedback**: Heart animates, toast: "Added to favorites"

**Wireframe: Search Results (Desktop)**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]    [Search Box...]          [Login]  [Favorites]    │ ← Header
├──────────┬──────────────────────────────────────────────────┤
│  FILTERS │  [Sort: Relevance ▼]  [List View] [Map View]     │
│          ├──────────────────────────────────────────────────┤
│  Content │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  Type:   │  │   Card   │ │   Card   │ │   Card   │         │
│  ☑ All   │  │  ❤️      │ │  ❤️      │ │  ❤️      │         │
│  ☐ Food  │  └──────────┘ └──────────┘ └──────────┘         │
│  ☐ Hotels│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│          │  │   Card   │ │   Card   │ │   Card   │         │
│  Region: │  └──────────┘ └──────────┘ └──────────┘         │
│  [All ▼] │                                                   │
│          │  [1] [2] [3] ... [10]  Next →                    │
│  [Reset] │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

**Wireframe: Search Results (Mobile)**:
```
┌────────────────────┐
│  ☰  [Search... 🔍] │ ← Header
├────────────────────┤
│ All 〰 Food 〰Hotels│ ← Filter chips (scrollable)
├────────────────────┤
│ ┌────────────────┐ │
│ │   Full Card    │ │
│ │   [Image]      │ │
│ │   Title      ❤️│ │
│ │   Address      │ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │   Full Card    │ │
│ └────────────────┘ │
│                    │
│ [Loading more...]  │ ← Infinite scroll
├────────────────────┤
│ 🏠 🔍 ❤️ ⋯        │ ← Bottom nav
└────────────────────┘
```

#### Flow 2: Map Exploration to Detail

**Desktop Flow (Split View)**:
```
[Search Results] → [Toggle Split View] → [Click Marker] → [Detail Page]
```

**Step-by-Step**:

1. **Search Results** - List View
   - User sees 20 results in grid
   - **Action**: User clicks "Map View" button

2. **Map View Toggle**
   - View changes to split screen:
     - Left (60%): List view (scrollable)
     - Right (40%): Map with markers
   - Markers loaded for visible results
   - Clustering active (if >50 markers)

3. **Map Interaction**
   - **Hover over Marker** (desktop):
     - Marker grows 1.2x
     - Tooltip shows location name
     - Corresponding card in list highlights (border glow)
   - **Click Marker**:
     - Info window appears on map
     - Card in list auto-scrolls into view
     - Card highlights with pulse animation

4. **Info Window**
   - Shows: thumbnail, title, category, address, distance
   - **Actions**:
     - [View Details] button
     - [Directions] link
     - [❤️] favorite toggle
   - **Click "View Details"**

5. **Detail Page**
   - Opens in same tab (or new tab if Ctrl+Click)
   - Back button returns to search with same filters/view

**Mobile Flow**:
```
[List View] → [Map View with Bottom Sheet] → [Search/Browse] → [Detail]
```

**Step-by-Step (Mobile)**:

1. **List View**
   - Results in single column
   - **Action**: Tap "지도" icon in header

2. **Map View Loads**
   - Full-screen map appears
   - **Top**: Floating search bar with current query
   - **Bottom**: Bottom sheet in Collapsed state (20% screen)
   - Markers rendered for all search results (clustered if >30)
   - Bottom sheet shows top 2 result cards

3. **Interact with Map**
   - **Option A - Search from Map**:
     - Tap search bar → Search overlay expands
     - Type new query → Map markers update instantly
     - Bottom sheet refreshes with new results

   - **Option B - Browse via Markers**:
     - Tap marker → Bottom sheet expands to Half-Open (50%)
     - Scrolls to corresponding card automatically
     - Card highlights with blue border glow

   - **Option C - Browse via Bottom Sheet**:
     - Swipe up bottom sheet → Expands to Half-Open or Full
     - Scroll through result cards
     - Tap 📍 icon on card → Map centers on location

4. **Select Location**
   - **From Bottom Sheet**: Tap card → Navigate to detail page
   - **From Map**: Tap marker → Bottom sheet shows card → Tap card → Detail page

5. **Return to List**
   - Tap "[목록 보기]" button in bottom sheet header
   - Map view closes, returns to original list view

**Wireframe: Split View (Desktop)**:
```
┌───────────────────────────────┬─────────────────────────┐
│  [Results: 18]  [Split View▼] │  [Map Type: Default ▼]  │
├───────────────────────────────┼─────────────────────────┤
│  ┌─────────────────────────┐  │                         │
│  │  Card (Highlighted)     │←─┼─[Marker Selected]      │
│  │  ❤️  [Show on Map]      │  │    ║                    │
│  └─────────────────────────┘  │    ▼                    │
│  ┌─────────────────────────┐  │  ┌────┐  📍           │
│  │  Card                   │  │  │Info│  📍 📍        │
│  └─────────────────────────┘  │  │Win.│     📍        │
│  ┌─────────────────────────┐  │  └────┘  Cluster(5)   │
│  │  Card                   │  │                         │
│  └─────────────────────────┘  │     📍         📍      │
│                               │                         │
│  ↓ Scroll for more            │  [+] [-] [⊙] [⛶]       │
└───────────────────────────────┴─────────────────────────┘
```

**Wireframe: Map View + Bottom Sheet (Mobile)**:

*State 1: Collapsed Bottom Sheet (20%)*:
```
┌────────────────────────┐
│ [🔍 부산 맛집      ✕] │ ← Floating search bar
│                        │
│        📍             │
│   📍      📍          │ ← Full-screen map
│      Cluster(8)        │
│   📍      📍          │
│                        │
├────────────────────────┤
│ ▬▬▬                   │ ← Swipe handle
│ 검색결과 18개   [목록] │ ← Bottom sheet header
│ ┌────────────────────┐│
│ │[📷] 해운대 맛집  ❤️││ ← Top 2 cards visible
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │[📷] 광안리 카페  ❤️││
└────────────────────────┘
```

*State 2: Half-Open Bottom Sheet (50%)*:
```
┌────────────────────────┐
│ [🔍 부산 맛집      ✕] │ ← Search bar
│        📍             │
│   📍  ⭐ 📍          │ ← Map (less visible)
├────────────────────────┤
│ ▬▬▬                   │
│ 검색결과 18개   [목록] │
│ ┌────────────────────┐│
│ │[📷] 해운대 맛집  ❤️││
│ │ ⭐⭐⭐⭐ 4.5      ││ ← ~6 cards visible
│ │ 📍 해운대구 중동   ││
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │[📷] 광안리 카페  ❤️││
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │[📷] 자갈치시장   ❤️││
│ └────────────────────┘│
│ ↓ Scroll for more     │
└────────────────────────┘
```

*State 3: Fully Extended (80%)*:
```
┌────────────────────────┐
│ [🔍 부산 맛집      ✕] │ ← Search bar (small)
├────────────────────────┤
│ ▬▬▬                   │
│ 검색결과 18개   [목록] │
│ ┌────────────────────┐│
│ │[📷] 해운대 맛집  ❤️││
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │[📷] 광안리 카페  ❤️││
│ └────────────────────┘│ ← Full results list
│ ┌────────────────────┐│   scrollable
│ │[📷] 자갈치시장   ❤️││
│ └────────────────────┘│
│ ┌────────────────────┐│
│ │[📷] 송정 횟집    ❤️││
│ └────────────────────┘│
│ ↓ Scroll (18 items)   │
└────────────────────────┘
```

#### Flow 3: Favorites Management

**Add to Favorites Flow**:
```
[Any Page with ❤️] → [Tap Heart] → [Favorites Page]
```

**Step-by-Step**:

1. **User Browses** (Search/Detail page)
   - Sees location they like
   - **Action**: Click/tap heart icon

2. **Heart Animation**
   - Icon scales up 1.3x → down to 1.0x (300ms)
   - Outline heart → Filled heart (red)
   - Particles burst effect (optional delight)
   - **Toast**: "Added to favorites" (bottom-center, 2s)

3. **Navigate to Favorites**
   - User clicks "Favorites" in navigation
   - `/favorites` page loads

4. **Favorites Page View**
   - **Header**: "My Favorites (12)" + [Export ▼] dropdown
   - **Category Tabs**: [All (12)] [Attractions (5)] [Food (4)] [Hotels (3)]
   - **Grid Layout**: 3 columns (desktop), 1 column (mobile)
   - Each card has remove (X) button on hover

**Remove from Favorites Flow**:
```
[Favorites Page] → [Click ❤️ or X] → [Item Removed]
```

**Step-by-Step**:

1. **Favorites Page**
   - User sees all favorites
   - **Action**: Hover over card (desktop)
   - **Hover State**: Card elevates, X button appears top-right

2. **Click Remove**
   - **Action**: Click X or click filled heart icon
   - **Confirmation**: None (optimistic delete)
   - **Animation**: Card fades out + shrinks (400ms)
   - **Layout**: Other cards shift up to fill space
   - **Toast**: "Removed from favorites" + [Undo] button

3. **Undo Action** (5-second window)
   - If user clicks [Undo] in toast:
     - Item re-appears with fade-in animation
     - LocalStorage restored
     - Toast: "Undone"

**Export/Import Flow**:
```
[Favorites Page] → [Export] → [Download JSON]
                 → [Import] → [Upload JSON] → [Merge/Conflicts]
```

**Export Step-by-Step**:

1. **Favorites Page**
   - **Action**: Click [Export ▼] dropdown
   - **Options**:
     - Export All (JSON)
     - Export Selected (future)

2. **Click "Export All"**
   - **Process**: Generate JSON file
   - **Filename**: `tourism_favorites_20251110_143022.json`
   - **Browser**: Download dialog appears
   - **Toast**: "Exported 12 items"

**Import Step-by-Step**:

1. **Favorites Page**
   - **Action**: Click [Import] in header

2. **File Picker**
   - Browser file input opens
   - **File Type**: Only `.json` accepted
   - **User**: Selects exported JSON file

3. **Validation**
   - Parse JSON
   - Validate structure
   - Check for duplicates

4. **Conflict Resolution Dialog** (if duplicates found)
   ```
   ┌─────────────────────────────────────────────────┐
   │  중복된 항목 발견                                │
   │  3개 항목이 이미 즐겨찾기에 있습니다             │
   │                                                 │
   │  어떻게 처리할까요?                              │
   │                                                 │
   │  ⦿ 기존 항목 유지 (권장)                        │
   │    현재 저장된 즐겨찾기를 그대로 유지합니다      │
   │                                                 │
   │  ○ 덮어쓰기                                     │
   │    가져온 데이터로 기존 항목을 덮어씁니다        │
   │                                                 │
   │  [취소]                    [가져오기]           │
   └─────────────────────────────────────────────────┘
   ```
   - **Default**: "기존 항목 유지" pre-selected

5. **Import Complete**
   - Items merged into LocalStorage
   - Page refreshes to show new items
   - **Toast**: "Imported 12 items (3 duplicates skipped)"

**Empty State Flow**:
```
[Favorites Page - No Items] → [Call-to-Action] → [Browse]
```

**Empty State Screen**:
```
┌────────────────────────┐
│   My Favorites (0)     │
├────────────────────────┤
│                        │
│        🤍             │
│                        │
│  No favorites yet      │
│  Start exploring and   │
│  save places you love  │
│                        │
│  [Explore Attractions] │
│  [Find Restaurants]    │
│                        │
└────────────────────────┘
```

**Wireframe: Favorites Page (Desktop)**:
```
┌─────────────────────────────────────────────────────────┐
│  [My Favorites (12)]             [Import] [Export ▼]    │
├─────────────────────────────────────────────────────────┤
│  [All (12)]  [Attractions (5)]  [Food (4)]  [Hotels (3)]│ ← Tabs
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Card    │  │  Card    │  │  Card    │              │
│  │  [Img] X │  │  [Img] X │  │  [Img] X │  ← X on hover│
│  │  Title ❤️│  │  Title ❤️│  │  Title ❤️│              │
│  │  Address │  │  Address │  │  Address │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Card    │  │  Card    │  │  Card    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Exception & Edge Case Flows

#### No Results Flow

**Trigger**: Search/filter returns 0 results

**Display**:
```
┌────────────────────────┐
│  Search: "xyz"         │
│  Filters: Restaurant   │
├────────────────────────┤
│                        │
│     🔍 ❌             │
│                        │
│  No results found for  │
│  "xyz" in Restaurants  │
│                        │
│  Suggestions:          │
│  • Check spelling      │
│  • Try different words │
│  • Remove filters      │
│                        │
│  [Clear Filters]       │
│  [Browse All]          │
│                        │
│  ── OR ──              │
│                        │
│  Popular Destinations: │
│  [Card] [Card] [Card]  │
└────────────────────────┘
```

#### API Error Flow

**Trigger**: Backend API returns 500/503 error

**Display**:
```
┌────────────────────────┐
│                        │
│       ⚠️              │
│                        │
│  Oops! Server Error    │
│  잠시 후 다시 시도해주세요 │
│                        │
│  [Retry] [Go Home]     │
│                        │
│  ── OR ──              │
│                        │
│  View Cached Results?  │
│  (Last updated 5min ago│
│  [Show Cached Results] │
└────────────────────────┘
```

#### Offline Mode Flow

**Trigger**: Network connection lost

**Detection**: `window.addEventListener('offline')`

**Display**:
```
┌────────────────────────┐
│  📶❌  Offline Mode   │ ← Banner
├────────────────────────┤
│  Limited functionality │
│  • View favorites      │
│  • View cached results │
│  • No new searches     │
├────────────────────────┤
│  [Content continues]   │
└────────────────────────┘
```

**Available Features in Offline**:
- ✅ View favorites (from LocalStorage)
- ✅ View previously visited detail pages (if cached)
- ✅ Browse static content
- ❌ New searches
- ❌ Map (unless tiles cached)
- ❌ Real-time data

#### Storage Quota Exceeded

**Trigger**: LocalStorage.setItem() throws `QuotaExceededError`

**Flow**:
1. **Detect Error**: Try-catch around setItem
2. **Show Alert**:
   ```
   ┌────────────────────────────┐
   │  Storage Full              │
   │                            │
   │  Your browser storage is   │
   │  full. Please free up space│
   │                            │
   │  [Export Favorites]        │
   │  [Clear Old Data]          │
   │  [Cancel]                  │
   └────────────────────────────┘
   ```
3. **Options**:
   - Export: Download JSON, then auto-clear
   - Clear: Remove oldest favorites (FIFO)
   - Cancel: Disable add to favorites

### 3.3 Responsive Breakpoints & Behavior

**Breakpoint Definitions**:
```css
/* Mobile First Approach */
$mobile: 0px;           /* 0 - 767px */
$tablet: 768px;         /* 768px - 1023px */
$desktop: 1024px;       /* 1024px - 1439px */
$wide: 1440px;          /* 1440px+ */
```

**Component Behavior by Breakpoint**:

| Component | Mobile (< 768px) | Tablet (768-1023px) | Desktop (1024px+) |
|-----------|------------------|---------------------|-------------------|
| **Navigation** | Bottom nav (4 icons) | Top horizontal nav | Top horizontal nav |
| **Search Bar** | Full-width, expandable | Top bar, fixed width | Top bar with filters |
| **Results Grid** | 1 column | 2 columns | 3 columns |
| **Pagination** | Infinite scroll | Pagination (Prev/Next) | Pagination (full) |
| **Filters** | Horizontal chips (scrollable) | Left sidebar (collapsible) | Left sidebar (fixed) |
| **Map View** | Full-screen modal | Split view (50/50) | Split view (60/40) |
| **Detail Layout** | Single column stack | Single column | 2-column (70/30) |
| **Image Gallery** | Swipeable carousel | Grid (2 cols) | Grid (3 cols) |
| **Cards** | Full width | 48% width | 32% width |
| **Typography** | 14px base | 15px base | 16px base |
| **Touch Targets** | Min 44x44px | Min 40x40px | Mouse-optimized |

**Navigation Behavior**:

*Mobile (< 768px)*:
```
┌────────────────────┐
│  ☰  Logo    [🔍❤️]│ ← Top bar (hamburger + logo + icons)
├────────────────────┤
│                    │
│  [Content Area]    │
│                    │
├────────────────────┤
│ 🏠  🔍  ❤️  ⋯     │ ← Bottom nav (sticky)
└────────────────────┘
```

Bottom Nav Icons:
- 🏠 Home
- 🔍 Search
- ❤️ Favorites
- ⋯ More (hamburger menu)

*Tablet (768-1023px)*:
```
┌─────────────────────────────────┐
│ [Logo] [Home] [Search] [Favs] [Login] │ ← Top nav
├─────────────────────────────────┤
│                                 │
│  [Content Area]                 │
│                                 │
└─────────────────────────────────┘
```

*Desktop (1024px+)*:
```
┌──────────────────────────────────────────────┐
│ [Logo]  [Home] [Explore] [Favorites] [About] │ ← Top nav
│                        [Search...] [Login]   │
├──────────────────────────────────────────────┤
│                                              │
│  [Content Area]                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Filter Panel Behavior**:

*Mobile*: Horizontal scrolling chips
```
┌──────────────────────────┐
│ [All] [Food] [Hotel]  →  │ ← Swipe to scroll
├──────────────────────────┤
│ [Seoul ▼] [Sort ▼]       │ ← Dropdowns
└──────────────────────────┘
```

*Tablet*: Collapsible sidebar
```
┌─────┬─────────────┐
│ ▶   │  Results    │ ← Collapsed by default
│ F   │             │
│ i   │             │
│ l   │             │
│ t   │             │
│ e   │             │
│ r   │             │
│ s   │             │
└─────┴─────────────┘

Click ▶ to expand:
┌────────┬──────────┐
│ Filters│ Results  │
│ [...]  │          │
│ [...]  │          │
└────────┴──────────┘
```

*Desktop*: Fixed sidebar
```
┌─────────┬─────────────────┐
│ FILTERS │   Results       │
│         │                 │
│ Content │                 │
│ Type:   │                 │
│ ☑ All   │                 │
│ ☐ Food  │                 │
│         │                 │
│ Region: │                 │
│ [All ▼] │                 │
│         │                 │
│ [Reset] │                 │
└─────────┴─────────────────┘
```

**Map View Transitions**:

*Mobile*:
- List View → Tap "Map" → Full-screen modal slides up from bottom (500ms)
- Map View → Tap "X" or swipe down → Modal slides down (300ms)

*Tablet/Desktop*:
- List View → Click "Split View" → Animated width change (400ms)
  - List shrinks from 100% to 60%
  - Map fades in from right (0% → 40%)
- Split View → Click "List Only" → Map fades out, list expands

## 4. Design System & UI Guidelines

This section defines the visual language, component library, and design principles to ensure consistency across the application.

### 4.1 Design Principles

**Core Principles**:

1. **Mobile-First**: Design for small screens first, enhance for larger screens
2. **Content-First**: Prioritize information over decoration
3. **Accessible by Default**: WCAG 2.1 AA compliance in all components
4. **Performance-Conscious**: Lightweight components, optimized images
5. **Culturally Appropriate**: Korean language primary, localization-ready

**Design Philosophy**:
- **Clear Hierarchy**: Use size, weight, and color to guide attention
- **Generous Whitespace**: Improve readability and reduce cognitive load
- **Consistent Patterns**: Reuse components and interactions
- **Progressive Disclosure**: Show essential info first, details on demand
- **Delightful Micro-interactions**: Subtle animations for feedback

### 4.2 Color System

**Primary Palette**:
```css
/* Brand Colors */
--color-primary-50:  #E3F2FD;   /* Lightest blue */
--color-primary-100: #BBDEFB;
--color-primary-200: #90CAF9;
--color-primary-300: #64B5F6;
--color-primary-400: #42A5F5;
--color-primary-500: #2196F3;   /* Primary brand */
--color-primary-600: #1E88E5;
--color-primary-700: #1976D2;
--color-primary-800: #1565C0;
--color-primary-900: #0D47A1;   /* Darkest blue */

/* Accent Colors */
--color-accent-50:  #FFF3E0;
--color-accent-500: #FF9800;    /* Accent orange */
--color-accent-700: #F57C00;

/* Semantic Colors */
--color-success: #4CAF50;       /* Green for success */
--color-warning: #FFC107;       /* Yellow for warnings */
--color-error:   #F44336;       /* Red for errors */
--color-info:    #2196F3;       /* Blue for info */

/* Neutrals (Grays) */
--color-gray-50:  #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;
--color-gray-900: #212121;

/* Special */
--color-white: #FFFFFF;
--color-black: #000000;
--color-favorite: #E91E63;      /* Pink for favorites */
```

**Usage Guidelines**:
- **Primary**: Main CTAs, links, selected states
- **Accent**: Secondary actions, highlights
- **Semantic**: Alerts, notifications, status indicators
- **Grays**: Text, borders, backgrounds
- **Favorite**: Heart icon fill color

**Category Colors** (for markers, badges):
```css
--color-attraction: #2196F3;    /* Blue */
--color-restaurant: #F44336;    /* Red */
--color-accommodation: #9C27B0; /* Purple */
--color-festival: #FFC107;      /* Yellow */
--color-culture: #4CAF50;       /* Green */
--color-shopping: #FF9800;      /* Orange */
--color-leisure: #00BCD4;       /* Cyan */
```

**Dark Mode** (Future Enhancement):
```css
/* Auto-generated using color.alpha() for dark theme */
[data-theme="dark"] {
  --bg-primary: #121212;
  --bg-secondary: #1E1E1E;
  --text-primary: #FFFFFF;
  --text-secondary: #B3B3B3;
}
```

### 4.3 Typography

**Font Stack**:
```css
/* Primary Font (Korean + Latin) */
--font-primary:
  'Pretendard', /* Modern Korean sans-serif */
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Roboto',
  sans-serif;

/* Monospace (for code, IDs) */
--font-mono:
  'Fira Code',
  'Consolas',
  'Monaco',
  monospace;
```

**Type Scale** (Major Third - 1.25 ratio):
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px - body default */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

**Font Weights**:
```css
--font-light:   300;
--font-regular: 400;
--font-medium:  500;
--font-semibold:600;
--font-bold:    700;
```

**Line Heights**:
```css
--leading-tight:  1.25;   /* Headings */
--leading-normal: 1.5;    /* Body */
--leading-relaxed:1.75;   /* Long-form */
```

**Text Styles**:

*Headings*:
```css
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}
h2 { font-size: var(--text-3xl); font-weight: var(--font-semibold); }
h3 { font-size: var(--text-2xl); font-weight: var(--font-semibold); }
h4 { font-size: var(--text-xl); font-weight: var(--font-medium); }
```

*Body*:
```css
body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-gray-800);
}

.text-small { font-size: var(--text-sm); }
.text-large { font-size: var(--text-lg); }
```

*Links*:
```css
a {
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color 150ms ease;
}
a:hover { color: var(--color-primary-700); text-decoration: underline; }
a:focus { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
```

### 4.4 Spacing System

**Scale** (Based on 4px grid):
```css
--space-1:  0.25rem;  /*  4px */
--space-2:  0.5rem;   /*  8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px - base unit */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

**Component Spacing**:
- **Cards**: Padding `--space-4` (mobile), `--space-6` (desktop)
- **Sections**: Margin bottom `--space-8` (mobile), `--space-12` (desktop)
- **Form Elements**: Gap `--space-3` between label and input
- **Button Padding**: `--space-3` (y) × `--space-6` (x)
- **Container Max Width**: `1280px`
- **Gutter**: `--space-4` (mobile), `--space-6` (tablet), `--space-8` (desktop)

### 4.5 Component Library

#### Button Component

**Variants**:
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  children: ReactNode;
}
```

**Styles**:

*Primary Button*:
```css
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-weight: var(--font-medium);
  transition: all 150ms ease;
}
.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}
.btn-primary:active {
  transform: translateY(0);
}
```

*Secondary Button*:
```css
.btn-secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-800);
  /* ... similar structure */
}
```

*Sizes*:
```css
.btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
.btn-md { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
.btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }
```

**Loading State**:
```tsx
<button className="btn-primary" disabled>
  <span className="spinner" /> Loading...
</button>
```

#### Card Component

**Structure**:
```typescript
interface CardProps {
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: { text: string; color: string };
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}
```

**Styles**:
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 200ms ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transform: translateY(-4px);
}

.card-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.card-content {
  padding: var(--space-4);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
}
```

#### Input Component

**Structure**:
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'tel' | 'number';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  disabled?: boolean;
}
```

**Styles**:
```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
}

.input-field {
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: var(--text-base);
  transition: border-color 150ms ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.input-field.error {
  border-color: var(--color-error);
}

.input-error-text {
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

#### Badge Component

```typescript
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: 9999px;  /* Pill shape */
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.badge-default { background: var(--color-gray-100); color: var(--color-gray-700); }
.badge-success { background: #E8F5E9; color: #2E7D32; }
.badge-warning { background: #FFF3E0; color: #E65100; }
.badge-error { background: #FFEBEE; color: #C62828; }
```

### 4.6 Iconography

**Icon Library**: Lucide React (https://lucide.dev/)

**Icon Sizes**:
```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;
```

**Common Icons**:
```typescript
import {
  Search,          // Search input
  MapPin,          // Location marker
  Heart,           // Favorites
  Share2,          // Share button
  Filter,          // Filter panel
  X,               // Close/remove
  ChevronDown,     // Dropdowns
  ChevronLeft,     // Back navigation
  ChevronRight,    // Forward navigation
  Star,            // Ratings
  Phone,           // Contact
  Clock,           // Operating hours
  DollarSign,      // Pricing
  Navigation,      // Directions
  Upload,          // Import
  Download,        // Export
  Menu,            // Hamburger menu
  Grid,            // Grid view
  List,            // List view
  Map              // Map view
} from 'lucide-react';
```

**Icon Usage**:
```tsx
<Search className="icon-md text-gray-600" />
<Heart className="icon-lg text-favorite" fill="currentColor" />
```

### 4.7 Animation & Transitions

**Duration Scale**:
```css
--duration-fast:   150ms;  /* Hover states */
--duration-normal: 300ms;  /* Most transitions */
--duration-slow:   500ms;  /* Page transitions */
```

**Easing Functions**:
```css
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**Common Animations**:

*Fade In*:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in { animation: fadeIn var(--duration-normal) var(--ease-out); }
```

*Slide Up*:
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-up { animation: slideUp var(--duration-normal) var(--ease-out); }
```

*Pulse (for hearts)*:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.pulse { animation: pulse 300ms var(--ease-bounce); }
```

**Interaction Feedback**:
- **Click**: Scale down to 0.95 → back to 1.0
- **Hover**: Lift up (translateY(-2px)) + shadow
- **Focus**: 2px outline + 2px offset
- **Loading**: Spinning spinner icon

### 4.8 Elevation (Shadows)

**Shadow Scale**:
```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.06);
--shadow-md:  0 2px 8px rgba(0,0,0,0.08);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
--shadow-xl:  0 16px 48px rgba(0,0,0,0.16);
```

**Usage**:
- **Cards (rest)**: `shadow-md`
- **Cards (hover)**: `shadow-lg`
- **Modals**: `shadow-xl`
- **Dropdowns**: `shadow-lg`
- **Buttons (hover)**: `shadow-md`

### 4.9 Accessibility Guidelines

**Color Contrast**:
- **Normal Text** (< 18px): Minimum 4.5:1 ratio
- **Large Text** (≥ 18px): Minimum 3:1 ratio
- **Interactive Elements**: Minimum 3:1 ratio for borders/icons

**Focus Indicators**:
```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Screen Reader Only** (visually hidden):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

**ARIA Labels**:
```tsx
<button aria-label="Add to favorites">
  <Heart />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<div role="alert" aria-live="polite">
  {toastMessage}
</div>
```

**Keyboard Navigation**:
- Tab order follows visual order
- All interactive elements focusable
- Skip links for main content
- Escape closes modals/dropdowns
- Arrow keys for carousels/menus

### 4.10 Responsive Images

**Image Optimization**:
```tsx
// Use Next.js Image component
<Image
  src={location.imageUrl}
  alt={location.title}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy"
  placeholder="blur"
/>
```

**Aspect Ratios**:
- **Card Thumbnails**: 16:9
- **Hero Images**: 21:9
- **Gallery Images**: Original aspect ratio
- **Map Markers**: 1:1 (square)

**Breakpoint-specific Images**:
```tsx
<picture>
  <source media="(min-width: 1024px)" srcSet={desktopImage} />
  <source media="(min-width: 768px)" srcSet={tabletImage} />
  <img src={mobileImage} alt="..." />
</picture>
```

### 4.11 Loading States

**Skeleton Screens**:
```tsx
<div className="skeleton">
  <div className="skeleton-image" />  {/* Gray rectangle, animated pulse */}
  <div className="skeleton-text" />   {/* 3 lines of varying width */}
  <div className="skeleton-text short" />
</div>
```

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-image {
  background: var(--color-gray-200);
  animation: pulse 2s infinite;
}
```

**Spinners**:
```tsx
<div className="spinner" role="status" aria-label="Loading">
  <span className="sr-only">Loading...</span>
</div>
```

**Progress Indicators**:
- Determinate: Show percentage (e.g., file upload)
- Indeterminate: Spinner for unknown duration

### 4.12 Error States

**Inline Errors** (form validation):
```tsx
<div className="input-wrapper">
  <input className="input-field error" />
  <span className="error-text">
    <AlertCircle className="icon-sm" />
    This field is required
  </span>
</div>
```

**Page-level Errors**:
```tsx
<div className="error-container">
  <AlertTriangle className="icon-xl text-error" />
  <h2>Oops! Something went wrong</h2>
  <p>We're working on it. Please try again later.</p>
  <button onClick={retry}>Retry</button>
</div>
```

**Toast Notifications**:
```tsx
<div className="toast toast-error">
  <X className="icon-sm" />
  <span>Failed to add to favorites</span>
  <button>Dismiss</button>
</div>
```

---

## 5. Architecture & Design

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Next.js Pages│  │  React Query │  │   Zustand    │      │
│  │ (App Router) │  │ (Server State│  │ (Client State│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Server Layer (Next.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            API Routes (Backend Proxy)                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   /api/tour  │  │  /api/search │  │/api/detail│  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│  ┌─────────────────────────┼──────────────────────────────┐ │
│  │          Cache Layer (Redis or In-Memory)             │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────┼────────────────────────────────┐
│                   External Services                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   TourAPI 4.0    │  │  Naver Map API   │                │
│  │ (Korea Tourism)  │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

**Architecture Pattern**: JAMstack + Backend Proxy
- **Frontend**: Next.js 14+ with React Server Components
- **Backend**: Next.js API Routes as proxy layer
- **Deployment**: Vercel (Serverless Functions)
- **CDN**: Automatic via Vercel Edge Network

### 5.2 Component Design

#### 3.2.1 Page Components (App Router)

```
app/
├── layout.tsx              # Root layout with navigation
├── page.tsx                # Homepage with featured content
├── search/
│   └── page.tsx            # Search results page
├── attractions/
│   └── [id]/
│       └── page.tsx        # Attraction detail page
├── restaurants/
│   └── [id]/
│       └── page.tsx        # Restaurant detail page
├── accommodations/
│   └── [id]/
│       └── page.tsx        # Accommodation detail page
├── events/
│   └── [id]/
│       └── page.tsx        # Event detail page
└── favorites/
    └── page.tsx            # User favorites page
```

#### 3.2.2 Feature Components

**SearchBar Component**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
}
```

**FilterPanel Component**
```typescript
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: Category[];
  regions: Region[];
}
```

**LocationCard Component**
```typescript
interface LocationCardProps {
  id: string;
  title: string;
  address: string;
  imageUrl: string;
  category: ContentType;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onCardClick: (id: string) => void;
}
```

**MapView Component**
```typescript
interface MapViewProps {
  locations: Location[];
  center?: Coordinates;
  zoom?: number;
  onMarkerClick: (locationId: string) => void;
  clustered?: boolean;
}
```

**ImageGallery Component**
```typescript
interface ImageGalleryProps {
  images: ImageInfo[];
  alt: string;
  priority?: boolean;
}
```

**DetailView Component**
```typescript
interface DetailViewProps {
  location: LocationDetail;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
}
```

#### 3.2.3 Layout Components

**Navigation Component**
- Desktop: Horizontal navigation bar
- Mobile: Bottom navigation bar + hamburger menu
- Categories: Home, Search, Favorites, About

**Footer Component**
- Links to documentation
- API attribution
- Social media links
- Copyright information

### 5.3 Data Models

#### 3.3.1 Core Data Types

```typescript
// Content Types
type ContentType =
  | 'tourist_attraction'  // 관광지 (12)
  | 'culture_facility'    // 문화시설 (14)
  | 'festival'            // 축제/행사 (15)
  | 'leisure_sports'      // 레포츠 (28)
  | 'accommodation'       // 숙박 (32)
  | 'shopping'            // 쇼핑 (38)
  | 'restaurant';         // 음식점 (39)

// Region Codes (Simplified)
type RegionCode =
  | '1'  // 서울
  | '2'  // 인천
  | '3'  // 대전
  | '4'  // 대구
  | '5'  // 광주
  | '6'  // 부산
  | '7'  // 울산
  | '8'  // 세종
  | '31' // 경기도
  | '32' // 강원도
  | '33' // 충청북도
  | '34' // 충청남도
  | '35' // 경상북도
  | '36' // 경상남도
  | '37' // 전라북도
  | '38' // 전라남도
  | '39'; // 제주도

// Location Base Model
interface Location {
  id: string;              // contentId from API
  title: string;           // 제목
  address: string;         // addr1 (주소)
  addressDetail?: string;  // addr2 (상세주소)
  latitude: number;        // mapy (위도)
  longitude: number;       // mapx (경도)
  thumbnailUrl?: string;   // firstimage (대표이미지)
  contentType: ContentType;// contenttypeid
  areaCode: RegionCode;    // areacode
  tel?: string;            // 전화번호
  zipcode?: string;        // 우편번호
}

// Detailed Location Model
interface LocationDetail extends Location {
  images: ImageInfo[];     // 이미지 목록
  description: string;     // overview (개요)
  homepage?: string;       // homepage
  createdAt: string;       // createdtime
  modifiedAt: string;      // modifiedtime

  // Category-specific fields
  operatingHours?: string;     // (accommodation, restaurant)
  admissionFee?: string;       // (tourist_attraction, culture_facility)
  parking?: string;            // 주차 정보
  amenities?: string[];        // 편의시설
  menu?: string;               // (restaurant) 대표메뉴
  checkInTime?: string;        // (accommodation)
  checkOutTime?: string;       // (accommodation)
  eventStartDate?: string;     // (festival)
  eventEndDate?: string;       // (festival)
}

// Image Information
interface ImageInfo {
  originImgUrl: string;    // 원본 이미지 URL
  smallImageUrl: string;   // 썸네일 이미지 URL
  serialNumber: number;    // 일련번호
}

// Search Filter State
interface FilterState {
  keyword?: string;
  contentType?: ContentType;
  areaCode?: RegionCode;
  sigunguCode?: string;    // 시군구 코드
  category1?: string;      // 대분류
  category2?: string;      // 중분류
  category3?: string;      // 소분류
}

// Search Response
interface SearchResponse {
  items: Location[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
  hasMore: boolean;
}

// Favorites Storage
interface FavoritesData {
  version: string;
  lastUpdated: string;
  favorites: {
    [contentType: string]: string[]; // contentType -> array of contentIds
  };
}

// Map Coordinates
interface Coordinates {
  lat: number;
  lng: number;
}

// Map Marker
interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  contentType: ContentType;
}
```

### 5.4 API Design

#### 3.4.1 Backend Proxy Endpoints

**Base URL**: `/api/tour`

All endpoints return standardized response:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    cached: boolean;
  };
}
```

**GET /api/tour/areas**
- **Purpose**: Get list of available regions
- **Query Params**: None
- **Response**: `APIResponse<Region[]>`
- **Cache**: 24 hours (static data)

```typescript
interface Region {
  code: string;
  name: string;
  nameEn?: string;
}
```

**GET /api/tour/search**
- **Purpose**: Search for locations with filters
- **Query Params**:
  - `keyword` (string, optional): Search keyword
  - `contentType` (string, optional): Content type filter
  - `areaCode` (string, optional): Region code
  - `page` (number, default: 1): Page number
  - `pageSize` (number, default: 20): Items per page
- **Response**: `APIResponse<SearchResponse>`
- **Cache**: 10 minutes per unique query

**GET /api/tour/detail/:contentId**
- **Purpose**: Get detailed information for a specific location
- **Path Params**:
  - `contentId` (string): Content ID
- **Query Params**:
  - `contentType` (string): Content type ID
- **Response**: `APIResponse<LocationDetail>`
- **Cache**: 1 hour

**GET /api/tour/images/:contentId**
- **Purpose**: Get all images for a location
- **Path Params**:
  - `contentId` (string): Content ID
- **Response**: `APIResponse<ImageInfo[]>`
- **Cache**: 1 hour

**GET /api/tour/nearby**
- **Purpose**: Get locations near coordinates
- **Query Params**:
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `radius` (number, default: 5000): Search radius in meters
  - `contentType` (string, optional): Filter by content type
- **Response**: `APIResponse<Location[]>`
- **Cache**: 5 minutes

#### 3.4.2 TourAPI Integration

**Service Key Management**
- Store in `.env.local`: `TOUR_API_SERVICE_KEY`
- Never expose to client
- Request production key for higher rate limits

**API Call Wrapper**
```typescript
async function callTourAPI(
  endpoint: string,
  params: Record<string, any>
): Promise<any> {
  const baseURL = 'http://apis.data.go.kr/B551011/KorService';
  const serviceKey = process.env.TOUR_API_SERVICE_KEY;

  const url = new URL(`${baseURL}${endpoint}`);
  url.searchParams.append('serviceKey', serviceKey);
  url.searchParams.append('MobileOS', 'ETC');
  url.searchParams.append('MobileApp', 'TourismExplorer');
  url.searchParams.append('_type', 'json');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.response.header.resultCode !== '0000') {
    throw new Error(data.response.header.resultMsg);
  }

  return data.response.body;
}
```

**Rate Limiting Strategy**
- Development: 1,000 calls/day
- Implement request queue for fairness
- Cache aggressively to reduce API calls
- Display friendly error messages when limit reached
- Request production key early in development

### 5.5 State Management

#### 3.5.1 Server State (React Query / TanStack Query)

```typescript
// Search Query
const useSearchQuery = (filters: FilterState) => {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => fetchSearchResults(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes (formerly cacheTime)
  });
};

// Detail Query
const useLocationDetail = (contentId: string, contentType: string) => {
  return useQuery({
    queryKey: ['location', contentId, contentType],
    queryFn: () => fetchLocationDetail(contentId, contentType),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Images Query
const useLocationImages = (contentId: string) => {
  return useQuery({
    queryKey: ['images', contentId],
    queryFn: () => fetchLocationImages(contentId),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
```

#### 3.5.2 Client State (Zustand)

```typescript
// Favorites Store
interface FavoritesStore {
  favorites: Set<string>;
  addFavorite: (contentId: string) => void;
  removeFavorite: (contentId: string) => void;
  toggleFavorite: (contentId: string) => void;
  isFavorite: (contentId: string) => boolean;
  clearFavorites: () => void;
  exportFavorites: () => FavoritesData;
  importFavorites: (data: FavoritesData) => void;
}

// UI State Store
interface UIStore {
  sidebarOpen: boolean;
  mapView: boolean;
  filterPanelOpen: boolean;
  isOffline: boolean;
  toggleSidebar: () => void;
  toggleMapView: () => void;
  toggleFilterPanel: () => void;
  setOfflineMode: (offline: boolean) => void;
}

// Filter Store
interface FilterStore {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: any) => void;
  resetFilters: () => void;
}
```

### 5.6 Caching Strategy

This section defines comprehensive caching and offline support strategies to ensure optimal performance and resilience.

#### 5.6.1 Client-Side Caching

**React Query (TanStack Query) - Server State Cache**

*Storage*: In-memory (RAM)
*Purpose*: Cache API responses for instant navigation and reduced server load

```typescript
// Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000,        // 30 minutes - cache garbage collection
      retry: 2,                       // Retry failed requests twice
      refetchOnWindowFocus: false,   // Don't refetch on tab focus
    },
  },
});
```

*Cached Data Types*:

| Data Type | Stale Time | GC Time | Storage | Max Size |
|-----------|------------|---------|---------|----------|
| Search Results | 5 min | 30 min | In-memory | ~50 queries |
| Location Details | 30 min | 2 hours | In-memory | ~100 items |
| Area Codes | 24 hours | 7 days | In-memory | ~1 KB |
| Categories | 24 hours | 7 days | In-memory | ~5 KB |
| Images Metadata | 1 hour | 4 hours | In-memory | ~200 items |

*Cache Eviction*: Least Recently Used (LRU) when memory limit reached

**LocalStorage - Persistent Data**

*Storage*: Browser LocalStorage (5-10MB limit)
*Purpose*: Persist user data across sessions

```typescript
// LocalStorage usage
interface LocalStorageSchema {
  'tourism_explorer_favorites': FavoritesStorage;      // ~100 items
  'tourism_explorer_search_history': string[];        // Last 10 searches
  'tourism_explorer_preferences': UserPreferences;    // UI settings
  'tourism_explorer_last_location': Coordinates;      // Last viewed location
}
```

*Storage Limits*:
- Favorites: 100 items max (~50 KB)
- Search History: 10 recent searches (~2 KB)
- Preferences: ~1 KB
- Total: ~53 KB (well under 5MB limit)

*Quota Handling*:
```typescript
function safeLocalStorageSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Clear old search history first
      localStorage.removeItem('tourism_explorer_search_history');
      // Retry
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Show user error dialog
        showStorageFullDialog();
      }
    }
  }
}
```

**IndexedDB - Offline Data Cache**

*Storage*: Browser IndexedDB (50MB+ available)
*Purpose*: Store search results and detail pages for offline access

```typescript
// IndexedDB schema
interface OfflineCache {
  searchResults: {
    key: string;           // Query hash
    data: SearchResponse;
    timestamp: number;
    ttl: number;          // 1 hour = 3600000ms
  }[];

  locationDetails: {
    key: string;           // contentId
    data: LocationDetail;
    timestamp: number;
    ttl: number;          // 24 hours
  }[];

  images: {
    url: string;
    blob: Blob;           // Cached image binary
    timestamp: number;
    ttl: number;          // 7 days
  }[];
}
```

*Storage Allocation*:
- Search Results: Max 100 queries (~2 MB)
- Location Details: Max 200 items (~5 MB)
- Images: Max 50 images (~10 MB)
- Total: ~17 MB (leaves room for growth)

*Expiration Check*:
```typescript
async function getCachedData(storeName: string, key: string) {
  const record = await idb.get(storeName, key);
  if (!record) return null;

  const now = Date.now();
  const age = now - record.timestamp;

  if (age > record.ttl) {
    // Expired, remove from cache
    await idb.delete(storeName, key);
    return null;
  }

  return record.data;
}
```

**Cache Storage API (Service Worker)**

*Storage*: Browser Cache Storage (managed by Service Worker)
*Purpose*: Offline page shells, static assets, API responses

```typescript
// Service Worker cache strategy
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        '/favicon.ico',
        // Add critical CSS/JS
      ]);
    })
  );
});

// Fetch strategy - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/tour')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful API responses
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, return cached response
          return caches.match(event.request);
        })
    );
  }
});
```

*Cache Limits*:
- Static Assets: ~5 MB (HTML, CSS, JS, fonts)
- API Responses: ~10 MB (recent searches/details)
- Images: ~30 MB (thumbnails, detail images)
- Total: ~45 MB

#### 5.6.2 Server-Side Caching

**Redis Cache (Production) / In-Memory (MVP)**

*Storage*: Redis server or Node.js in-memory Map
*Purpose*: Reduce TourAPI calls, improve response time

```typescript
// Cache configuration
const cacheConfig = {
  searchResults: {
    ttl: 10 * 60,        // 10 minutes (600s)
    maxSize: 1000,       // Max 1000 unique queries
  },
  locationDetails: {
    ttl: 60 * 60,        // 1 hour (3600s)
    maxSize: 5000,       // Max 5000 locations
  },
  staticData: {
    ttl: 24 * 60 * 60,   // 24 hours (86400s)
    maxSize: 100,        // Area codes, categories
  },
};
```

*Cache Key Strategy*:
```typescript
// Search cache key includes all filters
function getSearchCacheKey(params: SearchParams): string {
  return `search:${params.keyword}:${params.contentType}:${params.areaCode}:${params.page}`;
}

// Detail cache key is simple
function getDetailCacheKey(contentId: string): string {
  return `detail:${contentId}`;
}
```

*Eviction Policy*: TTL-based expiration + LRU for size limits

**Cache Invalidation**:
- Automatic: TTL expiration
- Manual: Admin API endpoint `/api/admin/cache/purge`
- Selective: Purge by pattern (e.g., all search queries for a region)

#### 5.6.3 CDN Caching (Vercel Edge Network)

*Storage*: Vercel's global CDN
*Purpose*: Serve static assets and pages from edge locations

| Asset Type | Cache-Control Header | Max Age | Revalidate |
|------------|---------------------|---------|------------|
| Static Assets (JS/CSS) | `public, max-age=31536000, immutable` | 1 year | No |
| Images (Next/Image) | `public, max-age=31536000, immutable` | 1 year | No |
| HTML Pages | `public, s-maxage=300, stale-while-revalidate=600` | 5 min | 10 min |
| API Routes | `private, no-cache` | None | N/A |
| Fonts | `public, max-age=31536000, immutable` | 1 year | No |

*Edge Caching Strategy*:
- Static files: Hash-based filenames (auto-busting)
- HTML: Short TTL with stale-while-revalidate
- API: No CDN cache (user-specific data)

#### 5.6.4 Offline Support Strategy

**Offline Detection**:
```typescript
// Listen for offline/online events
window.addEventListener('offline', () => {
  // Update Zustand UI store
  useUIStore.getState().setOfflineMode(true);
  showOfflineBanner();
});

window.addEventListener('online', () => {
  // Update Zustand UI store
  useUIStore.getState().setOfflineMode(false);
  hideOfflineBanner();
  // Retry pending requests
  queryClient.refetchQueries();
});

// Zustand store implementation example
import { create } from 'zustand';

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  mapView: false,
  filterPanelOpen: false,
  isOffline: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMapView: () => set((state) => ({ mapView: !state.mapView })),
  toggleFilterPanel: () => set((state) => ({ filterPanelOpen: !state.filterPanelOpen })),
  setOfflineMode: (offline) => set({ isOffline: offline }),
}));
```

**Offline Capabilities**:

✅ **Fully Available Offline**:
- View favorites (LocalStorage)
- Browse cached search results (IndexedDB)
- View cached detail pages (IndexedDB)
- View cached images (Cache Storage)
- Navigate between cached pages

❌ **Unavailable Offline**:
- New searches
- Real-time data updates
- Interactive map (unless tiles cached)
- Sharing to social media
- Importing/exporting favorites (requires file system)

**Offline UX**:
```
┌─────────────────────────────────────┐
│  📶❌  You're offline               │ ← Persistent banner
│  Some features are unavailable      │
├─────────────────────────────────────┤
│  ✅ View your favorites             │
│  ✅ Browse recent searches           │
│  ❌ Search new locations            │
│  ❌ View live map                   │
└─────────────────────────────────────┘
```

**Offline Data Freshness**:
- Show "Last updated: 2 hours ago" timestamps
- Display warning for stale data (> 24 hours)
- Auto-sync when connection restored

#### 5.6.5 Cache Performance Monitoring

**Metrics to Track**:
```typescript
interface CacheMetrics {
  reactQuery: {
    hitRate: number;      // % of queries served from cache
    missRate: number;
    avgHitTime: number;   // ms
    avgMissTime: number;
  };

  indexedDB: {
    size: number;         // bytes
    itemCount: number;
    hitRate: number;
  };

  serviceWorker: {
    cacheSize: number;
    apiCacheHits: number;
    apiCacheMisses: number;
  };
}
```

**Target Metrics**:
- React Query Hit Rate: > 70%
- IndexedDB Storage: < 50 MB
- Service Worker Cache: < 100 MB
- Cache Miss API Response: < 500ms
- Cache Hit Response: < 50ms

#### 5.6.6 Cache Debugging Tools

**Development Tools**:
```typescript
// Add to window object in dev mode
if (process.env.NODE_ENV === 'development') {
  (window as any).__DEBUG__ = {
    clearAllCaches: async () => {
      queryClient.clear();
      localStorage.clear();
      await clearIndexedDB();
      await clearServiceWorkerCaches();
    },

    getCacheStats: () => ({
      reactQuery: queryClient.getQueryCache().getAll().length,
      localStorage: Object.keys(localStorage).length,
      // ... other stats
    }),
  };
}
```

**Production Monitoring**:
- Log cache hit/miss to analytics
- Alert if cache hit rate drops below 60%
- Monitor storage quota usage

## 6. Implementation Plan (TDD Approach)

### 6.1 Phase 1: Red (Write Failing Tests)

#### Test Suite 1: API Proxy Layer
```typescript
describe('TourAPI Proxy', () => {
  it('should fetch area codes successfully', async () => {});
  it('should handle API errors gracefully', async () => {});
  it('should cache responses correctly', async () => {});
  it('should rate limit excessive requests', async () => {});
  it('should not expose service key to client', async () => {});
});

describe('Search Endpoint', () => {
  it('should return search results with pagination', async () => {});
  it('should filter by content type', async () => {});
  it('should filter by area code', async () => {});
  it('should handle keyword search', async () => {});
  it('should return empty array for no results', async () => {});
});

describe('Detail Endpoint', () => {
  it('should fetch location detail by ID', async () => {});
  it('should return 404 for invalid ID', async () => {});
  it('should include all required fields', async () => {});
});
```

#### Test Suite 2: Search Functionality
```typescript
describe('SearchBar Component', () => {
  it('should render input field', () => {});
  it('should call onSearch when Enter pressed', () => {});
  it('should show suggestions dropdown', () => {});
  it('should debounce input changes', () => {});
});

describe('FilterPanel Component', () => {
  it('should render all filter options', () => {});
  it('should update filters on selection', () => {});
  it('should reset filters', () => {});
  it('should show active filter count', () => {});
});

describe('useSearchQuery Hook', () => {
  it('should fetch results on mount', () => {});
  it('should refetch when filters change', () => {});
  it('should handle loading state', () => {});
  it('should handle error state', () => {});
});
```

#### Test Suite 3: Favorites Management
```typescript
describe('Favorites Store', () => {
  it('should add item to favorites', () => {});
  it('should remove item from favorites', () => {});
  it('should toggle favorite status', () => {});
  it('should persist to LocalStorage', () => {});
  it('should load from LocalStorage on init', () => {});
  it('should export favorites as JSON', () => {});
  it('should import favorites from JSON', () => {});
});

describe('FavoriteButton Component', () => {
  it('should show filled heart when favorited', () => {});
  it('should show outline heart when not favorited', () => {});
  it('should toggle on click', () => {});
  it('should show animation on toggle', () => {});
});
```

#### Test Suite 4: Map Integration
```typescript
describe('MapView Component', () => {
  it('should render Naver Map', () => {});
  it('should display markers for locations', () => {});
  it('should cluster markers when many exist', () => {});
  it('should show info window on marker click', () => {});
  it('should center map on location', () => {});
});

describe('Map Marker Clustering', () => {
  it('should create clusters when zoom level low', () => {});
  it('should expand clusters on click', () => {});
  it('should show marker count in cluster', () => {});
});
```

#### Test Suite 5: Detail Pages
```typescript
describe('LocationDetail Page', () => {
  it('should fetch and display location data', () => {});
  it('should show image gallery', () => {});
  it('should display all information fields', () => {});
  it('should show favorite button', () => {});
  it('should show share button', () => {});
  it('should show map with single marker', () => {});
});

describe('ImageGallery Component', () => {
  it('should render all images', () => {});
  it('should support swipe on mobile', () => {});
  it('should lazy load images', () => {});
  it('should show lightbox on image click', () => {});
});
```

### 6.2 Phase 2: Green (Implement Minimum Code)

#### Sprint 1: Project Setup & API Proxy (Week 1)

**Day 1-2: Project Initialization**
- [ ] Create Next.js 14 project with TypeScript
- [ ] Set up ESLint and Prettier
- [ ] Configure Tailwind CSS
- [ ] Set up folder structure
- [ ] Install dependencies (React Query, Zustand, etc.)
- [ ] Configure environment variables

**Day 3-4: API Proxy Implementation**
- [ ] Create `/api/tour/areas` endpoint
- [ ] Create `/api/tour/search` endpoint
- [ ] Create `/api/tour/detail/[id]` endpoint
- [ ] Create `/api/tour/images/[id]` endpoint
- [ ] Implement caching layer (in-memory or Redis)
- [ ] Add error handling and logging
- [ ] Write API tests

**Day 5: Testing & Documentation**
- [ ] Test all API endpoints
- [ ] Document API usage
- [ ] Handle edge cases
- [ ] Verify tests pass

#### Sprint 2: Search & Filter (Week 2)

**Day 1-2: Search UI**
- [ ] Create SearchBar component
- [ ] Create FilterPanel component
- [ ] Create LocationCard component
- [ ] Create SearchResults page layout
- [ ] Implement responsive design

**Day 3-4: Search Logic**
- [ ] Set up React Query
- [ ] Implement useSearchQuery hook
- [ ] Connect SearchBar to API
- [ ] Connect FilterPanel to API
- [ ] Implement pagination
- [ ] Add loading skeletons

**Day 5: Testing & Polish**
- [ ] Write component tests
- [ ] Add animations and transitions
- [ ] Optimize performance
- [ ] Verify responsive design

#### Sprint 3: Map Integration (Week 3)

**Day 1-2: Naver Map Setup**
- [ ] Register for Naver Map API key
- [ ] Create MapView component
- [ ] Load Naver Map SDK
- [ ] Display basic map
- [ ] Add custom controls

**Day 3-4: Markers & Clustering**
- [ ] Implement custom markers
- [ ] Add marker clustering
- [ ] Create info windows
- [ ] Handle marker clicks
- [ ] Connect to search results

**Day 5: Testing & Optimization**
- [ ] Test map performance with many markers
- [ ] Optimize clustering algorithm
- [ ] Add loading states
- [ ] Handle map errors gracefully

#### Sprint 4: Detail Pages & Favorites (Week 4)

**Day 1-2: Detail Pages**
- [ ] Create detail page layouts for each content type
- [ ] Implement useLocationDetail hook
- [ ] Create ImageGallery component
- [ ] Add share functionality
- [ ] Add "Show on Map" feature

**Day 3-4: Favorites System**
- [ ] Create Zustand favorites store
- [ ] Implement LocalStorage persistence
- [ ] Create FavoriteButton component
- [ ] Create Favorites page
- [ ] Add export/import functionality

**Day 5: Testing & Polish**
- [ ] Write comprehensive tests
- [ ] Add error boundaries
- [ ] Optimize images
- [ ] Final QA

### 6.3 Phase 3: Refactor

#### Code Quality Improvements
- [ ] Remove code duplication (DRY principle)
- [ ] Extract reusable components
- [ ] Improve TypeScript types (eliminate `any`)
- [ ] Add JSDoc comments for complex functions
- [ ] Organize imports with barrel files

#### Performance Optimization
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize image formats (WebP with fallbacks)
- [ ] Code splitting for routes
- [ ] Lazy load heavy components
- [ ] Optimize bundle size (analyze with webpack-bundle-analyzer)
- [ ] Add performance monitoring

#### Design Pattern Implementation
- [ ] Apply Repository pattern for API calls
- [ ] Use Factory pattern for marker creation
- [ ] Implement Observer pattern for favorites updates
- [ ] Use Adapter pattern for API response transformation

#### Testing & Documentation
- [ ] Achieve 80%+ code coverage
- [ ] Add E2E tests with Playwright
- [ ] Write component Storybook stories
- [ ] Update README with setup instructions
- [ ] Document deployment process

## 7. Testing Strategy

### 7.1 Unit Tests (Jest + React Testing Library)

**Target Coverage**: 80% minimum

**Components to Test**:
- All UI components (SearchBar, FilterPanel, LocationCard, etc.)
- Custom hooks (useSearchQuery, useLocationDetail, etc.)
- Utility functions (formatters, validators, etc.)
- Zustand stores

**Testing Approach**:
```typescript
// Example: SearchBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders input field with placeholder', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onSearch when Enter key pressed', () => {
    const mockSearch = jest.fn();
    render(<SearchBar onSearch={mockSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Seoul' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockSearch).toHaveBeenCalledWith('Seoul');
  });
});
```

### 7.2 Integration Tests

**API Routes Testing**:
```typescript
// Example: search.test.ts
import { GET } from '@/app/api/tour/search/route';

describe('/api/tour/search', () => {
  it('returns search results with valid params', async () => {
    const request = new Request('http://localhost/api/tour/search?keyword=Seoul');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.items)).toBe(true);
  });
});
```

**Component Integration**:
- Test SearchBar + FilterPanel integration
- Test MapView + LocationCard interaction
- Test Detail page data fetching and display

### 7.3 End-to-End Tests (Playwright)

**User Flows to Test**:
1. **Search Flow**
   - User enters keyword
   - Results appear
   - User applies filters
   - Results update accordingly

2. **Detail View Flow**
   - User clicks on location card
   - Detail page loads
   - Images display correctly
   - Map shows location

3. **Favorites Flow**
   - User adds item to favorites
   - Favorite persists on page reload
   - User removes from favorites
   - User exports/imports favorites

4. **Map Interaction Flow**
   - User clicks "Map View"
   - Markers appear on map
   - User clicks marker
   - Info window displays
   - User clicks "View Details"

```typescript
// Example: search-flow.spec.ts
import { test, expect } from '@playwright/test';

test('search and filter flow', async ({ page }) => {
  await page.goto('/');

  // Enter search keyword
  await page.fill('[data-testid="search-input"]', 'Seoul');
  await page.press('[data-testid="search-input"]', 'Enter');

  // Wait for results
  await page.waitForSelector('[data-testid="location-card"]');
  const cards = await page.locator('[data-testid="location-card"]').count();
  expect(cards).toBeGreaterThan(0);

  // Apply filter
  await page.click('[data-testid="filter-attractions"]');
  await page.waitForLoadState('networkidle');

  // Verify filtered results
  const filteredCards = await page.locator('[data-testid="location-card"]');
  expect(filteredCards).toBeVisible();
});
```

### 7.4 Performance Testing

**Lighthouse CI**:
- Automated Lighthouse tests in CI/CD
- Fail build if performance score < 90

**Load Testing**:
- Use Artillery or k6 for load testing
- Simulate 1,000 concurrent users
- Monitor response times and error rates

**Mobile Testing**:
- Test on real devices (iOS Safari, Chrome Mobile)
- Use BrowserStack or Sauce Labs
- Verify touch interactions work correctly

### 7.5 Accessibility Testing

**Tools**:
- axe DevTools
- WAVE browser extension
- Lighthouse accessibility audit

**Manual Testing**:
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification

## 8. Dependencies

### 8.1 Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",

    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",

    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",

    "date-fns": "^3.3.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.356.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",

    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.11",

    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",

    "@playwright/test": "^1.42.0",

    "@tanstack/eslint-plugin-query": "^5.28.0"
  }
}
```

### 8.2 External Services

**Korea Tourism Organization TourAPI 4.0**
- **Purpose**: Tourism data source
- **Rate Limit**: 1,000 calls/day (dev), higher for production
- **Cost**: Free
- **Documentation**: https://api.visitkorea.or.kr/

**Naver Map API**
- **Purpose**: Interactive maps and location visualization
- **Rate Limit**: Check Naver Cloud Platform pricing
- **Cost**: Free tier available, usage-based pricing
- **Documentation**: https://navermaps.github.io/maps.js.ncp/

**Vercel (Deployment)**
- **Purpose**: Hosting and serverless functions
- **Features**: Automatic deployments, CDN, edge functions
- **Cost**: Free tier sufficient for MVP, $20/month Pro tier
- **Documentation**: https://vercel.com/docs

**Optional: Redis (Caching)**
- **Purpose**: Server-side caching for API responses
- **Provider**: Upstash (serverless Redis)
- **Cost**: Free tier: 10,000 commands/day
- **Alternative**: In-memory cache for MVP

### 8.3 Development Tools

- **VSCode Extensions**: ESLint, Prettier, Tailwind CSS IntelliSense
- **Git**: Version control
- **GitHub**: Repository hosting, CI/CD with Actions
- **Postman/Insomnia**: API testing
- **React DevTools**: Component debugging
- **Redux DevTools**: State debugging (for Zustand)

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **TourAPI rate limit exceeded** | High - App becomes unusable | Medium | 1. Implement aggressive caching (10min+ TTL)<br>2. Request production API key early<br>3. Add rate limit monitoring<br>4. Show friendly error messages |
| **Naver Map API costs** | Medium - Unexpected expenses | Low | 1. Monitor API usage dashboard<br>2. Implement map lazy loading<br>3. Use static maps for thumbnails<br>4. Set up billing alerts |
| **Poor mobile performance** | High - Bad UX for primary audience | Medium | 1. Optimize images (WebP, lazy load)<br>2. Code splitting and lazy components<br>3. Virtual scrolling for lists<br>4. Regular Lighthouse audits<br>5. Test on real devices |
| **API response time > 500ms** | Medium - Slow user experience | Medium | 1. Implement server-side caching<br>2. Use CDN for static assets<br>3. Optimize database queries (if used)<br>4. Consider edge functions for global users |
| **LocalStorage data loss** | Low - Users lose favorites | High | 1. Add export/import functionality<br>2. Show warning before clearing browser data<br>3. Consider future backend sync<br>4. Regular auto-export reminders |
| **CORS issues with TourAPI** | High - Cannot fetch data | Low | 1. Backend proxy (already planned)<br>2. Test early in development<br>3. Have backup proxy options |
| **Map clustering performance** | Medium - Laggy map interaction | Low | 1. Use efficient clustering library<br>2. Limit visible markers<br>3. Debounce zoom/pan events<br>4. Profile and optimize |
| **TypeScript compilation errors** | Low - Development friction | Low | 1. Strict TypeScript config<br>2. Regular type checking<br>3. Use `any` only as last resort<br>4. CI/CD type checking |
| **Accessibility compliance** | Medium - Excludes users | Medium | 1. Use semantic HTML<br>2. ARIA labels where needed<br>3. Keyboard navigation testing<br>4. Regular axe audits |
| **Deployment failures** | Medium - Cannot ship updates | Low | 1. Test deployment on preview branch<br>2. Have rollback plan<br>3. Monitor deployment logs<br>4. Gradual rollout if possible |

## 10. Timeline & Milestones

### Week 1: Foundation (Sprint 1)
**Goal**: Project setup and API proxy layer

- [x] TechSpec Review & Approval
- [ ] Create Next.js project with TypeScript
- [ ] Set up development environment
- [ ] Configure ESLint, Prettier, Tailwind
- [ ] Implement API proxy endpoints
- [ ] Write API endpoint tests
- [ ] Document API usage

**Success Criteria**:
- All API endpoints return data successfully
- Tests passing (>80% coverage for API layer)
- Documentation complete

---

### Week 2: Search & Discovery (Sprint 2)
**Goal**: Core search functionality

- [ ] Create search UI components
- [ ] Implement filter panel
- [ ] Set up React Query
- [ ] Connect UI to API
- [ ] Implement pagination
- [ ] Add loading states
- [ ] Write component tests

**Success Criteria**:
- Users can search by keyword
- Filters work correctly
- Results display with pagination
- Loading states feel responsive
- Tests passing

---

### Week 3: Map Integration (Sprint 3)
**Goal**: Interactive map with markers

- [ ] Register Naver Map API
- [ ] Create MapView component
- [ ] Implement marker clustering
- [ ] Add info windows
- [ ] Connect to search results
- [ ] Optimize map performance
- [ ] Write map tests

**Success Criteria**:
- Map displays correctly on all devices
- Markers cluster at low zoom levels
- Info windows show location details
- Map loads without blocking UI
- Performance: FPS > 30 during interactions

---

### Week 4: Details & Favorites (Sprint 4)
**Goal**: Complete user journey

- [ ] Create detail page layouts
- [ ] Implement image galleries
- [ ] Add share functionality
- [ ] Create favorites system
- [ ] Implement LocalStorage persistence
- [ ] Add export/import features
- [ ] Write E2E tests

**Success Criteria**:
- Detail pages show all information
- Images load efficiently
- Favorites persist across sessions
- Export/import works correctly
- E2E tests cover main user flows

---

### Week 5: Polish & Optimization (Refactor Phase)
**Goal**: Production-ready application

- [ ] Refactor code for maintainability
- [ ] Optimize performance (Lighthouse > 90)
- [ ] Add error boundaries
- [ ] Implement Service Worker
- [ ] Accessibility audit (WCAG AA)
- [ ] Security audit
- [ ] Final testing

**Success Criteria**:
- Lighthouse scores: Performance > 90, Accessibility > 95
- No console errors or warnings
- Passes accessibility audit
- All tests passing (>80% coverage)

---

### Week 6: Deployment & Launch
**Goal**: Public release

- [ ] Deploy to Vercel production
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Request TourAPI production key
- [ ] Write deployment documentation
- [ ] Create user guide
- [ ] Submit to portfolio

**Success Criteria**:
- Application live and accessible
- Monitoring in place
- Documentation complete
- Zero critical bugs

---

### Post-Launch: Iteration

**Month 2-3: Feature Enhancements**
- [ ] Add user authentication (optional)
- [ ] Implement reviews/ratings (user-generated)
- [ ] Add route planning between locations
- [ ] Create mobile app (React Native/PWA)
- [ ] Multi-language support (English, Chinese, Japanese)

**Ongoing: Maintenance**
- Monitor API usage and costs
- Fix bugs and improve UX based on feedback
- Keep dependencies updated
- Expand test coverage
- Optimize performance

## 11. Open Questions

### Technical Decisions
- [ ] **Caching Strategy**: Use Redis (Upstash) or in-memory cache for MVP?
  - *Recommendation*: Start with in-memory, migrate to Redis if needed

- [ ] **Image Optimization**: Use Next.js Image component or external CDN?
  - *Recommendation*: Next.js Image for simplicity

- [ ] **Analytics**: Google Analytics or Vercel Analytics?
  - *Recommendation*: Vercel Analytics (privacy-friendly, built-in)

### Business/Product Decisions
- [ ] **Monetization**: Display ads, affiliate links, or keep ad-free?
  - *Status*: TBD - Focus on MVP first

- [ ] **User Accounts**: Add authentication in future?
  - *Status*: Not for MVP, consider post-launch

- [ ] **Mobile App**: PWA or native app (React Native)?
  - *Status*: PWA approach with Next.js

### Integration Questions
- [ ] **Social Sharing**: Which platforms to support? (Facebook, Twitter, KakaoTalk, Line)
  - *Recommendation*: Start with native Web Share API (supports all)

- [ ] **Payment Integration**: For booking features in future?
  - *Status*: Out of scope for MVP

### Performance Targets
- [ ] **Target Load Time**: < 3 seconds acceptable for Korea's network speeds?
  - *Confirmed*: Yes, target LCP < 2.5s

- [ ] **Concurrent Users**: Is 1,000 concurrent users realistic for initial launch?
  - *Confirmed*: Yes, sufficient for MVP

---

## 12. Success Metrics (KPIs)

### Technical Metrics
- **Performance**: Lighthouse score > 90
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% of requests
- **API Cache Hit Rate**: > 70%
- **Test Coverage**: > 80%

### User Engagement Metrics
- **Session Duration**: > 3 minutes average
- **Bounce Rate**: < 40%
- **Pages per Session**: > 3
- **Return Visitors**: > 30% within 30 days

### Business Metrics (Post-Launch)
- **DAU (Daily Active Users)**: Track growth
- **User Retention**: 30-day retention > 20%
- **Feature Usage**: Favorites usage > 40% of users
- **Mobile vs Desktop**: Track device distribution

---

## 13. Appendix

### A. Useful Resources

**TourAPI Documentation**
- Official Docs: https://api.visitkorea.or.kr/
- API Guide: Available after registration
- Support: Customer service at 1577-2111

**Naver Map Documentation**
- JavaScript API: https://navermaps.github.io/maps.js.ncp/
- Examples: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
- GitHub: https://github.com/navermaps/maps.js.ncp

**Next.js Resources**
- Official Docs: https://nextjs.org/docs
- App Router Guide: https://nextjs.org/docs/app
- Performance: https://nextjs.org/docs/app/building-your-application/optimizing

**Testing Resources**
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/
- Jest: https://jestjs.io/

### B. Code Style Guide

**Naming Conventions**
- Components: PascalCase (e.g., `SearchBar.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSearchQuery.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

**File Organization**
```
src/
├── app/              # Next.js pages (App Router)
├── components/       # Reusable components
│   ├── ui/          # Generic UI components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── stores/          # Zustand stores
├── types/           # TypeScript types
└── styles/          # Global styles
```

**Import Order**
1. React and Next.js
2. Third-party libraries
3. Local components
4. Local utilities
5. Types
6. Styles

### C. Deployment Checklist

**Pre-Deployment**
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Lighthouse audit passing
- [ ] Accessibility audit passing

**Deployment**
- [ ] Deploy to Vercel preview
- [ ] Test on preview URL
- [ ] Check all routes work
- [ ] Verify API calls succeed
- [ ] Test on mobile devices
- [ ] Promote to production

**Post-Deployment**
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Verify API usage
- [ ] Test all critical paths
- [ ] Update documentation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Author**: Tourism Explorer Development Team
**Status**: Ready for Implementation
**Next Review Date**: After Sprint 1 completion
