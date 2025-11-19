import { describe, it, expect } from 'vitest';
import {
  transformApiLocation,
  getContentTypeLabel,
  calculateDistance
} from '../helpers';

describe('Helper Functions', () => {
  it('should transform API response to Location model', () => {
    const apiData = {
      contentid: '123',
      contenttypeid: '12',
      title: 'Test Location',
      addr1: 'Seoul',
      mapx: '126.97',
      mapy: '37.56',
    };

    const location = transformApiLocation(apiData);

    expect(location.contentId).toBe('123');
    expect(location.contentTypeId).toBe(12);
    expect(location.mapX).toBe(126.97);
  });

  it('should return correct content type labels', () => {
    expect(getContentTypeLabel(12)).toBe('관광지');
    expect(getContentTypeLabel(39)).toBe('음식점');
    expect(getContentTypeLabel(999)).toBe('기타');
  });

  it('should calculate distance between coordinates', () => {
    // Distance between Seoul and Busan (approx 325km)
    const distance = calculateDistance(37.5665, 126.9780, 35.1796, 129.0756);
    expect(distance).toBeGreaterThan(320);
    expect(distance).toBeLessThan(330);
  });
});
