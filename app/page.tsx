'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/models/location';
import { seedLocations } from '@/lib/models/seed-data';
import { SearchBar } from '@/components/search/SearchBar';

const NaverMap = dynamic(
  () => import('@/components/map/NaverMap').then(mod => ({ default: mod.NaverMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <p className="text-gray-500">지도 로딩 중...</p>
      </div>
    )
  }
);

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async (keyword: string) => {
    if (!keyword.trim()) {
      setLocations(seedLocations);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        keyword: keyword.trim(),
        numOfRows: '20',
        arrange: 'A', // 제목순 (가나다순)
      });

      const response = await fetch(`/api/tour/search?${params}`);

      if (!response.ok) {
        throw new Error('검색에 실패했습니다');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setLocations(data.items);
      } else {
        setLocations([]);
        setError('검색 결과가 없습니다');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다');
      setLocations([]); // 에러시 빈 배열로 설정
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    fetchLocations(query);
  };

  const handleNearbySearch = (nearbyLocations: Location[]) => {
    setLocations(nearbyLocations);
    setIsLoading(false);
  };

  const handleMapMove = async (center: { lat: number; lng: number }, radius: number) => {
    // 지도 이동 시 보이는 영역(bounds) 기준으로 주변 검색
    try {
      const params = new URLSearchParams({
        mapX: center.lng.toString(),
        mapY: center.lat.toString(),
        radius: Math.min(radius, 20000).toString(), // 최대 20km
        numOfRows: '100',
      });

      const response = await fetch(`/api/tour/nearby?${params}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.data?.items) {
        setLocations(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Fullscreen Map */}
      <div className="absolute inset-0">
        <NaverMap
          locations={locations}
          center={{ lat: 37.5665, lng: 126.9780 }}
          zoom={16}
          onMarkerClick={setSelectedLocation}
          onNearbySearch={handleNearbySearch}
          onMapMove={handleMapMove}
          isLoading={isLoading}
          className="h-full w-full rounded-none"
        />
      </div>

      {/* Floating Search Bar */}
      <div className="absolute left-0 right-0 top-0 z-30 p-4">
        <div className="mx-auto max-w-2xl">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
    </main>
  );
}
