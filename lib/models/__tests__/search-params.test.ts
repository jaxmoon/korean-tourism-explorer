import { describe, it, expect } from 'vitest';
import { SearchParamsSchema, type SearchParams } from '../search-params';

describe('SearchParams Model', () => {
  it('should fail: validate keyword search params', () => {
    const params = {
      keyword: 'Seoul',
      contentTypeId: 12,
      areaCode: 1,
      pageNo: 1,
      numOfRows: 20
    };

    expect(() => SearchParamsSchema.parse(params)).not.toThrow();
  });

  it('should fail: reject invalid page numbers', () => {
    const invalidParams = {
      pageNo: -1,  // Invalid
      numOfRows: 20
    };

    expect(() => SearchParamsSchema.parse(invalidParams)).toThrow();
  });

  it('should fail: reject excessive rows per page', () => {
    const invalidParams = {
      pageNo: 1,
      numOfRows: 200  // Max is 100
    };

    expect(() => SearchParamsSchema.parse(invalidParams)).toThrow();
  });
});
