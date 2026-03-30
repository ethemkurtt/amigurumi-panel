'use client';

import { useRef, useState } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
}

export default function ImageUpload({ onUpload, label = 'Görsel Yükle', accept = 'image/*' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Sadece görsel dosyaları yükleyebilirsiniz.');
      return;
    }

    setError('');
    setUploading(true);

    // Show local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${dragOver ? 'border-purple-400 bg-purple-500/10' : 'border-white/20 hover:border-purple-400/50 bg-white/5'}
          ${uploading ? 'cursor-not-allowed opacity-70' : ''}
        `}
        style={{ minHeight: 200 }}
      >
        {preview ? (
          <div className="relative w-full" style={{ minHeight: 200 }}>
            <img src={preview} alt="Preview" className="w-full object-cover rounded-2xl" style={{ maxHeight: 300 }} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
              <p className="text-white text-sm font-medium">Değiştirmek için tıkla</p>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-white/30 border-t-purple-400 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                  <p className="text-white text-sm">Yükleniyor...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-3 border-white/20 border-t-purple-400 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <p className="text-white/70 text-sm">Cloudinary&apos;a yükleniyor...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">{label}</p>
                  <p className="text-white/50 text-sm mt-1">Sürükle & bırak veya tıkla</p>
                  <p className="text-white/30 text-xs mt-1">PNG, JPG, WEBP desteklenir</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
