import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageBase64, prompt } = body;

  if (!imageBase64 || !prompt) {
    return NextResponse.json({ error: 'imageBase64 and prompt required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  // Convert base64 to binary file for multipart upload
  const buffer = Buffer.from(imageBase64, 'base64');
  const imageBlob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });

  // gpt-image-1 on /v1/images/edits with multipart/form-data
  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('model', 'gpt-image-1');
  formData.append('prompt', prompt);
  formData.append('size', '1024x1024');
  formData.append('quality', 'medium');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message || 'OpenAI error', details: data }, { status: response.status });
  }

  const resultBase64 = data.data?.[0]?.b64_json || null;

  if (!resultBase64) {
    return NextResponse.json({ error: 'No image in response' }, { status: 500 });
  }

  return NextResponse.json({ imageBase64: resultBase64 });
}
