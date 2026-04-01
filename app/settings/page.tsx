'use client';

import { useState, useEffect } from 'react';

const POSE_OPTIONS = [
  { id: 'sitting', label: 'Oturan', emoji: '🧸', desc: 'Klasik oturma pozu' },
  { id: 'standing', label: 'Ayakta', emoji: '🧍', desc: 'Dik duran poz' },
  { id: 'lying', label: 'Yatan', emoji: '😴', desc: 'Yan yatmis poz' },
  { id: 'playing', label: 'Oynayan', emoji: '🎮', desc: 'Oyun oynayan poz' },
  { id: 'hugging', label: 'Sarilan', emoji: '🤗', desc: 'Kucaklama pozu' },
  { id: 'waving', label: 'El Sallayan', emoji: '👋', desc: 'Selam veren poz' },
];

const STYLE_OPTIONS = [
  { id: 'realistic', label: 'Gercekci', emoji: '📸', desc: 'Gercek fotografa en yakin' },
  { id: 'soft-dreamy', label: 'Yumusak & Ruya', emoji: '☁️', desc: 'Pastel, ruya gibi' },
  { id: 'bright-vivid', label: 'Canli & Parlak', emoji: '🌈', desc: 'Parlak renkler, yuksek kontrast' },
  { id: 'warm-cozy', label: 'Sicak & Samimi', emoji: '🕯️', desc: 'Sicak tonlar, samimi atmosfer' },
  { id: 'minimal-clean', label: 'Minimal & Temiz', emoji: '✨', desc: 'Sade, temiz gorunum' },
];

const ANGLE_OPTIONS = [
  { id: 'front', label: 'Ondan', emoji: '⬆️' },
  { id: 'front-45', label: 'On 45°', emoji: '↗️' },
  { id: 'side', label: 'Yandan', emoji: '➡️' },
  { id: 'top-down', label: 'Ustden', emoji: '⬇️' },
  { id: 'low-angle', label: 'Alttan', emoji: '⤴️' },
];

interface SettingsData {
  defaultPose: string;
  defaultSize: string;
  defaultStyle: string;
  defaultAngle: string;
  promptRules: string;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultTags: string[];
  defaultPdfPrompt: string;
  shopName: string;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'content' | 'pdf' | 'shop'>('prompt');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setTagsInput(data.settings.defaultTags?.join(', ') || '');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    const payload = {
      ...settings,
      defaultTags: tagsInput
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean),
    };

    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (key: keyof SettingsData, value: string | string[]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Ayarlar</h2>
            <p className="text-white/40 text-sm mt-1">Varsayilan prompt, baslik, aciklama ve magaza ayarlari</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : saved ? (
              <>
                <span className="text-green-300">✓</span> Kaydedildi
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8">
          {[
            { key: 'prompt' as const, label: 'Gorsel Uretim', icon: '🎨' },
            { key: 'content' as const, label: 'Baslik & Aciklama', icon: '📝' },
            { key: 'pdf' as const, label: 'PDF Duzenleme', icon: '📄' },
            { key: 'shop' as const, label: 'Magaza', icon: '🏪' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Gorsel Uretim Ayarlari ──────────────────────── */}
        {activeTab === 'prompt' && (
          <div className="space-y-8">
            {/* Varsayilan Poz */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Varsayilan Poz</h3>
              <p className="text-white/40 text-xs mb-4">Urun gorseli olusturulurken kullanilacak varsayilan poz</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {POSE_OPTIONS.map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => update('defaultPose', pose.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      settings.defaultPose === pose.id
                        ? 'bg-purple-500/15 border-purple-500/40 text-white'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{pose.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{pose.label}</div>
                      <div className="text-xs text-white/40">{pose.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Varsayilan Boyut */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Varsayilan Boyut (cm)</h3>
              <p className="text-white/40 text-xs mb-4">Urunun yaklasik yuksekligi - prompt ve aciklamada kullanilir</p>
              <div className="flex gap-3 flex-wrap">
                {['15', '20', '25', '30', '35', '40'].map((size) => (
                  <button
                    key={size}
                    onClick={() => update('defaultSize', size)}
                    className={`px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
                      settings.defaultSize === size
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                        : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {size} cm
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={
                      ['15', '20', '25', '30', '35', '40'].includes(settings.defaultSize)
                        ? ''
                        : settings.defaultSize
                    }
                    onChange={(e) => update('defaultSize', e.target.value)}
                    placeholder="Ozel"
                    className="w-24 bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-white/40 text-sm">cm</span>
                </div>
              </div>
            </section>

            {/* Varsayilan Stil */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Fotograf Stili</h3>
              <p className="text-white/40 text-xs mb-4">Gorsel uretiminde kullanilacak genel stil</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => update('defaultStyle', style.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      settings.defaultStyle === style.id
                        ? 'bg-purple-500/15 border-purple-500/40 text-white'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{style.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{style.label}</div>
                      <div className="text-xs text-white/40">{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Varsayilan Aci */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Kamera Acisi</h3>
              <p className="text-white/40 text-xs mb-4">Varsayilan fotograf acisi</p>
              <div className="flex gap-3 flex-wrap">
                {ANGLE_OPTIONS.map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => update('defaultAngle', angle.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
                      settings.defaultAngle === angle.id
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                        : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    <span>{angle.emoji}</span>
                    {angle.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Prompt Kurallari */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Prompt Kurallari</h3>
              <p className="text-white/40 text-xs mb-4">
                Her gorsel uretiminde eklenen temel kurallar. Oyuncagin bozulmamasini, gercekcilik seviyesini vs. buradan ayarlayin.
              </p>
              <textarea
                value={settings.promptRules}
                onChange={(e) => update('promptRules', e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() =>
                    update(
                      'promptRules',
                      'Keep the amigurumi toy EXACTLY as it is - do not modify, reshape, or distort the toy in any way. Only change the background. The toy should look like a real handmade crochet product. Professional Etsy product photography style. Soft natural lighting.'
                    )
                  }
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors"
                >
                  Varsayilana Sifirla
                </button>
                <button
                  onClick={() =>
                    update(
                      'promptRules',
                      settings.promptRules +
                        '\nMake the lighting warm and golden. Add subtle bokeh effect in background. The scene should feel cozy and inviting.'
                    )
                  }
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors"
                >
                  + Sicak Isik Ekle
                </button>
                <button
                  onClick={() =>
                    update(
                      'promptRules',
                      settings.promptRules +
                        '\nEnsure ultra-high realism. The image should be indistinguishable from a real professional product photograph.'
                    )
                  }
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors"
                >
                  + Ultra Gercekcilik
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── TAB: Baslik & Aciklama Sablonlari ─────────────────── */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Baslik Sablonu */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Baslik Sablonu</h3>
              <p className="text-white/40 text-xs mb-4">
                Referans baslik. GPT bunu ornek alip her urun icin uyarlar. Maksimum 140 karakter.
              </p>
              <textarea
                value={settings.titleTemplate}
                onChange={(e) => update('titleTemplate', e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/40">Ornek Basliklar (tiklayarak kullan):</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    'Amigurumi Horse Crochet Pattern – Low Sew Farm Animal (PDF Pattern)',
                    'Cute Bunny Amigurumi Crochet Pattern | Handmade Stuffed Animal PDF Tutorial',
                    'Adorable Cat Amigurumi Pattern – Easy Crochet Toy PDF | Beginner Friendly',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => update('titleTemplate', tpl)}
                      className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/50 hover:text-white/80 transition-colors text-left"
                    >
                      {tpl.substring(0, 70)}...
                    </button>
                  ))}
                </div>
              </div>
              {/* Bilgi */}
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-blue-300/60">
                  💡 GPT bu basligi referans alir ve urun adina gore uyarlar. Ornegin "Horse" yerine "Cat" yazarsa baslik otomatik degisir.
                </p>
              </div>
            </section>

            {/* Aciklama Sablonu */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Aciklama Sablonu</h3>
              <p className="text-white/40 text-xs mb-4">
                Referans aciklama. GPT bunu ornek alip her urun icin format, emoji ve yapiya sadik kalarak uyarlar.
              </p>
              <textarea
                value={settings.descriptionTemplate}
                onChange={(e) => update('descriptionTemplate', e.target.value)}
                rows={12}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none font-mono"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    update(
                      'descriptionTemplate',
                      '🐴 Amigurumi Horse Crochet Pattern – PDF Tutorial\n\nThis adorable Amigurumi Horse Crochet Pattern is a perfect project for both beginners and experienced crocheters. With step-by-step instructions, detailed explanations, and clear guidance, you can easily create this cute, soft, and farm-themed horse plush. It\'s a wonderful choice for children, nursery décor, farm animal lovers, or anyone who enjoys collecting cute handmade plushies!\n\n📥 What\'s Included in the PDF\n\n🧶 Step-by-step written instructions\n📸 Clear reference photos\n✂️ Materials and tools list\n🪡 Hook size and yarn details\n🐣 Beginner-friendly techniques explained simply\n\nYou can print the pattern as many times as you like and reuse it whenever needed.\n\n⭐ Skill Level\nBeginner – Intermediate\nAnyone familiar with basic stitches, increases, and decreases can easily complete this project.\n\n📦 Instant Digital Download\nOnce your payment is completed, you can instantly access your PDF file.\nYour pattern will always be available in your Etsy Purchases & Reviews section.\n\n❤️ Usage & Permissions\nYou may sell the finished items made from this pattern.\nPlease do not share, copy, or resell the pattern itself.\n\n⚠️ IMPORTANT\nThis is a DIGITAL crochet pattern.\nNo physical item will be shipped.\nDigital downloads are non-refundable and cannot be canceled.'
                    )
                  }
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors"
                >
                  Varsayilana Sifirla
                </button>
              </div>
            </section>

            {/* Varsayilan Etiketler */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Varsayilan Etiketler</h3>
              <p className="text-white/40 text-xs mb-4">
                Referans etiketler (virgul ile ayirin). GPT bunlari ornek alip urun adina gore uyarlar.
                Maksimum 13 etiket.
              </p>
              <textarea
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                placeholder="amigurumi, crochet toy, handmade gift..."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {tagsInput
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <p className="mt-2 text-xs text-white/30">
                {tagsInput.split(',').filter((t) => t.trim()).length} / 13 etiket
              </p>
            </section>
          </div>
        )}

        {/* ── TAB: PDF Duzenleme Ayarlari ────────────────────────── */}
        {activeTab === 'pdf' && (
          <div className="space-y-8">
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Varsayilan PDF Prompt</h3>
              <p className="text-white/40 text-xs mb-4">
                Claude AI ile PDF duzenlerken otomatik kullanilacak prompt. Her urun icin ayni prompt yeniden yazmaniza gerek kalmaz.
              </p>
              <textarea
                value={settings.defaultPdfPrompt}
                onChange={(e) => update('defaultPdfPrompt', e.target.value)}
                rows={12}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-blue-300/60">
                  Bu prompt her yeni urun olusturulurken ve urun detay sayfasinda PDF duzenlerken otomatik doldurulur. Urun bazinda degistirebilirsiniz.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ── TAB: Magaza Ayarlari ──────────────────────────────── */}
        {activeTab === 'shop' && (
          <div className="space-y-8">
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-1">Magaza Bilgileri</h3>
              <p className="text-white/40 text-xs mb-4">Etsy magaza bilgileriniz</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Magaza Adi</label>
                  <input
                    type="text"
                    value={settings.shopName}
                    onChange={(e) => update('shopName', e.target.value)}
                    placeholder="orn: MyAmigurumiShop"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Para Birimi</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => update('currency', e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">Gelecek Ozellikler</h3>
              <ul className="text-blue-300/70 text-xs space-y-1.5">
                <li>• Etsy API entegrasyonu ile otomatik listeleme</li>
                <li>• Toplu urun olusturma</li>
                <li>• Fiyatlandirma sablonlari</li>
                <li>• Kargo ayarlari</li>
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
