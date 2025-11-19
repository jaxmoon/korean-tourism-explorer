'use client';

import React, { useEffect } from 'react';
import type { Location } from '@/lib/models/location';
import { cn } from '@/lib/utils';

interface LocationDetailProps {
  location: Location | null;
  onClose: () => void;
}

export const LocationDetail: React.FC<LocationDetailProps> = ({ location, onClose }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (location) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [location, onClose]);

  if (!location) return null;

  const imageUrl = location.firstImage || location.thumbnailUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-2xl overflow-hidden bg-white',
          'max-h-[90vh] md:max-h-[85vh] md:rounded-2xl',
          'animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
          aria-label="닫기"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh] md:max-h-[85vh]">
          {/* Hero Image */}
          {imageUrl ? (
            <div className="relative h-64 w-full overflow-hidden bg-gray-100 md:h-80">
              <img
                src={imageUrl}
                alt={location.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="relative flex h-48 w-full items-center justify-center bg-gray-100 md:h-64">
              <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {location.title}
              </h2>
            </div>

            {/* Info Grid */}
            <div className="space-y-4">
              {/* Address */}
              {location.addr1 && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">주소</p>
                    <p className="text-base text-gray-900">{location.addr1}</p>
                    {location.addr2 && (
                      <p className="text-sm text-gray-600 mt-0.5">{location.addr2}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Phone */}
              {location.tel && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">전화번호</p>
                    <a href={`tel:${location.tel}`} className="text-base text-blue-600 hover:underline">
                      {location.tel}
                    </a>
                  </div>
                </div>
              )}

              {/* Homepage */}
              {location.homepage && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">홈페이지</p>
                    <div
                      className="text-base text-blue-600 hover:underline prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: location.homepage }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Overview */}
            {location.overview && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 정보</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: location.overview }}
                />
              </div>
            )}

            {/* Additional Info */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              {location.mapX && location.mapY && (
                <div>
                  <p className="text-gray-500 mb-1">좌표</p>
                  <p className="text-gray-900 font-mono text-xs">
                    {location.mapY.toFixed(6)}, {location.mapX.toFixed(6)}
                  </p>
                </div>
              )}
              {location.contentTypeId && (
                <div>
                  <p className="text-gray-500 mb-1">유형</p>
                  <p className="text-gray-900">
                    {getContentTypeName(location.contentTypeId)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get content type name
const getContentTypeName = (contentTypeId: number): string => {
  const types: Record<number, string> = {
    12: '관광지',
    14: '문화시설',
    15: '행사/공연/축제',
    25: '여행코스',
    28: '레포츠',
    32: '숙박',
    38: '쇼핑',
    39: '음식점',
  };
  return types[contentTypeId] || '기타';
};
