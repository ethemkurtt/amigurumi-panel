import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Settings } from '@/models/Settings';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, backgroundIds, concepts, type = 'generate', promptOptions } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId zorunlu' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Ayarlari MongoDB'den cek
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Pick the right n8n webhook URL
    const webhookUrl =
      type === 'pdf'
        ? process.env.N8N_WEBHOOK_PDF
        : process.env.N8N_WEBHOOK_GENERATE;

    if (!webhookUrl || webhookUrl.includes('YOUR-N8N')) {
      return NextResponse.json(
        { error: 'n8n webhook URL henüz ayarlanmamış. .env.local dosyasını kontrol edin.' },
        { status: 500 }
      );
    }

    // Prepare payload for n8n
    const payload = {
      secret: process.env.N8N_WEBHOOK_SECRET,
      type,
      productId: product._id.toString(),
      productName: product.name,
      productSize: product.size || settings.defaultSize || '25',
      referenceImageUrl: product.referenceImageUrl,
      backgroundIds: backgroundIds || [],
      concepts: concepts || [],
      promptOptions: promptOptions || {},
      // Ayarlardan gelen sablonlar
      settings: {
        titleTemplate: settings.titleTemplate,
        descriptionTemplate: settings.descriptionTemplate,
        defaultTags: settings.defaultTags,
        promptRules: settings.promptRules,
        defaultStyle: settings.defaultStyle,
        shopName: settings.shopName,
      },
      // n8n'in sonuclari geri gonderecegi URL
      callbackUrl: `${req.nextUrl.origin}/api/webhook/n8n`,
      // Mevcut urun bilgileri (PDF icin)
      title: product.title,
      description: product.description,
      tags: product.tags,
      generatedImages: product.generatedImages,
    };

    // Update product status
    await Product.findByIdAndUpdate(productId, {
      status: 'generating',
    });

    // Trigger n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text().catch(() => 'Unknown');
      await Product.findByIdAndUpdate(productId, { status: 'draft' });
      return NextResponse.json(
        { error: `n8n tetikleme başarısız (${n8nResponse.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // n8n may return immediate response or just acknowledge
    let n8nData = {};
    try {
      n8nData = await n8nResponse.json();
    } catch {
      // n8n might return empty 200
    }

    return NextResponse.json({
      success: true,
      message: type === 'pdf' ? 'PDF üretimi n8n\'e gönderildi' : 'Görsel üretimi n8n\'e gönderildi',
      n8nResponse: n8nData,
    });
  } catch (error) {
    console.error('Trigger error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tetikleme başarısız' },
      { status: 500 }
    );
  }
}
