import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  const type = req.nextUrl.searchParams.get('type') || 'original'; // 'original' or 'processed'

  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  try {
    await connectDB();
    const field = type === 'processed' ? 'processedPdfBase64' : 'originalPdfBase64';
    const product = await Product.findById(productId).select(`${field} name`).lean();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const base64 = type === 'processed'
      ? (product as Record<string, unknown>).processedPdfBase64 as string | undefined
      : (product as Record<string, unknown>).originalPdfBase64 as string | undefined;

    if (!base64) {
      return NextResponse.json({ error: 'PDF bulunamadi' }, { status: 404 });
    }

    const buffer = Buffer.from(base64, 'base64');
    const name = ((product as Record<string, unknown>).name as string || 'document').replace(/\s+/g, '-').toLowerCase();
    const filename = `${name}-${type}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Serve PDF error:', error);
    return NextResponse.json({ error: 'PDF serve failed' }, { status: 500 });
  }
}
