import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { BACKGROUND_PRESETS } from '@/constants/backgrounds';

export const maxDuration = 300; // 5 dakika

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Gemini retry logic ──
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
      const delay = attempt * 10000;
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

// ── Cloudinary upload ──
async function uploadToCloudinary(imageBase64: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'amigurumi/gemini';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: `data:image/png;base64,${imageBase64}`,
      api_key: apiKey,
      timestamp,
      signature,
      folder,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ── GPT content generation ──
async function generateGPTContent(
  productName: string,
  productSize: string,
  settings: Record<string, unknown>
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const titleTemplate = (settings?.titleTemplate as string) || '';
  const descriptionTemplate = (settings?.descriptionTemplate as string) || '';
  const defaultTags = Array.isArray(settings?.defaultTags)
    ? (settings.defaultTags as string[]).join(', ')
    : '';

  const systemPrompt = `You are an expert Etsy SEO specialist for handmade amigurumi crochet toys.
You will receive a product name, size, and reference templates.
Adapt the templates for the specific product while keeping the same professional format and style.
Return ONLY valid JSON with: title (string, max 140 chars), description (string), tags (array of 13 strings).
Do NOT wrap in markdown code blocks. Return raw JSON only.`;

  const userPrompt = `Product: ${productName}
Size: ${productSize || '25'}cm

=== REFERENCE TITLE (adapt for this product) ===
${titleTemplate}

=== REFERENCE DESCRIPTION (adapt for this product, keep same format & emojis) ===
${descriptionTemplate}

=== REFERENCE TAGS (adapt for this product) ===
${defaultTags}

Instructions:
- Replace the animal/product name with "${productName}" throughout
- Keep the EXACT same format, structure, emojis, and sections as the reference
- Adapt details (colors, features, theme) to match ${productName}
- Title: SEO optimized, max 140 chars, Etsy friendly
- Tags: 13 highly searchable Etsy tags specific to ${productName}
- Description: Keep all sections (What's Included, Skill Level, Download, Usage, Important)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('OpenAI error:', data);
    return { title: productName, description: '', tags: [] };
  }

  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return {
      title: parsed.title || productName,
      description: parsed.description || '',
      tags: parsed.tags || [],
    };
  } catch {
    return { title: productName, description: '', tags: [] };
  }
}

// ── Variant helpers ──
const SD: Record<string, string> = { simple: 'Very clean simple scene, minimal props.', medium: '', detailed: 'Rich detailed scene with many props and decorations.' };
const CD: Record<string, string> = { close: 'Close-up shot, toy fills most of frame.', medium: '', far: 'Wide shot showing full room, toy smaller in frame.' };
const TS: Record<string, string> = { small: 'Toy appears small in scene.', medium: '', large: 'Toy is prominently large in frame.' };
const CA: Record<string, string> = { front: 'Straight front view.', 'front-45': '45-degree front angle.', side: 'Side angle.', top: 'Top-down view.', low: 'Low angle looking up.' };
const TP: Record<string, string> = { keep: '', sitting: 'Toy in cute sitting position.', standing: 'Toy standing upright.', lying: 'Toy lying on its side.', tilted: 'Toy slightly tilted playfully.' };

interface Variant {
  sceneDetail?: string;
  cameraDistance?: string;
  toySize?: string;
  cameraAngle?: string;
  toyPose?: string;
}

interface Concept {
  backgroundId: string;
  variants?: Variant[];
  variant?: Variant;
}

// ── MAIN HANDLER ──
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Guvenlik kontrolu
  if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    productId,
    productName,
    productSize,
    referenceImageUrl,
    concepts,
    promptOptions,
    settings,
  } = body;

  if (!productId || !referenceImageUrl) {
    return NextResponse.json({ error: 'productId and referenceImageUrl required' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    await connectDB();

    // 1. GPT ile title/description/tags uret
    console.log(`[generate-direct] GPT content for: ${productName}`);
    const gptContent = await generateGPTContent(productName, productSize, settings || {});

    // 2. Referans gorseli indir (bir kere)
    console.log(`[generate-direct] Downloading reference image...`);
    const imgRes = await fetch(referenceImageUrl);
    if (!imgRes.ok) throw new Error('Reference image download failed');
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const refBase64 = imgBuffer.toString('base64');

    // 3. Her concept icin Gemini gorsel uret + Cloudinary'ye yukle
    const promptRules = (settings?.promptRules as string) ||
      'Keep the amigurumi toy EXACTLY as it is. Only change the background. Professional Etsy product photography.';
    const extraNotes = promptOptions?.extraNotes ? ` ${promptOptions.extraNotes}` : '';

    // Build tasks from concepts
    const tasks: { prompt: string; backgroundId: string; backgroundLabel: string }[] = [];
    const conceptList: Concept[] = concepts || [];

    for (const concept of conceptList) {
      const bgId = concept.backgroundId;
      const preset = BACKGROUND_PRESETS.find(p => p.id === bgId);
      if (!preset) continue;

      const variants = concept.variants || [concept.variant || {}];
      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi];
        const variantParts = [
          SD[v.sceneDetail || ''] || '',
          CD[v.cameraDistance || ''] || '',
          TS[v.toySize || ''] || '',
          CA[v.cameraAngle || ''] || CA['front-45'],
          TP[v.toyPose || ''] || '',
        ].filter(Boolean).join(' ');

        const variationHint = variants.length > 1
          ? ` Create a unique variation (variation ${vi + 1} of ${variants.length}).`
          : '';

        const fullPrompt = `Edit this image: Remove the background and place the amigurumi toy ${preset.prompt} ${variantParts} ${promptRules}${variationHint}${extraNotes}`;

        tasks.push({
          prompt: fullPrompt,
          backgroundId: bgId,
          backgroundLabel: preset.label + (variants.length > 1 ? ` #${vi + 1}` : ''),
        });
      }
    }

    if (tasks.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        $set: {
          status: 'completed',
          title: gptContent.title,
          description: gptContent.description,
          tags: gptContent.tags,
          lastError: 'No valid concepts provided',
        },
      });
      return NextResponse.json({ success: true, images: 0 });
    }

    console.log(`[generate-direct] ${tasks.length} image(s) to generate`);

    const generatedImages: {
      url: string;
      backgroundId: string;
      backgroundLabel: string;
      type: 'gemini';
      createdAt: Date;
    }[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // Goerseller arasi bekleme (rate limit onleme)
      if (i > 0) {
        console.log(`[generate-direct] Waiting 8s before next image...`);
        await sleep(8000);
      }

      try {
        console.log(`[generate-direct] Generating image ${i + 1}/${tasks.length}: ${task.backgroundLabel}`);

        // Gemini API cagir
        const geminiRes = await callGeminiWithRetry(geminiKey, refBase64, task.prompt);

        if (!geminiRes.ok) {
          const errData = await geminiRes.json().catch(() => ({}));
          console.error(`Gemini error for ${task.backgroundLabel}:`, geminiRes.status, errData);
          continue;
        }

        const geminiData = await geminiRes.json();

        // Gemini response'dan image base64 cek
        let resultBase64: string | null = null;
        const parts = geminiData.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          const idata = part.inlineData || part.inline_data;
          if (idata?.data) {
            resultBase64 = idata.data;
            break;
          }
        }

        if (!resultBase64) {
          console.log(`No image in Gemini response for ${task.backgroundLabel}`);
          continue;
        }

        // Cloudinary'ye yukle
        console.log(`[generate-direct] Uploading to Cloudinary: ${task.backgroundLabel}`);
        const cloudinaryUrl = await uploadToCloudinary(resultBase64);

        generatedImages.push({
          url: cloudinaryUrl,
          backgroundId: task.backgroundId,
          backgroundLabel: task.backgroundLabel,
          type: 'gemini',
          createdAt: new Date(),
        });

        console.log(`[generate-direct] Done: ${task.backgroundLabel} -> ${cloudinaryUrl}`);
      } catch (e) {
        console.error(`Error generating ${task.backgroundLabel}:`, e);
        continue;
      }
    }

    // 4. Sonuclari DB'ye kaydet
    const updateData: Record<string, unknown> = {
      status: 'completed',
      title: gptContent.title,
      description: gptContent.description,
      tags: gptContent.tags,
    };

    if (generatedImages.length === 0) {
      updateData.lastError = 'No images could be generated';
    }

    await Product.findByIdAndUpdate(productId, {
      $set: updateData,
      $push: { generatedImages: { $each: generatedImages } },
    });

    console.log(`[generate-direct] Completed! ${generatedImages.length}/${tasks.length} images saved`);

    return NextResponse.json({
      success: true,
      images: generatedImages.length,
      total: tasks.length,
    });
  } catch (error) {
    console.error('[generate-direct] Fatal error:', error);

    try {
      await connectDB();
      await Product.findByIdAndUpdate(productId, {
        $set: {
          status: 'draft',
          lastError: error instanceof Error ? error.message : 'Generation failed',
        },
      });
    } catch {
      // DB update failed too
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
