# Task J: Location Detail Page (TDD)

**Phase**: 4 | **Time**: 3.5h | **Agent**: frontend-ui-specialist
**Dependencies**: Task G, E | **EST**: 11.5h | **Slack**: 3.5h

## Objective
Create detail page with hero image, info sections, gallery, and share functionality.

---

## 🔴 RED (45min)

```typescript
// app/attractions/[id]/__tests__/page.test.tsx
describe('Location Detail Page', () => {
  it('should display location details', async () => {
    const mockLocation = {
      contentId: '123',
      title: 'Test Location',
      address: 'Seoul',
      overview: 'Description',
    };

    render(<DetailPage params={{ id: '123' }} />);

    await waitFor(() => {
      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('Seoul')).toBeInTheDocument();
    });
  });

  it('should handle share functionality', async () => {
    const mockShare = vi.fn();
    global.navigator.share = mockShare;

    render(<DetailPage params={{ id: '123' }} />);

    const shareButton = screen.getByLabelText(/share/i);
    fireEvent.click(shareButton);

    expect(mockShare).toHaveBeenCalled();
  });
});
```

---

## 🟢 GREEN (2h)

```typescript
// app/attractions/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { ImageGallery } from '@/components/detail/ImageGallery';
import { ShareButton } from '@/components/detail/ShareButton';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

async function getLocation(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tour/detail/${id}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const location = await getLocation(params.id);

  if (!location) notFound();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96">
        {location.firstImage && (
          <img
            src={location.firstImage}
            alt={location.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">{location.title}</h1>
          <p className="text-lg opacity-90">{location.address}</p>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <FavoriteButton location={location} />
          <ShareButton location={location} />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {location.overview && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">소개</h2>
                <p className="text-gray-700 leading-relaxed">{location.overview}</p>
              </section>
            )}

            {/* Image Gallery */}
            {location.images?.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">갤러리</h2>
                <ImageGallery images={location.images} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-white rounded-lg shadow-md p-6 space-y-4">
              <h3 className="font-semibold text-lg">정보</h3>

              {location.tel && (
                <div>
                  <p className="text-sm text-gray-600">전화</p>
                  <a href={`tel:${location.tel}`} className="text-primary-600">
                    {location.tel}
                  </a>
                </div>
              )}

              {location.address && (
                <div>
                  <p className="text-sm text-gray-600">주소</p>
                  <p className="text-gray-800">{location.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔵 REFACTOR (45min)

```typescript
// components/detail/ShareButton.tsx
'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Location } from '@/lib/models/location';

export const ShareButton: React.FC<{ location: Location }> = ({ location }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: location.title,
          text: location.overview?.slice(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다');
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleShare}>
      <Share2 className="w-4 h-4" />
    </Button>
  );
};
```

## Success Criteria
- [x] Hero section with image
- [x] Info sections layout
- [x] Image gallery
- [x] Share functionality
- [x] Responsive design
- [x] Tests passing ✅
