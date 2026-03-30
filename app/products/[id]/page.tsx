'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface GeneratedImage {
  _id: string;
  url: string;
  backgroundId: string;
  backgroundLabel: string;
  type: 'gemini' | 'reference';
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  referenceImageUrl: string;
  generatedImages: GeneratedImage[];
  title: string;
  description: string;
  tags: string[];
  status: 'draft' | 'generating' | 'completed';
  pdfUrl?: string;
  lastError?: string;
  createdAt: string;
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState<'images' | 'content'>('images');

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProduct(data.product);
        setTitle(data.product.title || '');
        setDescription(data.product.description || '');
        setTagsInput((data.product.tags || []).join(', '));
        // Set first gemini image or reference as active
        if (data.product.generatedImages?.length > 0) {
          setActiveImg(data.product.generatedImages[0].url);
        } else {
          setActiveImg(data.product.referenceImageUrl);
        }
      }
    } catch { console.error('Failed to load product'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, tags }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch { alert('Kaydetme başarısız'); }
    finally { setSaving(false); }
  };

  const handleDownloadPdf = async () => {
    if (!product) return;

    // Eğer n8n'den daha önce üretilmiş PDF varsa direkt indir
    if (product.pdfUrl) {
      window.open(product.pdfUrl, '_blank');
      return;
    }

    // Yoksa n8n'e PDF üretim isteği gönder
    setPdfLoading(true);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, type: 'pdf' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Poll for PDF URL
      let attempts = 0;
      const pollPdf = setInterval(async () => {
        attempts++;
        try {
          const pRes = await fetch(`/api/products/${id}`);
          const pData = await pRes.json();
          if (pData.product?.pdfUrl) {
            clearInterval(pollPdf);
            setPdfLoading(false);
            window.open(pData.product.pdfUrl, '_blank');
            setProduct(pData.product);
          } else if (attempts > 30) {
            clearInterval(pollPdf);
            setPdfLoading(false);
            alert('PDF üretimi zaman aşımına uğradı. n8n durumunu kontrol edin.');
          }
        } catch {
          clearInterval(pollPdf);
          setPdfLoading(false);
        }
      }, 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF tetikleme başarısız');
      setPdfLoading(false);
    }
  };

  const handleDownloadImage = async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amigurumi-${label.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
    } catch { alert('İndirme başarısız'); }
  };

  const handleDownloadAll = async () => {
    if (!product) return;
    for (const img of product.generatedImages || []) {
      await handleDownloadImage(img.url, img.backgroundLabel);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg">Ürün bulunamadı</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">← Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  const geminiImages = product.generatedImages || [];
  const tagList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
  const totalImages = geminiImages.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm">← Geri</Link>
            <div>
              <h1 className="text-base font-bold text-white">{product.name}</h1>
              <p className="text-xs text-white/40">
                {totalImages} Gemini görseli • {new Date(product.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={totalImages === 0}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              ⬇️ Tümünü İndir
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              {pdfLoading
                ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> PDF...</>
                : '📄 PDF İndir'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-8">
          {(['images', 'content'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white'}`}>
              {tab === 'images' ? '🖼️ Görseller' : '📝 İçerik'}
            </button>
          ))}
        </div>

        {/* ── TAB: Images ─────────────────────────────────────────────── */}
        {activeTab === 'images' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main viewer */}
            <div className="space-y-4">
              {/* Reference image */}
              <div>
                <p className="text-xs text-white/40 font-medium mb-2 uppercase tracking-wider">Yuklenen Gorsel</p>
                <button
                  onClick={() => setActiveImg(product.referenceImageUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all
                    ${activeImg === product.referenceImageUrl ? 'border-purple-400 scale-105' : 'border-white/10 hover:border-white/30'}`}
                >
                  <img src={product.referenceImageUrl} alt="Referans" className="w-full h-full object-cover" />
                </button>
              </div>

              {/* Active large image */}
              <div className="relative bg-black/30 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{ maxHeight: 520, aspectRatio: '1/1' }}>
                {activeImg ? (
                  <>
                    <img src={activeImg} alt="Aktif görsel" className="w-full h-full object-contain" />
                    <button
                      onClick={() => handleDownloadImage(activeImg, 'gorsel')}
                      className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
                    >
                      ⬇️ İndir
                    </button>
                  </>
                ) : (
                  <p className="text-white/30">Görsel seçin</p>
                )}
              </div>
            </div>

            {/* Gemini sidebar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
                  Gemini Arkaplanlar ({totalImages})
                </p>
              </div>

              {totalImages === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <div className="text-3xl opacity-40">✨</div>
                  <p className="text-white/30 text-sm">Henüz Gemini görseli yok</p>
                  <Link href="/generate"
                    className="inline-block text-purple-400 hover:text-purple-300 text-xs border border-purple-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    Yeni Görsel Üret →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[560px] overflow-y-auto pr-1">
                  {geminiImages.map((img) => (
                    <div key={img._id} className="group relative">
                      <button
                        onClick={() => setActiveImg(img.url)}
                        className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all block
                          ${activeImg === img.url ? 'border-purple-400' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <img src={img.url} alt={img.backgroundLabel} className="w-full h-full object-cover" />
                      </button>
                      <p className="text-xs text-white/40 text-center mt-1 truncate px-1">{img.backgroundLabel}</p>
                      <button
                        onClick={() => handleDownloadImage(img.url, img.backgroundLabel)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-xs p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="İndir"
                      >⬇️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Content ────────────────────────────────────────────── */}
        {activeTab === 'content' && (
          <div className="max-w-2xl space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Etsy Başlık
                <span className="text-white/30 text-xs ml-2">({title.length}/140)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 140))}
                placeholder="Etsy ürün başlığı..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürün açıklaması..."
                rows={10}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Etiketler <span className="text-white/30 text-xs">(virgülle ayır, max 13)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="amigurumi, crochet toy, handmade..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tagList.slice(0, 13).map((tag, i) => (
                    <span key={i} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {tagList.length > 13 && (
                    <span className="text-red-400 text-xs py-1">⚠️ Max 13 etiket</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
              >
                {saving
                  ? <><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</>
                  : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                {pdfLoading ? 'PDF...' : '📄 PDF Oluştur & İndir'}
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
              <p className="font-medium">ℹ️ PDF içeriği:</p>
              <ul className="text-blue-300/70 space-y-0.5 ml-3">
                <li>• Ürün adı, başlık ve açıklama</li>
                <li>• Tüm Etsy etiketleri</li>
                <li>• Tüm Gemini görselleri (2×2 grid)</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
