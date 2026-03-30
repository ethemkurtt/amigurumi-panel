import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * n8n bu endpoint'e sonuçları gönderir.
 *
 * n8n'den beklenen payload yapısı:
 *
 * ── Görsel üretimi tamamlandığında ──
 * {
 *   "secret": "amigurumi-secret-key-2024",
 *   "type": "generate-result",
 *   "productId": "...",
 *   "images": [
 *     { "url": "https://cloudinary.../...", "backgroundId": "white-studio", "backgroundLabel": "Beyaz Stüdyo" },
 *     { "url": "https://cloudinary.../...", "backgroundId": "forest", "backgroundLabel": "Orman" },
 *   ],
 *   "title": "SEO optimized title...",
 *   "description": "Product description...",
 *   "tags": ["amigurumi", "crochet", ...]
 * }
 *
 * ── PDF üretimi tamamlandığında ──
 * {
 *   "secret": "amigurumi-secret-key-2024",
 *   "type": "pdf-result",
 *   "productId": "...",
 *   "pdfUrl": "https://cloudinary.../....pdf"
 * }
 *
 * ── Hata durumunda ──
 * {
 *   "secret": "amigurumi-secret-key-2024",
 *   "type": "error",
 *   "productId": "...",
 *   "error": "Hata mesajı..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Güvenlik kontrolü
    if (body.secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Geçersiz secret key' }, { status: 401 });
    }

    const { type, productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId zorunlu' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // ── Gorsel uretimi sonucu ─────────────────────────────────────────────
    if (type === 'generate-result') {
      const { images, title, description, tags } = body;

      // Gorselleri ekle
      const newImages = (images || []).map((img: { url: string; backgroundId: string; backgroundLabel: string }) => ({
        url: img.url,
        backgroundId: img.backgroundId,
        backgroundLabel: img.backgroundLabel,
        type: 'gemini' as const,
        createdAt: new Date(),
      }));

      const updateData: Record<string, unknown> = {
        status: 'completed',
      };
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (tags && Array.isArray(tags)) updateData.tags = tags;
      await Product.findByIdAndUpdate(productId, {
        $set: updateData,
        $push: { generatedImages: { $each: newImages } },
      });

      return NextResponse.json({
        success: true,
        message: `${newImages.length} gorsel kaydedildi`,
      });
    }

    // ── PDF sonucu ────────────────────────────────────────────────────────
    if (type === 'pdf-result') {
      const { pdfUrl } = body;

      await Product.findByIdAndUpdate(productId, {
        $set: { pdfUrl, status: 'completed' },
      });

      return NextResponse.json({
        success: true,
        message: 'PDF kaydedildi',
        pdfUrl,
      });
    }

    // ── Hata ──────────────────────────────────────────────────────────────
    if (type === 'error') {
      await Product.findByIdAndUpdate(productId, {
        $set: { status: 'draft', lastError: body.error || 'Bilinmeyen hata' },
      });

      return NextResponse.json({
        success: true,
        message: 'Hata kaydedildi',
      });
    }

    return NextResponse.json({ error: `Bilinmeyen type: ${type}` }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook hatası' },
      { status: 500 }
    );
  }
}
