import { z } from 'zod';

/**
 * Search parameters for TourAPI search endpoint
 */
export const SearchParamsSchema = z.object({
  // Search query
  keyword: z.string().optional(),

  // Content type filter
  contentTypeId: z.number().int().positive().optional(),

  // Region filters
  areaCode: z.number().int().positive().optional(),
  sigunguCode: z.number().int().positive().optional(),

  // Category filters
  cat1: z.string().optional(),
  cat2: z.string().optional(),
  cat3: z.string().optional(),

  // Pagination
  pageNo: z.number().int().min(1, 'Page number must be at least 1').default(1),
  numOfRows: z.number().int().min(1).max(100, 'Max 100 rows per page').default(20),

  // Sorting
  arrange: z.enum(['A', 'B', 'C', 'D', 'E', 'O', 'P', 'Q', 'R']).optional(),
  // A: 제목순, B: 조회순, C: 수정일순, D: 생성일순, etc.

  // Location-based search
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  radius: z.number().int().positive().optional(),  // in meters
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export function validateSearchParams(data: unknown): SearchParams {
  return SearchParamsSchema.parse(data);
}
