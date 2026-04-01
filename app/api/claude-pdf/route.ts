import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { uploadPdfBuffer } from '@/lib/cloudinary';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, prompt } = body;

    if (!productId || !prompt) {
      return NextResponse.json({ error: 'productId and prompt required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product || !product.originalPdfUrl) {
      return NextResponse.json({ error: 'Product or PDF not found' }, { status: 404 });
    }

    // 1. PDF'i indir
    const pdfResponse = await fetch(product.originalPdfUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'PDF indirilemedi' }, { status: 500 });
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const pdfBase64 = pdfBuffer.toString('base64');

    // 2. Claude API'ye gonder (Anthropic Messages API)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Claude varsa Claude kullan, yoksa GPT kullan
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
                source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
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
        return NextResponse.json({ error: 'Claude API error', details: err }, { status: 500 });
      }

      const claudeData = await claudeResponse.json();
      const editedContent = claudeData.content?.[0]?.text || '';

      // 3. Duzenenmis icerigi PDF'e cevir
      const pdfBytes = await generatePdfFromText(editedContent, product.name);

      // 4. Cloudinary'ye yukle
      const processedUrl = await uploadPdfBuffer(Buffer.from(pdfBytes), 'amigurumi/pdfs-processed');

      // 5. Product'i guncelle
      await Product.findByIdAndUpdate(productId, {
        processedPdfUrl: processedUrl,
        pdfPrompt: prompt,
      });

      return NextResponse.json({
        success: true,
        processedPdfUrl: processedUrl,
        editedContent: editedContent.substring(0, 500) + '...',
      });
    } else {
      // GPT ile PDF analiz et (OpenAI'da PDF yoksa text olarak gonder)
      // PDF'in text icerigini cikart (basit yontem)
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
                file: { file_data: `data:application/pdf;base64,${pdfBase64}` },
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
      const editedContent = gptData.choices?.[0]?.message?.content || '';

      const pdfBytes = await generatePdfFromText(editedContent, product.name);
      const processedUrl = await uploadPdfBuffer(Buffer.from(pdfBytes), 'amigurumi/pdfs-processed');

      await Product.findByIdAndUpdate(productId, {
        processedPdfUrl: processedUrl,
        pdfPrompt: prompt,
      });

      return NextResponse.json({
        success: true,
        processedPdfUrl: processedUrl,
        editedContent: editedContent.substring(0, 500) + '...',
      });
    }
  } catch (error) {
    console.error('Claude PDF error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF isleme basarisiz' },
      { status: 500 }
    );
  }
}

// Basit text-to-PDF (minimal, pure text)
async function generatePdfFromText(text: string, title: string): Promise<Uint8Array> {
  // PDF header
  const lines = text.split('\n');
  const pdfLines: string[] = [];

  // Clean title
  const cleanTitle = title.replace(/[^\x20-\x7E]/g, '');

  // Build simple PDF manually
  let yPos = 750;
  const pageWidth = 612;
  const margin = 50;
  const lineHeight = 14;
  const maxCharsPerLine = 80;
  const contentLines: { text: string; size: number; bold: boolean }[] = [];

  // Title
  contentLines.push({ text: cleanTitle, size: 18, bold: true });
  contentLines.push({ text: '', size: 12, bold: false });

  for (const line of lines) {
    const cleanLine = line
      .replace(/[^\x20-\x7EÀ-ÿ\u0100-\u017F]/g, '')
      .replace(/^#+\s*/, '');

    if (line.startsWith('# ')) {
      contentLines.push({ text: '', size: 12, bold: false });
      contentLines.push({ text: cleanLine, size: 16, bold: true });
    } else if (line.startsWith('## ')) {
      contentLines.push({ text: '', size: 12, bold: false });
      contentLines.push({ text: cleanLine, size: 14, bold: true });
    } else if (cleanLine.length > maxCharsPerLine) {
      // Word wrap
      const words = cleanLine.split(' ');
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).length > maxCharsPerLine) {
          contentLines.push({ text: current, size: 11, bold: false });
          current = word;
        } else {
          current = current ? current + ' ' + word : word;
        }
      }
      if (current) contentLines.push({ text: current, size: 11, bold: false });
    } else {
      contentLines.push({ text: cleanLine || '', size: 11, bold: false });
    }
  }

  // Generate PDF bytes
  const objects: string[] = [];
  let objectCount = 0;
  const offsets: number[] = [];

  const addObject = (content: string) => {
    objectCount++;
    offsets.push(-1); // placeholder
    objects.push(`${objectCount} 0 obj\n${content}\nendobj\n`);
    return objectCount;
  };

  // Object 1: Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // Build pages
  const linesPerPage = Math.floor((750 - 50) / lineHeight);
  const pages: { text: string; size: number; bold: boolean }[][] = [];
  let currentPage: { text: string; size: number; bold: boolean }[] = [];

  for (const cl of contentLines) {
    currentPage.push(cl);
    if (currentPage.length >= linesPerPage) {
      pages.push(currentPage);
      currentPage = [];
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);
  if (pages.length === 0) pages.push([{ text: 'Empty document', size: 12, bold: false }]);

  // Object 2: Pages
  const pageObjIds: number[] = [];
  // Reserve object 2 for Pages, 3 for Font
  addObject('PAGES_PLACEHOLDER');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  // Create page objects
  for (const page of pages) {
    // Content stream
    let streamContent = '';
    let y = 750;

    for (const line of page) {
      const fontRef = line.bold ? `/F2` : `/F1`;
      const escaped = line.text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
      streamContent += `BT ${fontRef} ${line.size} Tf ${margin} ${y} Td (${escaped}) Tj ET\n`;
      y -= lineHeight + (line.size > 12 ? 6 : 0);
    }

    const streamId = addObject(
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream`
    );

    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 792] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R /F2 ${boldFontId} 0 R >> >> >>`
    );
    pageObjIds.push(pageId);
  }

  // Fix Pages object
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj\n`;

  // Build PDF
  let pdf = '%PDF-1.4\n';
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i];
  }

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 0; i < objectCount; i++) {
    pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objectCount + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF';

  return new TextEncoder().encode(pdf);
}
