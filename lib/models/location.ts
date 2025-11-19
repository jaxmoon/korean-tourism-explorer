import { z } from 'zod';

/**
 * Content Type IDs from TourAPI
 * 12: 관광지(tourist spot)
 * 14: 문화시설(cultural facility)
 * 15: 행사/공연/축제(festival)
 * 25: 여행코스(travel course)
 * 28: 레포츠(leisure sports)
 * 32: 숙박(accommodation)
 * 38: 쇼핑(shopping)
 * 39: 음식점(restaurant)
 */
export const ContentTypeEnum = z.enum(['12', '14', '15', '25', '28', '32', '38', '39']);

/**
 * Zod schema for Location data validation
 */
export const LocationSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  contentTypeId: z.number().int().positive('Content Type ID must be positive'),
  title: z.string().min(1, 'Title is required'),
  address: z.string().optional(),
  addr1: z.string().optional(),
  addr2: z.string().optional(),
  zipcode: z.string().optional(),

  // Coordinates (Naver Maps uses Korean coordinate system)
  mapX: z.number().optional(),  // Longitude
  mapY: z.number().optional(),  // Latitude

  // Images
  thumbnailUrl: z.string().url().optional(),
  firstImage: z.string().url().optional(),
  firstImage2: z.string().url().optional(),

  // Region codes
  areaCode: z.number().int().optional(),
  sigunguCode: z.number().int().optional(),

  // Category
  cat1: z.string().optional(),  // 대분류
  cat2: z.string().optional(),  // 중분류
  cat3: z.string().optional(),  // 소분류

  // Additional info
  tel: z.string().optional(),
  homepage: z.string().optional(),
  overview: z.string().optional(),

  // Timestamps
  createdtime: z.string().optional(),
  modifiedtime: z.string().optional(),

  // Booking/rating (future)
  booktour: z.string().optional(),
  mlevel: z.string().optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type Location = z.infer<typeof LocationSchema>;

/**
 * Validation helper function
 */
export function validateLocation(data: unknown): Location {
  return LocationSchema.parse(data);
}

/**
 * Safe validation (returns result with error)
 */
export function safeValidateLocation(data: unknown) {
  return LocationSchema.safeParse(data);
}
