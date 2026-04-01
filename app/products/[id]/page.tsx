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
  size?: string;
  referenceImageUrl: string;
  generatedImages: GeneratedImage[];
  title: string;
  description: string;
  tags: string[];
  status: 'draft' | 'generating' | 'completed';
  originalPdfUrl?: string;
  processedPdfUrl?: string;
  pdfPrompt?: string;
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
  const [activeImg, setActiveImg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState<'images' | 'content' | 'pdf'>('images');

  // PDF states
  const [pdfPrompt, setPdfPrompt] = useState('');
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // ZIP download
  const [zipLoading, setZipLoading] = useState(false);

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
        if (data.product.pdfPrompt) setPdfPrompt(data.product.pdfPrompt);
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
    } catch { alert('Kaydetme basarisiz'); }
    finally { setSaving(false); }
  };

  const handleDownloadImage = async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amigurumi-${label.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
    } catch { alert('Indirme basarisiz'); }
  };

  const handleDownloadZip = async () => {
    if (!product) return;
    setZipLoading(true);
    try {
      const res = await fetch(`/api/download-all?productId=${product._id}`);
      if (!res.ok) throw new Error('ZIP indirilemedi');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}-etsy-pack.zip`;
      a.click();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ZIP indirme basarisiz');
    } finally {
      setZipLoading(false);
    }
  };

  const handleProcessPdf = async () => {
    if (!product || !pdfPrompt.trim()) return;
    setPdfProcessing(true);
    setPdfError('');
    try {
      // base64 MongoDB'de kayitli, claude-pdf route otomatik cekecek
      const res = await fetch('/api/claude-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, prompt: pdfPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PDF isleme basarisiz');
      await loadProduct();
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF isleme basarisiz');
    } finally {
      setPdfProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg">Urun bulunamadi</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">← Ana Sayfaya Don</Link>
        </div>
      </div>
    );
  }

  const geminiImages = product.generatedImages || [];
  const tagList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
  const totalImages = geminiImages.length;
  const hasPdf = !!product.originalPdfUrl;

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
                {totalImages} gorsel{hasPdf ? ' + PDF' : ''} • {new Date(product.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={zipLoading || (totalImages === 0 && !hasPdf)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-400 hover:to-orange-400 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              {zipLoading ? (
                <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> ZIP...</>
              ) : (
                '📦 Tumunu Indir (ZIP)'
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-8">
          {([
            { key: 'images' as const, label: '🖼️ Gorseller', show: true },
            { key: 'pdf' as const, label: '📄 PDF', show: hasPdf },
            { key: 'content' as const, label: '📝 Icerik', show: true },
          ]).filter(t => t.show).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Images ─────────────────────────────────────────────── */}
        {activeTab === 'images' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main viewer */}
            <div className="space-y-4">
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

              <div className="relative bg-black/30 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{ maxHeight: 520, aspectRatio: '1/1' }}>
                {activeImg ? (
                  <>
                    <img src={activeImg} alt="Aktif gorsel" className="w-full h-full object-contain" />
                    <button
                      onClick={() => handleDownloadImage(activeImg, 'gorsel')}
                      className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
                    >
                      ⬇️ Indir
                    </button>
                  </>
                ) : (
                  <p className="text-white/30">Gorsel secin</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
                  AI Arkaplanlar ({totalImages})
                </p>
              </div>

              {totalImages === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <div className="text-3xl opacity-40">✨</div>
                  <p className="text-white/30 text-sm">Henuz AI gorseli yok</p>
                  <Link href="/generate"
                    className="inline-block text-purple-400 hover:text-purple-300 text-xs border border-purple-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    Yeni Gorsel Uret →
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
                      >⬇️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PDF ────────────────────────────────────────────────── */}
        {activeTab === 'pdf' && hasPdf && (
          <div className="space-y-8">
            {/* PDF Viewer */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Original PDF */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">📄 Orijinal PDF</h3>
                  <a
                    href={product.originalPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    ⬇️ Indir
                  </a>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 500 }}>
                  <iframe
                    src={`${product.originalPdfUrl}#toolbar=0`}
                    className="w-full h-full"
                    title="Original PDF"
                  />
                </div>
              </div>

              {/* Processed PDF (if exists) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    {product.processedPdfUrl ? '✅ Duzenlenmis PDF' : '🤖 Claude ile Duzenle'}
                  </h3>
                  {product.processedPdfUrl && (
                    <a
                      href={product.processedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      ⬇️ Indir
                    </a>
                  )}
                </div>

                {product.processedPdfUrl ? (
                  <div className="bg-white/5 border border-green-500/20 rounded-2xl overflow-hidden" style={{ height: 500 }}>
                    <iframe
                      src={`${product.processedPdfUrl}#toolbar=0`}
                      className="w-full h-full"
                      title="Processed PDF"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center" style={{ height: 500 }}>
                    <div className="text-center space-y-3 px-8">
                      <div className="text-5xl">🤖</div>
                      <p className="text-white/40 text-sm">Claude ile PDF&apos;i duzenlemek icin asagidaki prompt alanini kullanin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Claude PDF Prompt */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-white">🤖 Claude AI ile PDF Duzenle</h3>
              <p className="text-white/40 text-xs">
                PDF&apos;i Claude&apos;a gonderip bir prompt ile duzenletin. Ornegin: hayvan adini degistir, Ingilizce&apos;ye cevir, marka bilgisi ekle...
              </p>

              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Hayvan adini degistir', prompt: `Change the animal name from the current one to "${product.name}". Update all references throughout the document.` },
                  { label: 'Ingilizceye cevir', prompt: 'Translate the entire document to English while keeping the same format and structure.' },
                  { label: 'Turkceye cevir', prompt: 'Translate the entire document to Turkish while keeping the same format and structure.' },
                  { label: 'Marka ekle', prompt: 'Add a professional header with shop branding. Add "Designed by AmigurumiShop" at the top and footer.' },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPdfPrompt(s.prompt)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <textarea
                value={pdfPrompt}
                onChange={(e) => setPdfPrompt(e.target.value)}
                rows={3}
                placeholder="Claude'a ne yapmasini istiyorsun? (orn: Hayvan adini Cat olarak degistir ve Ingilizceye cevir)"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />

              {pdfError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{pdfError}</div>
              )}

              <button
                onClick={handleProcessPdf}
                disabled={pdfProcessing || !pdfPrompt.trim()}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
              >
                {pdfProcessing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Claude Isliyor...</>
                ) : (
                  '🤖 PDF Duzenle'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Content ────────────────────────────────────────────── */}
        {activeTab === 'content' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Etsy Baslik
                <span className="text-white/30 text-xs ml-2">({title.length}/140)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 140))}
                placeholder="Etsy urun basligi..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Aciklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Urun aciklamasi..."
                rows={10}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Etiketler <span className="text-white/30 text-xs">(virgul ile ayir, max 13)</span>
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
