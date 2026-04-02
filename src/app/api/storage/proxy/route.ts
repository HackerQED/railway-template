import { requireSession, unauthorizedResponse } from '@/lib/require-session';
import { type NextRequest, NextResponse } from 'next/server';

const MAX_PROXY_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'railway-template/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentLength = upstream.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_PROXY_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the URL' },
      { status: 502 }
    );
  }
}
