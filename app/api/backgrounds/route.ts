import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CustomBackground } from '@/models/CustomBackground';

// GET: Tum ozel temalari getir
export async function GET() {
  try {
    await connectDB();
    const backgrounds = await CustomBackground.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error('GET backgrounds error:', error);
    return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
  }
}

// POST: Yeni tema ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { label, emoji, category, prompt } = body;

    if (!label || !category || !prompt) {
      return NextResponse.json({ error: 'label, category and prompt required' }, { status: 400 });
    }

    await connectDB();

    // Unique ID olustur
    const id = `custom-${label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString(36)}`;

    const background = await CustomBackground.create({
      id,
      label,
      emoji: emoji || '🎨',
      category,
      prompt,
    });

    return NextResponse.json({ background });
  } catch (error) {
    console.error('POST backgrounds error:', error);
    return NextResponse.json({ error: 'Failed to create background' }, { status: 500 });
  }
}

// DELETE: Tema sil
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await connectDB();
    await CustomBackground.findOneAndDelete({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE backgrounds error:', error);
    return NextResponse.json({ error: 'Failed to delete background' }, { status: 500 });
  }
}
