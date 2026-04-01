import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Collect all files to zip
    const files: { name: string; url: string }[] = [];

    // Reference image
    if (product.referenceImageUrl) {
      files.push({ name: 'referans-gorsel.png', url: product.referenceImageUrl });
    }

    // Generated images
    for (const img of product.generatedImages || []) {
      const safeName = img.backgroundLabel
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      files.push({ name: `${safeName}.png`, url: img.url });
    }

    // Original PDF
    if (product.originalPdfUrl) {
      files.push({ name: `${product.name}-original-pattern.pdf`, url: product.originalPdfUrl });
    }

    // Processed PDF
    if (product.processedPdfUrl) {
      files.push({ name: `${product.name}-edited-pattern.pdf`, url: product.processedPdfUrl });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files to download' }, { status: 400 });
    }

    // Simple ZIP implementation (no external lib needed)
    const zipParts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
      try {
        const response = await fetch(file.url);
        if (!response.ok) continue;
        const data = new Uint8Array(await response.arrayBuffer());

        // Local file header
        const nameBytes = new TextEncoder().encode(file.name);
        const header = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034b50, true); // local file header signature
        view.setUint16(4, 20, true); // version needed
        view.setUint16(6, 0, true); // flags
        view.setUint16(8, 0, true); // compression (store)
        view.setUint16(10, 0, true); // mod time
        view.setUint16(12, 0, true); // mod date
        view.setUint32(14, crc32(data), true); // crc-32
        view.setUint32(18, data.length, true); // compressed size
        view.setUint32(22, data.length, true); // uncompressed size
        view.setUint16(26, nameBytes.length, true); // file name length
        view.setUint16(28, 0, true); // extra field length
        header.set(nameBytes, 30);

        // Central directory entry
        const cdEntry = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cdEntry.buffer);
        cdView.setUint32(0, 0x02014b50, true); // central directory signature
        cdView.setUint16(4, 20, true); // version made by
        cdView.setUint16(6, 20, true); // version needed
        cdView.setUint16(8, 0, true); // flags
        cdView.setUint16(10, 0, true); // compression
        cdView.setUint16(12, 0, true); // mod time
        cdView.setUint16(14, 0, true); // mod date
        cdView.setUint32(16, crc32(data), true); // crc-32
        cdView.setUint32(20, data.length, true); // compressed size
        cdView.setUint32(24, data.length, true); // uncompressed size
        cdView.setUint16(28, nameBytes.length, true); // file name length
        cdView.setUint16(30, 0, true); // extra field length
        cdView.setUint16(32, 0, true); // file comment length
        cdView.setUint16(34, 0, true); // disk number start
        cdView.setUint16(36, 0, true); // internal file attributes
        cdView.setUint32(38, 0, true); // external file attributes
        cdView.setUint32(42, offset, true); // relative offset
        cdEntry.set(nameBytes, 46);

        zipParts.push(header);
        zipParts.push(data);
        centralDirectory.push(cdEntry);

        offset += header.length + data.length;
      } catch {
        continue;
      }
    }

    // Write central directory
    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of centralDirectory) {
      zipParts.push(cd);
      cdSize += cd.length;
    }

    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, centralDirectory.length, true);
    eocdView.setUint16(10, centralDirectory.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdOffset, true);
    eocdView.setUint16(20, 0, true);
    zipParts.push(eocd);

    // Combine all parts
    const totalLength = zipParts.reduce((sum, part) => sum + part.length, 0);
    const zipBuffer = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of zipParts) {
      zipBuffer.set(part, pos);
      pos += part.length;
    }

    const safeName = product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-etsy-pack.zip"`,
        'Content-Length': totalLength.toString(),
      },
    });
  } catch (error) {
    console.error('Download all error:', error);
    return NextResponse.json({ error: 'ZIP olusturulamadi' }, { status: 500 });
  }
}

// CRC32 for ZIP
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
