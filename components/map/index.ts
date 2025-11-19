import React from 'react';

export { NaverMap } from './NaverMap';
export type { NaverMapProps } from './NaverMap';
export { MapInfoWindow } from './MapInfoWindow';
export { MyLocationButton } from './MyLocationButton';
export { MobileBottomSheet } from './MobileBottomSheet';
export { MapControls } from './MapControls';
export { MapErrorBoundary } from './MapErrorBoundary';
export { createMarkerIcon } from './marker-icons';
export * from './types';

export const LazyNaverMap = React.lazy(async () => ({
  default: (await import('./NaverMap')).NaverMap,
}));
