import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

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

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/png', data: base64Data } },
              { text: prompt },
            ],
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );

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
