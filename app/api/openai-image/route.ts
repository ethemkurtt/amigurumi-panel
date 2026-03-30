import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

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

  const inputBuffer = Buffer.from(imageBase64, 'base64');

  // Resize to 1024x1024 (DALL-E 2 requirement) and ensure RGBA
  const resized = sharp(inputBuffer).resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).ensureAlpha();
  const rgbaBuffer = await resized.png().toBuffer();

  // Create mask: white/light background → transparent (editable), toy → opaque (keep)
  // DALL-E 2 mask: transparent pixels = areas to regenerate
  const { data: rawPixels, info } = await sharp(inputBuffer)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maskPixels = Buffer.alloc(info.width * info.height * 4);
  const threshold = 240; // pixels with R,G,B all > 240 are considered background

  for (let i = 0; i < info.width * info.height; i++) {
    const r = rawPixels[i * 4];
    const g = rawPixels[i * 4 + 1];
    const b = rawPixels[i * 4 + 2];

    if (r > threshold && g > threshold && b > threshold) {
      // Background pixel → transparent in mask (DALL-E will edit here)
      maskPixels[i * 4] = 0;
      maskPixels[i * 4 + 1] = 0;
      maskPixels[i * 4 + 2] = 0;
      maskPixels[i * 4 + 3] = 0; // transparent
    } else {
      // Toy pixel → opaque in mask (DALL-E will keep this)
      maskPixels[i * 4] = 0;
      maskPixels[i * 4 + 1] = 0;
      maskPixels[i * 4 + 2] = 0;
      maskPixels[i * 4 + 3] = 255; // opaque
    }
  }

  const maskBuffer = await sharp(maskPixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  const imageBlob = new Blob([new Uint8Array(rgbaBuffer)], { type: 'image/png' });
  const maskBlob = new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' });

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('mask', maskBlob, 'mask.png');
  formData.append('prompt', prompt);
  formData.append('model', 'dall-e-2');
  formData.append('response_format', 'b64_json');
  formData.append('size', '1024x1024');
  formData.append('n', '1');

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
