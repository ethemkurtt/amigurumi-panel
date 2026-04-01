import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).select('-originalPdfBase64 -processedPdfBase64').lean();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, referenceImageUrl, originalPdfUrl, originalPdfBase64, pdfPrompt, size } = body;

    if (!name || !referenceImageUrl) {
      return NextResponse.json({ error: 'name and referenceImageUrl are required' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      size: size || '25',
      referenceImageUrl,
      originalPdfUrl: originalPdfUrl || undefined,
      originalPdfBase64: originalPdfBase64 || undefined,
      pdfPrompt: pdfPrompt || undefined,
      status: 'draft',
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
