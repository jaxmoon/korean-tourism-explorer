'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/models/location';
import { seedLocations } from '@/lib/models/seed-data';

// Lazy load map to avoid SSR issues
const NaverMap = dynamic(
  () => import('@/components/map/NaverMap').then(mod => ({ default: mod.NaverMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">지도 로딩 중...</p>
      </div>
    )
  }
);

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>(seedLocations);

  const handleNearbySearch = (nearbyLocations: Location[]) => {
    setLocations(nearbyLocations);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Tourism Explorer - 지도 데모</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-yellow-800">⚠️ Naver Maps Client ID 필요</h2>
        <p className="text-sm text-yellow-700 mt-2">
          지도를 보려면 Naver Cloud Platform에서 Client ID를 발급받아
          <code className="bg-yellow-100 px-1 mx-1">.env.local</code>
          파일에 설정해주세요.
        </p>
        <pre className="bg-yellow-100 p-2 rounded mt-2 text-xs">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
        </pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <NaverMap
              locations={locations}
              center={{ lat: 37.5665, lng: 126.9780 }}
              zoom={12}
              onMarkerClick={setSelectedLocation}
              onNearbySearch={handleNearbySearch}
              className="h-[600px]"
            />
          </div>
        </div>

        {/* Location List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">테스트 장소 ({locations.length}개)</h2>

          {locations.map((location) => (
            <div
              key={location.contentId}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedLocation?.contentId === location.contentId
                  ? 'bg-primary-50 border-primary-400'
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <h3 className="font-semibold">{location.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{location.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {location.mapY?.toFixed(4)}, {location.mapX?.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800 mb-2">📍 Naver Maps Client ID 발급 방법</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
          <li>
            <a
              href="https://www.ncloud.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              Naver Cloud Platform
            </a>
            에 가입
          </li>
          <li>콘솔에서 &ldquo;AI·NAVER API&rdquo; → &ldquo;Maps&rdquo; 선택</li>
          <li>Application 등록</li>
          <li>Client ID 복사</li>
          <li>
            <code className="bg-blue-100 px-1">.env.local</code> 파일에 추가:
            <pre className="bg-blue-100 p-2 rounded mt-1 text-xs">
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
            </pre>
          </li>
          <li>개발 서버 재시작: <code className="bg-blue-100 px-1">npm run dev</code></li>
        </ol>
      </div>
    </div>
  );
}
