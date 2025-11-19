/**
 * API Response Utilities for Tourism Explorer
 * Provides consistent response formatting
 */

import { NextResponse } from 'next/server';

/**
 * Success response helper
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error response helper
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error format
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Not found response helper
 * @param resource - The resource that was not found
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(resource: string) {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Bad request response helper
 * @param message - Error message
 * @returns NextResponse with 400 status
 */
export function badRequestResponse(message: string) {
  return errorResponse(message, 400);
}
