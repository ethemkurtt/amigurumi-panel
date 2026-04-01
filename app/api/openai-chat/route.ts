import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productName, productSize, settings } = body;

  if (!productName) {
    return NextResponse.json({ error: 'productName required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const titleTemplate = settings?.titleTemplate || '';
  const descriptionTemplate = settings?.descriptionTemplate || '';
  const defaultTags = settings?.defaultTags?.join(', ') || '';

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
      'Authorization': `Bearer ${apiKey}`,
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
    return NextResponse.json(
      { error: data.error?.message || 'OpenAI error', details: data },
      { status: response.status }
    );
  }

  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    return NextResponse.json({
      title: parsed.title || productName,
      description: parsed.description || '',
      tags: parsed.tags || [],
    });
  } catch {
    return NextResponse.json({
      title: productName,
      description: '',
      tags: [],
      raw: content,
    });
  }
}
