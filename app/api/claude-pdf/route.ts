import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { uploadPdfBuffer } from '@/lib/cloudinary';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, prompt, pdfBase64 } = body;

    if (!productId || !prompt) {
      return NextResponse.json({ error: 'productId and prompt required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // PDF base64: request'ten veya MongoDB'den
    const pdfData = pdfBase64 || product.originalPdfBase64;
    if (!pdfData) {
      return NextResponse.json({ error: 'PDF verisi bulunamadi. Lutfen urunu PDF ile tekrar olusturun.' }, { status: 400 });
    }

    // Claude API'ye gonder (Anthropic Messages API)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let editedContent = '';

    if (anthropicKey) {
      // Claude ile PDF analiz et
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: pdfData },
              },
              {
                type: 'text',
                text: `You are a professional PDF content editor for Etsy crochet pattern listings.

Here is a crochet pattern PDF. The user wants you to edit it based on their instructions.

User instruction: ${prompt}

IMPORTANT RULES:
- Return the COMPLETE edited content as clean, well-formatted text
- Keep all formatting: headers, bullet points, sections, emojis
- Keep the same professional structure
- Only change what the user asked for
- Return the full document content, not just the changes
- Use markdown formatting (# for headers, - for bullets, etc.)

Return ONLY the edited document content, nothing else.`,
              },
            ],
          }],
        }),
      });

      if (!claudeResponse.ok) {
        const err = await claudeResponse.json();
        console.error('Claude API error:', err);
        return NextResponse.json({ error: 'Claude API error', details: err }, { status: 500 });
      }

      const claudeData = await claudeResponse.json();
      editedContent = claudeData.content?.[0]?.text || '';
    } else if (openaiKey) {
      // GPT fallback
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'file',
                file: { file_data: `data:application/pdf;base64,${pdfData}` },
              },
              {
                type: 'text',
                text: `You are a professional PDF content editor for Etsy crochet pattern listings.

Here is a crochet pattern PDF. Edit it based on these instructions: ${prompt}

RULES:
- Return the COMPLETE edited content as clean markdown
- Keep all formatting, headers, bullet points, sections, emojis
- Only change what was asked
- Return the full document content

Return ONLY the edited document content.`,
              },
            ],
          }],
        }),
      });

      if (!gptResponse.ok) {
        const err = await gptResponse.json();
        return NextResponse.json({ error: 'GPT API error', details: err }, { status: 500 });
      }

      const gptData = await gptResponse.json();
      editedContent = gptData.choices?.[0]?.message?.content || '';
    } else {
      return NextResponse.json({ error: 'No API key configured (ANTHROPIC or OPENAI)' }, { status: 500 });
    }

    if (!editedContent) {
      return NextResponse.json({ error: 'AI returned empty content' }, { status: 500 });
    }

    // Duzenlenmis icerigi PDF'e cevir
    const pdfBytes = await generatePdfFromText(editedContent, product.name);

    // Cloudinary'ye yukle
    const processedUrl = await uploadPdfBuffer(Buffer.from(pdfBytes), 'amigurumi/pdfs-processed');

    // Product'i guncelle
    await Product.findByIdAndUpdate(productId, {
      processedPdfUrl: processedUrl,
      pdfPrompt: prompt,
    });

    return NextResponse.json({
      success: true,
      processedPdfUrl: processedUrl,
      editedContent: editedContent.substring(0, 500) + '...',
    });
  } catch (error) {
    console.error('Claude PDF error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF isleme basarisiz' },
      { status: 500 }
    );
  }
}

// Professional PDF generation with pdf-lib
async function generatePdfFromText(text: string, title: string): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN_X = 50;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;
  const LINE_H = 16;

  const purple = rgb(0.45, 0.27, 0.8);
  const darkGray = rgb(0.15, 0.15, 0.15);
  const medGray = rgb(0.35, 0.35, 0.35);
  const lightBg = rgb(0.95, 0.95, 0.98);
  const accentBg = rgb(0.93, 0.9, 1.0);

  // WinAnsi (Latin-1) desteklemeyen tum karakterleri temizle
  const stripNonWinAnsi = (s: string) =>
    s.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').replace(/\s{2,}/g, ' ').trim();

  const wrapText = (txt: string, font: typeof helvetica, size: number, maxW: number): string[] => {
    const words = txt.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxW && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  };

  type Block =
    | { type: 'title'; text: string }
    | { type: 'h1'; text: string }
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'bullet'; text: string }
    | { type: 'text'; text: string }
    | { type: 'divider' }
    | { type: 'blank' };

  const blocks: Block[] = [];
  blocks.push({ type: 'title', text: stripNonWinAnsi(title) });
  blocks.push({ type: 'divider' });
  blocks.push({ type: 'blank' });

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: stripNonWinAnsi(line.slice(4)) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: stripNonWinAnsi(line.slice(3)) });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: stripNonWinAnsi(line.slice(2)) });
    } else if (line.startsWith('---') || line.startsWith('***')) {
      blocks.push({ type: 'divider' });
    } else if (/^\s*[-*]\s/.test(line)) {
      blocks.push({ type: 'bullet', text: stripNonWinAnsi(line.replace(/^\s*[-*]\s+/, '')) });
    } else if (line.trim() === '') {
      blocks.push({ type: 'blank' });
    } else {
      blocks.push({ type: 'text', text: stripNonWinAnsi(line) });
    }
  }

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_TOP;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) {
      page.drawText(`${title}`, { x: MARGIN_X, y: 20, size: 7, font: helvetica, color: medGray });
      page.drawText(`${doc.getPageCount()}`, { x: PAGE_W - MARGIN_X - 10, y: 20, size: 7, font: helvetica, color: medGray });
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN_TOP;
    }
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'title': {
        ensureSpace(40);
        page.drawRectangle({ x: 0, y: y - 8, width: PAGE_W, height: 36, color: accentBg });
        page.drawRectangle({ x: 0, y: y - 8, width: 4, height: 36, color: purple });
        const titleLines = wrapText(block.text, helveticaBold, 20, CONTENT_W - 10);
        for (const tl of titleLines) {
          page.drawText(tl, { x: MARGIN_X + 8, y: y, size: 20, font: helveticaBold, color: purple });
          y -= 24;
        }
        y -= 8;
        break;
      }
      case 'h1': {
        ensureSpace(36);
        y -= 10;
        page.drawRectangle({ x: MARGIN_X, y: y - 4, width: CONTENT_W, height: 28, color: accentBg });
        page.drawRectangle({ x: MARGIN_X, y: y - 4, width: 3, height: 28, color: purple });
        const h1Lines = wrapText(block.text, helveticaBold, 16, CONTENT_W - 16);
        for (const hl of h1Lines) {
          page.drawText(hl, { x: MARGIN_X + 10, y: y, size: 16, font: helveticaBold, color: purple });
          y -= 20;
        }
        y -= 6;
        break;
      }
      case 'h2': {
        ensureSpace(28);
        y -= 8;
        page.drawRectangle({ x: MARGIN_X, y: y - 2, width: CONTENT_W, height: 22, color: lightBg });
        const h2Lines = wrapText(block.text, helveticaBold, 13, CONTENT_W - 8);
        for (const hl of h2Lines) {
          page.drawText(hl, { x: MARGIN_X + 6, y: y, size: 13, font: helveticaBold, color: darkGray });
          y -= 18;
        }
        y -= 4;
        break;
      }
      case 'h3': {
        ensureSpace(22);
        y -= 6;
        const h3Lines = wrapText(block.text, helveticaBold, 12, CONTENT_W);
        for (const hl of h3Lines) {
          page.drawText(hl, { x: MARGIN_X, y: y, size: 12, font: helveticaBold, color: darkGray });
          y -= 16;
        }
        y -= 2;
        break;
      }
      case 'bullet': {
        ensureSpace(LINE_H);
        const bulletLines = wrapText(block.text, helvetica, 10.5, CONTENT_W - 20);
        page.drawCircle({ x: MARGIN_X + 6, y: y + 3, size: 2.5, color: purple });
        for (let i = 0; i < bulletLines.length; i++) {
          page.drawText(bulletLines[i], { x: MARGIN_X + 16, y: y, size: 10.5, font: helvetica, color: darkGray });
          y -= LINE_H;
        }
        break;
      }
      case 'text': {
        const textLines = wrapText(block.text, helvetica, 10.5, CONTENT_W);
        for (const tl of textLines) {
          ensureSpace(LINE_H);
          page.drawText(tl, { x: MARGIN_X, y: y, size: 10.5, font: helvetica, color: darkGray });
          y -= LINE_H;
        }
        break;
      }
      case 'divider': {
        ensureSpace(16);
        y -= 6;
        page.drawLine({
          start: { x: MARGIN_X, y: y },
          end: { x: PAGE_W - MARGIN_X, y: y },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.85),
        });
        y -= 10;
        break;
      }
      case 'blank': {
        y -= 8;
        break;
      }
    }
  }

  page.drawText(stripNonWinAnsi(title), { x: MARGIN_X, y: 20, size: 7, font: helvetica, color: medGray });
  page.drawText(`${doc.getPageCount()}`, { x: PAGE_W - MARGIN_X - 10, y: 20, size: 7, font: helvetica, color: medGray });

  return doc.save();
}
