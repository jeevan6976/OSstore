import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'github.com',
  'objects.githubusercontent.com',
  'github-releases.githubusercontent.com',
  'codeload.github.com',
  'f-droid.org',
  'mirror.f-droid.org',
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'download';

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  if (!isAllowed(url)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { 'User-Agent': 'OSstore/1.0' },
      redirect: 'follow',
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Upstream error', status: upstream.status }, { status: 502 });
  }

  const contentType =
    upstream.headers.get('content-type') || 'application/octet-stream';

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);

  const cl = upstream.headers.get('content-length');
  if (cl) headers.set('Content-Length', cl);

  // Stream the body through
  return new NextResponse(upstream.body, { status: 200, headers });
}
