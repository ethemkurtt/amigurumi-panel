import { NextRequest, NextResponse } from 'next/server';
import { uploadImageBuffer, uploadPdfBuffer } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPdf = file.type === 'application/pdf' || file.name?.endsWith('.pdf');

    let url: string;
    if (isPdf) {
      url = await uploadPdfBuffer(buffer, 'amigurumi/pdfs');
    } else {
      url = await uploadImageBuffer(buffer, 'amigurumi/references');
    }

    return NextResponse.json({ url, type: isPdf ? 'pdf' : 'image' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
