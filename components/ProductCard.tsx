'use client';

import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  referenceImageUrl: string;
  generatedImages: { url: string; backgroundLabel: string }[];
  title: string;
  status: 'draft' | 'generating' | 'completed';
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  draft: { label: 'Taslak', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  generating: { label: 'Üretiliyor...', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Tamamlandı', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const status = statusConfig[product.status] || statusConfig.draft;
  const thumbUrl = product.referenceImageUrl;
  const imageCount = product.generatedImages?.length || 0;

  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/40 hover:bg-white/8 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-black/20">
        <img
          src={thumbUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
          {product.status === 'generating' && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse mr-1" />
          )}
          {status.label}
        </div>
        {/* Image count */}
        {imageCount > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white">
            📸 {imageCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm truncate">{product.name}</h3>
        {product.title && (
          <p className="text-white/40 text-xs mt-1 truncate">{product.title}</p>
        )}
        <p className="text-white/30 text-xs mt-2">
          {new Date(product.createdAt).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link
            href={`/products/${product._id}`}
            className="flex-1 text-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-medium py-2 rounded-lg transition-all"
          >
            Detay →
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(product._id)}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
