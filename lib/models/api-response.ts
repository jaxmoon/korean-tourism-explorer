import { z } from 'zod';
import { LocationSchema } from './location';

/**
 * TourAPI response header structure
 */
const ApiResponseHeaderSchema = z.object({
  resultCode: z.string(),
  resultMsg: z.string(),
});

/**
 * Paginated response body
 */
const ApiResponseBodySchema = z.object({
  items: z.object({
    item: z.array(LocationSchema),
  }),
  numOfRows: z.number(),
  pageNo: z.number(),
  totalCount: z.number(),
});

/**
 * Full API response wrapper
 */
export const TourApiResponseSchema = z.object({
  response: z.object({
    header: ApiResponseHeaderSchema,
    body: ApiResponseBodySchema,
  }),
});

export type TourApiResponse = z.infer<typeof TourApiResponseSchema>;
