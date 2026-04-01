import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { uploadImageFromUrl } from '@/lib/cloudinary';

export const maxDuration = 120;

// POST: Video uretimini baslat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, prompt } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Referans gorseli indir ve base64 yap
    const imgRes = await fetch(product.referenceImageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Referans gorsel indirilemedi' }, { status: 500 });
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const imgBase64 = imgBuffer.toString('base64');
    const mimeType = imgRes.headers.get('content-type') || 'image/png';

    // Video prompt
    const videoPrompt = prompt || `This amigurumi crochet toy slowly rotates 360 degrees on a clean white studio turntable. Smooth, continuous rotation. Professional product photography lighting. White seamless background. The toy stays perfectly centered and upright throughout the rotation. Soft shadows beneath. Studio product video style.`;

    // Veo API - predictLongRunning (async)
    const veoRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: videoPrompt,
            image: {
              bytesBase64Encoded: imgBase64,
              mimeType: mimeType,
            },
          }],
          parameters: {
            aspectRatio: '9:16',
            durationSeconds: 8,
          },
        }),
      }
    );

    if (!veoRes.ok) {
      const err = await veoRes.json();
      console.error('Veo API error:', err);
      await Product.findByIdAndUpdate(productId, {
        videoStatus: 'failed',
        videoError: JSON.stringify(err.error?.message || err),
      });
      return NextResponse.json({ error: 'Veo API error', details: err }, { status: veoRes.status });
    }

    const veoData = await veoRes.json();
    const operationName = veoData.name;

    if (!operationName) {
      return NextResponse.json({ error: 'No operation name returned', data: veoData }, { status: 500 });
    }

    // Status guncelle
    await Product.findByIdAndUpdate(productId, {
      videoStatus: 'generating',
      videoError: '',
    });

    return NextResponse.json({
      success: true,
      operationName,
      message: 'Video uretimi baslatildi',
    });
  } catch (error) {
    console.error('Gemini video error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video uretim basarisiz' },
      { status: 500 }
    );
  }
}

// GET: Video uretim durumunu kontrol et (poll)
export async function GET(req: NextRequest) {
  const operationName = req.nextUrl.searchParams.get('operation');
  const productId = req.nextUrl.searchParams.get('productId');

  if (!operationName) {
    return NextResponse.json({ error: 'operation required' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const pollRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiKey}`,
    );

    if (!pollRes.ok) {
      const err = await pollRes.json();
      return NextResponse.json({ error: 'Poll failed', details: err }, { status: pollRes.status });
    }

    const pollData = await pollRes.json();

    if (!pollData.done) {
      return NextResponse.json({ done: false, message: 'Video hala uretiliyor...' });
    }

    // Video hazir!
    const generatedVideos = pollData.response?.generateVideoResponse?.generatedSamples || [];

    if (generatedVideos.length === 0) {
      // Hata veya icerik filtresi
      if (productId) {
        await connectDB();
        await Product.findByIdAndUpdate(productId, {
          videoStatus: 'failed',
          videoError: 'Video uretilemedi (icerik filtresi veya bos sonuc)',
        });
      }
      return NextResponse.json({
        done: true,
        error: 'Video uretilemedi',
        details: pollData,
      });
    }

    const videoUri = generatedVideos[0].video?.uri;
    if (!videoUri) {
      return NextResponse.json({ done: true, error: 'Video URI bulunamadi' });
    }

    // Video'yu Gemini'den API key ile indir, sonra Cloudinary'ye yukle
    let videoUrl = videoUri;
    if (productId) {
      try {
        await connectDB();

        // 1. Gemini'den video'yu API key ile indir
        const authVideoUrl = videoUri.includes('?') ? `${videoUri}&key=${geminiKey}` : `${videoUri}?key=${geminiKey}`;
        const videoDownload = await fetch(authVideoUrl);
        if (!videoDownload.ok) {
          throw new Error(`Video indirilemedi: ${videoDownload.status}`);
        }
        const videoBuffer = Buffer.from(await videoDownload.arrayBuffer());

        // 2. Cloudinary'ye buffer olarak yukle
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'amigurumi/videos' },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result);
            }
          );
          stream.end(videoBuffer);
        });
        videoUrl = uploadResult.secure_url;

        await Product.findByIdAndUpdate(productId, {
          videoUrl,
          videoStatus: 'completed',
          videoError: '',
        });
      } catch (uploadErr) {
        console.error('Video upload error:', uploadErr);
        await Product.findByIdAndUpdate(productId, {
          videoStatus: 'failed',
          videoError: uploadErr instanceof Error ? uploadErr.message : 'Video yukleme basarisiz',
        });
      }
    }

    return NextResponse.json({
      done: true,
      videoUrl,
      message: 'Video hazir!',
    });
  } catch (error) {
    console.error('Video poll error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Poll basarisiz' },
      { status: 500 }
    );
  }
}
