/**
 * Base error class for TourAPI errors
 */
export class TourApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TourApiError';
    Object.setPrototypeOf(this, TourApiError.prototype);
  }
}

/**
 * Network-related errors (timeouts, connection errors, etc.)
 */
export class TourApiNetworkError extends TourApiError {
  constructor(message = 'Network error', originalError?: Error) {
    super(message, undefined, originalError);
    this.name = 'TourApiNetworkError';
    Object.setPrototypeOf(this, TourApiNetworkError.prototype);
  }
}

/**
 * Rate limit exceeded (HTTP 429)
 */
export class TourApiRateLimitError extends TourApiError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'TourApiRateLimitError';
    Object.setPrototypeOf(this, TourApiRateLimitError.prototype);
  }
}

/**
 * Resource not found (HTTP 404)
 */
export class TourApiNotFoundError extends TourApiError {
  constructor(message = 'Content not found') {
    super(message, 404);
    this.name = 'TourApiNotFoundError';
    Object.setPrototypeOf(this, TourApiNotFoundError.prototype);
  }
}
