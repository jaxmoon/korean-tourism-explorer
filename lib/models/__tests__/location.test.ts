import { describe, it, expect } from 'vitest';
import { LocationSchema, validateLocation, type Location } from '../location';

describe('Location Data Model - Schema Validation', () => {
  it('should fail: location schema not defined yet', () => {
    const validLocation = {
      contentId: '123456',
      contentTypeId: 12,
      title: 'Test Location',
      address: 'Seoul, Korea',
      mapX: 126.9780,
      mapY: 37.5665,
      thumbnailUrl: 'https://example.com/image.jpg',
      modifiedtime: '20231110120000'
    };

    // This SHOULD FAIL initially (RED phase)
    expect(() => LocationSchema.parse(validLocation)).not.toThrow();
  });

  it('should fail: invalid contentId (empty string)', () => {
    const invalidLocation = {
      contentId: '',  // Invalid
      contentTypeId: 12,
      title: 'Test',
      address: 'Address'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: invalid contentTypeId (negative number)', () => {
    const invalidLocation = {
      contentId: '123',
      contentTypeId: -1,  // Invalid - must be positive
      title: 'Test'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: missing required fields', () => {
    const invalidLocation = {
      contentId: '123'
      // Missing contentTypeId, title, etc.
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: invalid coordinate types', () => {
    const invalidLocation = {
      contentId: '123',
      contentTypeId: 12,
      title: 'Test',
      mapX: 'not-a-number',  // Should be number
      mapY: 'not-a-number'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });
});

describe('Location Model - Type Safety', () => {
  it('should fail: TypeScript interfaces not defined', () => {
    const location: Location = {
      contentId: '123',
      contentTypeId: 12,
      title: 'Test',
      address: 'Test Address',
      mapX: 126.97,
      mapY: 37.56
    };

    // TypeScript should allow this structure
    expect(location.contentId).toBe('123');
  });
});
