import type { Location } from '@/lib/models/location';

export interface NaverLatLng {
  lat(): number;
  lng(): number;
}

export interface NaverBounds {
  getNE(): NaverLatLng;
  getSW(): NaverLatLng;
  getNW(): NaverLatLng;
  getSE(): NaverLatLng;
}

export interface NaverPointLike {
  x: number;
  y: number;
}

export interface MarkerIcon {
  content: string;
  anchor?: NaverPointLike;
  size?: { width: number; height: number };
}

export interface NaverMapOptions {
  center: NaverLatLng;
  zoom?: number;
  mapTypeId?: string;
  disableDoubleClickZoom?: boolean;
  scrollWheel?: boolean;
  draggable?: boolean;
  logoControl?: boolean;
  scaleControl?: boolean;
  mapDataControl?: boolean;
}

export interface NaverMapInstance {
  panTo(latLng: NaverLatLng): void;
  setCenter(latLng: NaverLatLng): void;
  setZoom(zoom: number): void;
  getZoom(): number;
  getCenter(): NaverLatLng;
  getBounds(): NaverBounds;
  getMapTypeId(): string;
  setMapTypeId(mapTypeId: string): void;
  getElement(): HTMLElement;
}

export interface NaverMarkerInstance {
  setMap(map: NaverMapInstance | null): void;
  setPosition(latLng: NaverLatLng): void;
  getPosition(): NaverLatLng;
}

export interface MarkerClusteringOptions {
  map: NaverMapInstance;
  markers: NaverMarkerInstance[];
  minClusterSize: number;
  disableClickZoom?: boolean;
  averageCenter?: boolean;
  gridSize?: number;
}

export interface NaverMarkerClusteringInstance {
  setMap(map: NaverMapInstance | null): void;
  setMarkers(markers: NaverMarkerInstance[]): void;
  repaint(): void;
}

export interface NaverInfoWindowInstance {
  open(map: NaverMapInstance, marker: NaverMarkerInstance): void;
  close(): void;
}

export interface NaverEventSubscription {
  remove(): void;
}

export interface NaverEvent {
  addListener<T>(target: T, name: string, handler: (...args: any[]) => void): NaverEventSubscription;
  trigger(target: any, name: string, ...args: any[]): void;
}

export interface NaverMapTypeId {
  NORMAL: string;
  SATELLITE: string;
  [key: string]: string;
}

export interface NaverMaps {
  Map: new (container: HTMLElement, options: NaverMapOptions) => NaverMapInstance;
  Marker: new (options: { position: NaverLatLng; map?: NaverMapInstance | null; icon?: MarkerIcon }) => NaverMarkerInstance;
  MarkerClustering: new (options: MarkerClusteringOptions) => NaverMarkerClusteringInstance;
  InfoWindow: new (options: { content?: string }) => NaverInfoWindowInstance;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Event: NaverEvent;
  MapTypeId: NaverMapTypeId;
}

export interface NaverMapsGlobal {
  maps: NaverMaps;
}

declare global {
  interface Window {
    naver?: NaverMapsGlobal;
  }
}

export type { Location };
