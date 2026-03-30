import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!body.imageUrl) {
    return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
  }

  const response = await fetch(body.imageUrl);
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/png';

  return NextResponse.json({ base64, mimeType });
}
