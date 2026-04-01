import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadBase64Image(
  base64Data: string,
  folder: string = 'amigurumi'
): Promise<string> {
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Data}`,
    { folder, resource_type: 'image' }
  );
  return result.secure_url;
}

export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'amigurumi'
): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string = 'amigurumi'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function uploadPdfBuffer(
  buffer: Buffer,
  folder: string = 'amigurumi/pdfs'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'raw', format: 'pdf' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export { cloudinary };
