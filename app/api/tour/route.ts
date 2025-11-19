import { NextResponse } from 'next/server';

/**
 * GET /api/tour
 * Returns API information and available endpoints
 */
export async function GET() {
  return NextResponse.json({
    message: 'Tourism Explorer API',
    version: '1.0.0',
    endpoints: [
      '/api/tour/search',
      '/api/tour/detail/[id]',
      '/api/tour/areas',
    ],
  });
}
