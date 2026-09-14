/**
 * Production API proxy route that properly forwards HttpOnly cookies and headers.
 * Avoids the Next.js rewrites limitation where Set-Cookie headers aren't transmitted.
 */

import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest('GET', request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest('POST', request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest('PUT', request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest('DELETE', request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest('PATCH', request, params.path);
}

async function proxyRequest(
  method: string,
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  try {
    const pathString = pathSegments.join('/');
    const backendUrl = new URL(`/api/v1/${pathString}`, BACKEND_URL);

    // Forward query parameters
    const { searchParams } = new URL(request.url);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // Prepare request body
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text();
    }

    // Forward headers, excluding host-specific ones
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');

    // Forward cookies
    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      headers.set(
        'Cookie',
        cookies.map(c => `${c.name}=${c.value}`).join('; ')
      );
    }

    // Make backend request
    const backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // Get response headers and body
    const responseHeaders = new Headers(backendResponse.headers);
    const responseBody = await backendResponse.text();

    // Create response
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });

    // Properly forward Set-Cookie headers
    backendResponse.headers.getSetCookie().forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { detail: 'Internal proxy error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
