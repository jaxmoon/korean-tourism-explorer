"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Location } from '@/lib/models/location';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type SheetState = "minimized" | "half" | "expanded";

interface MobileBottomSheetProps {
  locations: Location[];
  activeLocationId?: string | null;
  initialState?: SheetState;
  onStateChange?: (state: SheetState) => void;
  onLocationSelect?: (location: Location) => void;
  onLocationDetail?: (location: Location) => void;
  isLoading?: boolean;
  className?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  selectedContentTypes?: number[];
  onContentTypeToggle?: (contentTypeId: number) => void;
}

const SHEET_HEIGHTS: Record<SheetState, number> = {
  minimized: 20, // 20% of viewport height
  half: 50, // 50%
  expanded: 80, // 80% - 검색바 영역 확보
};

const MIN_HEIGHT = 10; // Minimum 10% of viewport

const CONTENT_TYPES = [
  { id: 12, label: '관광지' },
  { id: 14, label: '문화시설' },
  { id: 15, label: '축제공연행사' },
  { id: 25, label: '여행코스' },
  { id: 28, label: '레포츠' },
  { id: 32, label: '숙박' },
  { id: 38, label: '쇼핑' },
  { id: 39, label: '음식점' },
];

const LocationSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="h-5 w-3/4 rounded bg-gray-200" />
    <div className="mt-2.5 h-3.5 w-1/2 rounded bg-gray-200" />
    <div className="mt-1.5 h-3 w-2/5 rounded bg-gray-100" />
  </div>
);

// 컨텐츠 타입별 아이콘
const getContentTypeIcon = (contentTypeId: number) => {
  switch (contentTypeId) {
    case 12: // 관광지
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      );
    case 14: // 문화시설
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 15: // 행사/공연/축제
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 25: // 여행코스
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case 28: // 레포츠
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 32: // 숙박
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 38: // 쇼핑
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 39: // 음식점
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
};

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  locations,
  activeLocationId,
  initialState = "half",
  onStateChange,
  onLocationSelect,
  onLocationDetail,
  isLoading = false,
  className,
  showRefreshButton = false,
  onRefresh,
  selectedContentTypes = [],
  onContentTypeToggle,
}) => {
  const [heightPercent, setHeightPercent] = useState(SHEET_HEIGHTS[initialState]);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const getMaxHeight = useCallback(() => {
    return 90; // Max 90vh
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
      setStartHeight(heightPercent);
    },
    [heightPercent]
  );

  const snapToClosest = useCallback(() => {
    const maxHeight = getMaxHeight();
    const heights = {
      minimized: SHEET_HEIGHTS.minimized,
      half: SHEET_HEIGHTS.half,
      expanded: Math.min(SHEET_HEIGHTS.expanded, maxHeight),
    };

    // Find closest snap point
    let closestState: SheetState = "half";
    let minDiff = Math.abs(heightPercent - heights.half);

    Object.entries(heights).forEach(([state, height]) => {
      const diff = Math.abs(heightPercent - height);
      if (diff < minDiff) {
        minDiff = diff;
        closestState = state as SheetState;
      }
    });

    setHeightPercent(heights[closestState]);
    onStateChange?.(closestState);
  }, [heightPercent, getMaxHeight, onStateChange]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToClosest();
  }, [isDragging, snapToClosest]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartY(e.clientY);
      setStartHeight(heightPercent);
    },
    [heightPercent]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const currentY = e.clientY;
      const deltaY = startY - currentY; // Inverted: dragging up = positive
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;

      const maxHeight = getMaxHeight();
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + deltaPercent));
      setHeightPercent(newHeight);
    },
    [isDragging, startY, startHeight, getMaxHeight]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToClosest();
  }, [isDragging, snapToClosest]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;

      const maxHeight = getMaxHeight();
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + deltaPercent));
      setHeightPercent(newHeight);
    },
    [isDragging, startY, startHeight, getMaxHeight]
  );

  return (
    <React.Fragment>
      {/* Refresh Search Button - Above Bottom Sheet */}
      {showRefreshButton && onRefresh && (
        <button
          onClick={onRefresh}
          className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 md:hidden"
          style={{
            bottom: `calc(${heightPercent}vh + 10px)`,
            transition: isDragging ? "none" : "bottom 0.2s ease-out",
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>현 위치에서 재검색</span>
        </button>
      )}

      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:hidden",
          className
        )}
        style={{
          height: `${heightPercent}vh`,
          transition: isDragging ? "none" : "height 0.2s ease-out",
        }}
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        className="flex-shrink-0 flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
      </div>

      {/* Content Type Filter */}
      {onContentTypeToggle && (
        <div className="flex-shrink-0 border-b border-gray-100 px-4 pb-3">
          <div
            ref={filterRef}
            className="scrollbar-hide flex gap-2 overflow-x-auto"
          >
            {CONTENT_TYPES.map((type) => {
              const isSelected = selectedContentTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onContentTypeToggle(type.id)}
                  className={cn(
                    'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-4"
        style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <LocationSkeleton key={i} />
            ))}
          </div>
        ) : locations.length > 0 ? (
          <div className="space-y-2.5">
            {locations.map((location) => {
              const isActive = location.contentId === activeLocationId;
              const imageUrl = location.firstImage || location.thumbnailUrl;

              return (
                <div
                  key={location.contentId}
                  className={cn(
                    'group w-full rounded-xl border overflow-hidden transition-all duration-200',
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md',
                  )}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Thumbnail Image */}
                    {imageUrl ? (
                      <button
                        type="button"
                        onClick={() => onLocationDetail?.(location)}
                        className="flex-shrink-0 overflow-hidden rounded-lg active:scale-95 transition-transform"
                      >
                        <img
                          src={imageUrl}
                          alt={location.title}
                          className="h-20 w-20 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/icons/marker-default.svg';
                            e.currentTarget.className = 'h-20 w-20 object-contain bg-gray-100 p-4';
                          }}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onLocationDetail?.(location)}
                        className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 active:scale-95 transition-transform"
                      >
                        <div className="text-gray-400">
                          {getContentTypeIcon(location.contentTypeId)}
                        </div>
                      </button>
                    )}

                    {/* Content */}
                    <button
                      type="button"
                      onClick={() => onLocationDetail?.(location)}
                      className="min-w-0 flex-1 text-left active:scale-[0.98] transition-transform"
                    >
                      <h3 className="mb-1 line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
                        {location.title}
                      </h3>
                      {location.addr1 && (
                        <p className="mb-1.5 line-clamp-1 text-[13px] leading-relaxed text-gray-600">
                          {location.addr1}
                        </p>
                      )}
                    </button>

                    {/* Map View Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationSelect?.(location);
                      }}
                      className={cn(
                        'mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                      )}
                      title="지도에서 보기"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">검색 결과가 없습니다</h3>
            <p className="text-sm text-gray-600">
              {selectedContentTypes.length > 0
                ? '다른 필터를 선택하거나 지도를 이동해보세요'
                : '지도를 이동하거나 검색해보세요'}
            </p>
          </div>
        )}
      </div>
    </div>
    </React.Fragment>
  );
};
