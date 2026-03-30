'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface Product {
  _id: string;
  name: string;
  referenceImageUrl: string;
  generatedImages: { url: string; backgroundLabel: string }[];
  title: string;
  status: 'draft' | 'generating' | 'completed';
  createdAt: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'generating' | 'completed'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-refresh when there are generating products
  useEffect(() => {
    const hasGenerating = products.some((p) => p.status === 'generating');
    if (!hasGenerating) return;
    const interval = setInterval(loadProducts, 5000);
    return () => clearInterval(interval);
  }, [products]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert('Silme işlemi başarısız');
    }
  };

  const filtered = filter === 'all' ? products : products.filter((p) => p.status === filter);

  const stats = {
    total: products.length,
    completed: products.filter((p) => p.status === 'completed').length,
    generating: products.filter((p) => p.status === 'generating').length,
    images: products.reduce((acc, p) => acc + (p.generatedImages?.length || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧶</span>
            <div>
              <h1 className="text-lg font-bold text-white">Amigurumi Panel</h1>
              <p className="text-xs text-white/40">AI Görsel Üretim Sistemi</p>
            </div>
          </div>
          <Link
            href="/generate"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 text-sm"
          >
            <span>+</span> Yeni Ürün
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam Ürün', value: stats.total, icon: '📦', color: 'from-purple-500/20 to-purple-600/20' },
            { label: 'Tamamlanan', value: stats.completed, icon: '✅', color: 'from-green-500/20 to-green-600/20' },
            { label: 'Üretiliyor', value: stats.generating, icon: '⚡', color: 'from-blue-500/20 to-blue-600/20' },
            { label: 'Toplam Görsel', value: stats.images, icon: '🖼️', color: 'from-pink-500/20 to-pink-600/20' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-2xl p-4`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">Ürünler</h2>
          <div className="flex gap-2">
            {(['all', 'draft', 'generating', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${filter === f ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                {f === 'all' ? 'Tümü' : f === 'draft' ? 'Taslak' : f === 'generating' ? 'Üretiliyor' : 'Tamamlandı'}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-6xl opacity-30">🧶</div>
            <div className="text-center">
              <p className="text-white/50 text-lg font-medium">
                {filter === 'all' ? 'Henüz ürün yok' : 'Bu kategoride ürün yok'}
              </p>
              <p className="text-white/30 text-sm mt-1">Yeni bir amigurumi ürünü oluşturmak için başlayın</p>
            </div>
            {filter === 'all' && (
              <Link href="/generate" className="bg-purple-500 hover:bg-purple-400 text-white font-medium px-6 py-3 rounded-xl transition-all">
                İlk Ürününü Oluştur 🚀
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
