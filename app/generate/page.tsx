'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import BackgroundSelector, { SelectedConcept } from '@/components/BackgroundSelector';

type Step = 'upload' | 'backgrounds' | 'processing' | 'done';

export default function GeneratePage() {
  const [productName, setProductName] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [selectedConcepts, setSelectedConcepts] = useState<SelectedConcept[]>([]);
  const [size, setSize] = useState('25');
  const [extraNotes, setExtraNotes] = useState('');

  const [step, setStep] = useState<Step>('upload');
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  // Ayarlardan varsayilanlari yukle
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.defaultSize) setSize(data.settings.defaultSize);
      })
      .catch(() => {});
  }, []);

  // Step 1 → 2
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

  // Step 2 → 3
  const handleGenerate = async () => {
    if (selectedConcepts.length === 0) { setError('En az 1 konsept sec'); return; }
    setError('');
    setStep('processing');

    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          concepts: selectedConcepts,
          type: 'generate',
          promptOptions: { size, extraNotes },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'n8n tetiklenemedi');
      setStep('backgrounds');
    }
  };

  // Poll
  const pollStatus = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (!res.ok) return;
      const p = data.product;
      setImageCount(p.generatedImages?.length || 0);
      if (p.status === 'completed') setStep('done');
      else if (p.lastError) { setError(p.lastError); setStep('backgrounds'); }
    } catch {}
    setPollCount((c) => c + 1);
  }, [productId]);

  useEffect(() => {
    if (step !== 'processing') return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [step, pollStatus]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-white mb-1">Yeni Urun Olustur</h2>
        <p className="text-white/40 text-sm mb-8">Gorsel yukle, konseptleri sec, her birine ozel ayar yap.</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { key: 'upload', label: '1. Gorsel & Bilgi' },
            { key: 'backgrounds', label: '2. Konsept & Varyant' },
            { key: 'processing', label: '3. AI Isliyor' },
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

        {/* ── STEP 1 ──────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Gorsel Yukle</h3>
                <p className="text-white/50 text-sm">Amigurumi gorseli yukleyin.</p>
                <ImageUpload
                  onUpload={(url) => { setReferenceImageUrl(url); setError(''); }}
                  label="Gorsel Yukle"
                />
              </div>
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-white">Urun Bilgileri</h3>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Urun Adi *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="orn: Zebra, Tavsan, Kedi..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Boyut (cm)</label>
                  <div className="flex gap-2 flex-wrap">
                    {['15', '20', '25', '30', '35', '40'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          size === s
                            ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                            : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        {s}cm
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Ek Notlar (opsiyonel)</label>
                  <textarea
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    rows={2}
                    placeholder="orn: Sicak isik olsun, yumusak tonlar kullan..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-300/70 text-xs font-semibold mb-2">Nasil Calisir?</p>
                  <ol className="text-blue-300/60 text-xs space-y-1 list-decimal list-inside">
                    <li>Gorseli yukleyin ve urun adini girin</li>
                    <li>30+ ev ortami konseptinden secin</li>
                    <li>Her konsepte ozel varyant ayarlayin (mesafe, aci, boyut...)</li>
                    <li>AI her biri icin ayri gorsel uretir</li>
                  </ol>
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
                Konseptleri Sec →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ──────────────────────────────────────────────── */}
        {step === 'backgrounds' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Konsept & Varyant Sec</h3>
              <p className="text-white/50 text-sm">
                Konseptleri sec, sonra her birine &quot;Ayarla&quot; butonuyla ozel varyant ata (mesafe, aci, boyut, poz, detay).
              </p>
            </div>
            <BackgroundSelector
              selected={selectedConcepts}
              onChange={setSelectedConcepts}
              maxSelections={30}
            />
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">{error}</div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-white/50">
                <span className="text-purple-400 font-semibold">{selectedConcepts.length}</span> konsept secildi
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-white/50 hover:text-white">← Geri</button>
                <button
                  onClick={handleGenerate}
                  disabled={selectedConcepts.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all"
                >
                  {selectedConcepts.length} Gorsel Uret
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 ──────────────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-orange-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">AI Calisiyor...</h2>
              <p className="text-white/50 text-sm">
                {selectedConcepts.length} konsept icin gorseller uretiliyor.
              </p>
              <p className="text-white/30 text-xs">kontrol #{pollCount}</p>
            </div>
            {imageCount > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-3 text-green-300 text-sm">
                {imageCount}/{selectedConcepts.length} gorsel tamamlandi
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 ──────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="text-6xl">🎉</div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Uretim Tamamlandi!</h2>
              <p className="text-white/50 text-sm">{imageCount} gorsel olusturuldu.</p>
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
                  setSelectedConcepts([]);
                  setProductId('');
                  setImageCount(0);
                  setPollCount(0);
                  setError('');
                  setExtraNotes('');
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
