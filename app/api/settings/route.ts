import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

export async function GET() {
  await connectDB();

  // Tek bir settings dokumani kullaniyoruz, yoksa default olustur
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  await connectDB();

  const body = await req.json();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(body);
  } else {
    Object.assign(settings, body);
    await settings.save();
  }

  return NextResponse.json({ settings });
}
