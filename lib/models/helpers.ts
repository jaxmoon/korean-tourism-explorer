import { Location } from './location';

/**
 * Transform TourAPI response to internal Location format
 */
export function transformApiLocation(apiData: any): Location {
  return {
    contentId: apiData.contentid,
    contentTypeId: parseInt(apiData.contenttypeid),
    title: apiData.title,
    address: apiData.addr1 || '',
    addr1: apiData.addr1,
    addr2: apiData.addr2,
    mapX: parseFloat(apiData.mapx) || undefined,
    mapY: parseFloat(apiData.mapy) || undefined,
    thumbnailUrl: apiData.firstimage || apiData.firstimage2,
    firstImage: apiData.firstimage,
    firstImage2: apiData.firstimage2,
    areaCode: parseInt(apiData.areacode) || undefined,
    sigunguCode: parseInt(apiData.sigungucode) || undefined,
    cat1: apiData.cat1,
    cat2: apiData.cat2,
    cat3: apiData.cat3,
    tel: apiData.tel,
    overview: apiData.overview,
    createdtime: apiData.createdtime,
    modifiedtime: apiData.modifiedtime,
  };
}

/**
 * Get content type label in Korean
 */
export function getContentTypeLabel(contentTypeId: number): string {
  const labels: Record<number, string> = {
    12: '관광지',
    14: '문화시설',
    15: '행사/축제',
    25: '여행코스',
    28: '레포츠',
    32: '숙박',
    38: '쇼핑',
    39: '음식점',
  };
  return labels[contentTypeId] || '기타';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
