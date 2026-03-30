'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import BackgroundSelector from '@/components/BackgroundSelector';

type Step = 'upload' | 'backgrounds' | 'processing' | 'done';

export default function GeneratePage() {
  const [productName, setProductName] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);

  const [step, setStep] = useState<Step>('upload');
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  // Step 1 → 2: Create product
  const handleStep1 = async () => {
    if (!productName.trim()) { setError('Lutfen urun adi girin'); return; }
    if (!referenceImageUrl) { setError('Lutfen gorsel yukleyin'); return; }
    setError('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName, referenceImageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProductId(data.product._id);
      setStep('backgrounds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urun olusturulamadi');
    }
  };

  // Step 2 → 3: Trigger n8n
  const handleGenerate = async () => {
    if (selectedBackgrounds.length === 0) { setError('En az 1 konsept secin'); return; }
    setError('');
    setStep('processing');

    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          backgroundIds: selectedBackgrounds,
          type: 'generate',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'n8n tetiklenemedi');
      setStep('backgrounds');
    }
  };

  // Poll product status
  const pollStatus = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (!res.ok) return;

      const p = data.product;
      setImageCount(p.generatedImages?.length || 0);

      if (p.status === 'completed') {
        setStep('done');
      } else if (p.lastError) {
        setError(p.lastError);
        setStep('backgrounds');
      }
    } catch {}
    setPollCount((c) => c + 1);
  }, [productId]);

  // Auto-poll while processing
  useEffect(() => {
    if (step !== 'processing') return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [step, pollStatus]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm">← Geri</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧶</span>
            <h1 className="text-base font-bold text-white">Yeni Urun Olustur</h1>
          </div>
          <span className="ml-auto flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs px-2.5 py-1 rounded-full">
            Gemini AI
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { key: 'upload', label: '1. Gorsel Yukle' },
            { key: 'backgrounds', label: '2. Konsept Sec' },
            { key: 'processing', label: '3. Gemini Isliyor' },
          ].map((s, i, arr) => {
            const isDone =
              (['backgrounds', 'processing', 'done'].includes(step) && s.key === 'upload') ||
              (['processing', 'done'].includes(step) && s.key === 'backgrounds');
            const isActive = step === s.key || (step === 'done' && s.key === 'processing');
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i < arr.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${isDone ? 'bg-green-500/50' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Upload & Name ───────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Gorsel Yukle</h2>
                <p className="text-white/50 text-sm">
                  ChatGPT&apos;de duzenlediginiz gorseli buraya yukleyin. Gemini sectiginiz ev ortami konseptlerinde arka plan degistirecek.
                </p>
                <ImageUpload
                  onUpload={(url) => { setReferenceImageUrl(url); setError(''); }}
                  label="Duzenlenmis Gorseli Yukle"
                />
              </div>
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white">Urun Bilgileri</h2>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Urun Adi *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="orn: Sevimli Tavsan Amigurumi"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-blue-300 text-xs font-semibold">Akis</p>
                  <ul className="text-blue-300/70 text-xs space-y-1">
                    <li>1. ChatGPT&apos;de gorseli duzenleyin</li>
                    <li>2. Duzenlenmis gorseli buraya yukleyin</li>
                    <li>3. Ev ortami konseptlerini secin</li>
                    <li>4. Gemini arka planlari degistirir</li>
                    <li>5. Sonuclari indirin</li>
                  </ul>
                </div>
              </div>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">{error}</div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleStep1}
                disabled={!productName || !referenceImageUrl}
                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all"
              >
                Devam Et →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Concept Selection ───────────────────────────── */}
        {step === 'backgrounds' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Ev Ortami Konseptleri</h2>
              <p className="text-white/50 text-sm">
                Gemini sectiginiz konseptlerde arka plan degistirecek.
              </p>
            </div>
            <BackgroundSelector
              selected={selectedBackgrounds}
              onChange={setSelectedBackgrounds}
              maxSelections={10}
            />
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">{error}</div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-white/50">
                <span className="text-purple-400 font-semibold">{selectedBackgrounds.length}</span> konsept secildi
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-white/50 hover:text-white">← Geri</button>
                <button
                  onClick={handleGenerate}
                  disabled={selectedBackgrounds.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all"
                >
                  Uretimi Baslat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Processing (polling) ─────────────────────────── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-orange-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Gemini Calisiyor...</h2>
              <p className="text-white/50 text-sm">
                {selectedBackgrounds.length} ev ortami konsepti icin gorseller uretiliyor.
              </p>
              <p className="text-white/30 text-xs">
                Sayfa otomatik guncelleniyor (kontrol #{pollCount})
              </p>
            </div>
            {imageCount > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-3 text-green-300 text-sm">
                {imageCount} gorsel tamamlandi
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs text-white/50 font-mono">n8n Workflow</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 text-white/40">
                  <span className="text-green-400">✓</span>
                  <span>Webhook tetiklendi</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <span className={imageCount > 0 ? 'text-green-400' : 'text-orange-400 animate-pulse'}>
                    {imageCount > 0 ? '✓' : '◉'}
                  </span>
                  <span>Gemini arka plan degisimi {imageCount > 0 ? `(${imageCount} hazir)` : '...'}</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <span className={imageCount > 0 ? 'text-green-400' : 'text-white/20'}>
                    {imageCount > 0 ? '✓' : '○'}
                  </span>
                  <span>Icerik uretimi (baslik, aciklama, etiketler)</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <span className="text-white/20">○</span>
                  <span>Cloudinary yukleme & kayit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ─────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="text-6xl">🎉</div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Uretim Tamamlandi!</h2>
              <p className="text-white/50 text-sm">
                {imageCount} gorsel olusturuldu. Urun detay sayfasindan indirin.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/products/${productId}`}
                className="bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-3 rounded-xl transition-all"
              >
                Urunu Goruntule →
              </Link>
              <button
                onClick={() => {
                  setStep('upload');
                  setProductName('');
                  setReferenceImageUrl('');
                  setSelectedBackgrounds([]);
                  setProductId('');
                  setImageCount(0);
                  setPollCount(0);
                  setError('');
                }}
                className="bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3 rounded-xl transition-all"
              >
                + Yeni Urun
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
