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

  // gpt-image-1 uses /v1/images/generations with image input (not /edits)
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      image: {
        type: 'base64',
        media_type: 'image/png',
        data: imageBase64,
      },
      size: '1024x1024',
      quality: 'medium',
    }),
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
