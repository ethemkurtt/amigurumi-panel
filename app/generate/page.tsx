'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import BackgroundSelector from '@/components/BackgroundSelector';

type Step = 'upload' | 'backgrounds' | 'processing' | 'done';

const POSE_OPTIONS = [
  { id: 'sitting', label: 'Oturan', emoji: '🧸' },
  { id: 'standing', label: 'Ayakta', emoji: '🧍' },
  { id: 'lying', label: 'Yatan', emoji: '😴' },
  { id: 'playing', label: 'Oynayan', emoji: '🎮' },
  { id: 'hugging', label: 'Sarilan', emoji: '🤗' },
  { id: 'waving', label: 'El Sallayan', emoji: '👋' },
];

const STYLE_OPTIONS = [
  { id: 'realistic', label: 'Gercekci', emoji: '📸' },
  { id: 'soft-dreamy', label: 'Yumusak', emoji: '☁️' },
  { id: 'bright-vivid', label: 'Canli', emoji: '🌈' },
  { id: 'warm-cozy', label: 'Sicak', emoji: '🕯️' },
  { id: 'minimal-clean', label: 'Minimal', emoji: '✨' },
];

const ANGLE_OPTIONS = [
  { id: 'front', label: 'Ondan', emoji: '⬆️' },
  { id: 'front-45', label: 'On 45°', emoji: '↗️' },
  { id: 'side', label: 'Yandan', emoji: '➡️' },
  { id: 'top-down', label: 'Ustden', emoji: '⬇️' },
  { id: 'low-angle', label: 'Alttan', emoji: '⤴️' },
];

export default function GeneratePage() {
  const [productName, setProductName] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);

  // Gelismis prompt ayarlari
  const [pose, setPose] = useState('sitting');
  const [size, setSize] = useState('25');
  const [style, setStyle] = useState('realistic');
  const [angle, setAngle] = useState('front-45');
  const [extraNotes, setExtraNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        const s = data.settings;
        if (s) {
          setPose(s.defaultPose || 'sitting');
          setSize(s.defaultSize || '25');
          setStyle(s.defaultStyle || 'realistic');
          setAngle(s.defaultAngle || 'front-45');
        }
      })
      .catch(() => {});
  }, []);

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
          promptOptions: { pose, size, style, angle, extraNotes },
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
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-white mb-2">Yeni Urun Olustur</h2>
        <p className="text-white/40 text-sm mb-8">Gorsel yukleyin, ayarlari secin ve AI ile profesyonel urun gorselleri uretin.</p>
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { key: 'upload', label: '1. Gorsel & Ayarlar' },
            { key: 'backgrounds', label: '2. Konsept Sec' },
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

        {/* ── STEP 1: Upload, Name & Prompt Options ───────────────── */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Sol: Gorsel Yukle */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Gorsel Yukle</h2>
                <p className="text-white/50 text-sm">
                  Amigurumi gorseli yukleyin. AI sectiginiz konseptlerde arka plan degistirecek.
                </p>
                <ImageUpload
                  onUpload={(url) => { setReferenceImageUrl(url); setError(''); }}
                  label="Gorsel Yukle"
                />
              </div>

              {/* Sag: Urun Bilgileri */}
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white">Urun Bilgileri</h2>
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

                {/* Hizli Ayarlar */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Boyut */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Boyut</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['15', '20', '25', '30', '40'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

                  {/* Poz */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Poz</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {POSE_OPTIONS.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPose(p.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            pose === p.id
                              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          <span className="text-sm">{p.emoji}</span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stil & Aci - Tek satir */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Stil</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {STYLE_OPTIONS.slice(0, 3).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            style === s.id
                              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          <span className="text-sm">{s.emoji}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Aci</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ANGLE_OPTIONS.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAngle(a.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            angle === a.id
                              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          <span className="text-sm">{a.emoji}</span>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gelismis Ayarlar Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showAdvanced ? '▼ Gelismis Ayarlari Gizle' : '▶ Gelismis Ayarlar'}
                </button>

                {showAdvanced && (
                  <div className="space-y-4 bg-white/[0.03] border border-white/10 rounded-xl p-4">
                    {/* Tum Poz Secenekleri */}
                    <div>
                      <label className="block text-xs text-white/50 mb-2">Tum Pozlar</label>
                      <div className="flex gap-2 flex-wrap">
                        {POSE_OPTIONS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setPose(p.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              pose === p.id
                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                            }`}
                          >
                            <span>{p.emoji}</span>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tum Stil Secenekleri */}
                    <div>
                      <label className="block text-xs text-white/50 mb-2">Tum Stiller</label>
                      <div className="flex gap-2 flex-wrap">
                        {STYLE_OPTIONS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setStyle(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              style === s.id
                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                            }`}
                          >
                            <span>{s.emoji}</span>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tum Aci Secenekleri */}
                    <div>
                      <label className="block text-xs text-white/50 mb-2">Tum Acilar</label>
                      <div className="flex gap-2 flex-wrap">
                        {ANGLE_OPTIONS.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setAngle(a.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              angle === a.id
                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                            }`}
                          >
                            <span>{a.emoji}</span>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ek Notlar */}
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">Ek Notlar (Opsiyonel)</label>
                      <textarea
                        value={extraNotes}
                        onChange={(e) => setExtraNotes(e.target.value)}
                        rows={2}
                        placeholder="orn: Oyuncagin yanina kucuk cicekler ekle, yumusak isik olsun..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-xs focus:outline-none focus:border-purple-400 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Prompt Onizleme */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                  <p className="text-orange-300/60 text-xs font-semibold mb-1">AI Prompt Onizleme</p>
                  <p className="text-orange-300/80 text-xs leading-relaxed">
                    &quot;{productName || '...'} amigurumi, {size}cm, {POSE_OPTIONS.find((p) => p.id === pose)?.label.toLowerCase()} poz,{' '}
                    {STYLE_OPTIONS.find((s) => s.id === style)?.label.toLowerCase()} fotograf,{' '}
                    {ANGLE_OPTIONS.find((a) => a.id === angle)?.label.toLowerCase()} aci
                    {extraNotes ? `. ${extraNotes}` : ''}&quot;
                  </p>
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
                AI sectiginiz konseptlerde arka plan degistirecek. Birden fazla secebilirsiniz.
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
              <h2 className="text-xl font-bold text-white">AI Calisiyor...</h2>
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
                  <span>OpenAI arka plan degisimi {imageCount > 0 ? `(${imageCount} hazir)` : '...'}</span>
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
