import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry(geminiKey: string, base64Data: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`;
  const body = JSON.stringify({
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Data } },
        { text: prompt },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 8000; // 8s, 16s
      console.log(`Gemini retry ${attempt}/${maxRetries}, waiting ${delay}ms...`);
      await sleep(delay);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.status === 429 && attempt < maxRetries - 1) {
      console.log('Gemini 429 rate limit, will retry...');
      continue;
    }

    return res;
  }

  throw new Error('Gemini max retries exceeded');
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageUrl, imageBase64, prompt } = body;

  if ((!imageUrl && !imageBase64) || !prompt) {
    return NextResponse.json({ error: 'image source and prompt required' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Get base64: use provided or download from URL
    let base64Data = imageBase64;
    if (!base64Data && imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Image download failed');
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      base64Data = buffer.toString('base64');
    }

    // Call Gemini API with auto-retry on 429
    const geminiRes = await callGeminiWithRetry(geminiKey, base64Data, prompt);

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      return NextResponse.json({ error: 'Gemini API error', details: err }, { status: geminiRes.status });
    }

    const data = await geminiRes.json();

    // Extract image from response
    let resultBase64 = null;
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      const idata = part.inlineData || part.inline_data;
      if (idata?.data) {
        resultBase64 = idata.data;
        break;
      }
    }

    if (!resultBase64) {
      return NextResponse.json({ error: 'No image in Gemini response' }, { status: 500 });
    }

    return NextResponse.json({ imageBase64: resultBase64 });
  } catch (error) {
    console.error('Gemini image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gemini image failed' },
      { status: 500 }
    );
  }
}
