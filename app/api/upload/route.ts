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
      const pdfBase64 = buffer.toString('base64');
      return NextResponse.json({ url, type: 'pdf', pdfBase64 });
    } else {
      url = await uploadImageBuffer(buffer, 'amigurumi/references');
      return NextResponse.json({ url, type: 'image' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
