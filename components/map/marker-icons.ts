import type { MarkerIcon } from './types';

type MarkerConfig = {
  id: string;
  path: string;
  description: string;
};

const ICON_MAP: Record<string, MarkerConfig> = {
  '12': {
    id: 'attraction',
    path: '/icons/marker-attraction.svg',
    description: 'Tourist attraction marker',
  },
  '14': {
    id: 'culture',
    path: '/icons/marker-culture.svg',
    description: 'Culture spot marker',
  },
  '15': {
    id: 'event',
    path: '/icons/marker-event.svg',
    description: 'Event marker',
  },
  '25': {
    id: 'course',
    path: '/icons/marker-course.svg',
    description: 'Travel course marker',
  },
  '28': {
    id: 'sports',
    path: '/icons/marker-sports.svg',
    description: 'Sports marker',
  },
  '32': {
    id: 'hotel',
    path: '/icons/marker-hotel.svg',
    description: 'Lodging marker',
  },
  '38': {
    id: 'shopping',
    path: '/icons/marker-shopping.svg',
    description: 'Shopping marker',
  },
  '39': {
    id: 'restaurant',
    path: '/icons/marker-food.svg',
    description: 'Restaurant marker',
  },
  default: {
    id: 'default',
    path: '/icons/marker-default.svg',
    description: 'Default map marker',
  },
};

const FALLBACK_CONTENT_TYPE = 'default';

export const createMarkerIcon = (contentTypeId?: number | null): MarkerIcon => {
  const iconKey = ICON_MAP[String(contentTypeId ?? '')] ? String(contentTypeId) : FALLBACK_CONTENT_TYPE;
  const icon = ICON_MAP[iconKey] ?? ICON_MAP[FALLBACK_CONTENT_TYPE];

  const content = `
    <div class="naver-marker-icon" data-marker-type="${icon.id}" aria-label="${icon.description}">
      <img src="${icon.path}" alt="" width="20" height="25" loading="lazy" />
    </div>
  `;

  return {
    content,
    anchor: { x: 10, y: 25 },
    size: { width: 20, height: 25 },
  };
};
