'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/generate', label: 'Olustur', icon: '🧶' },
  { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();

  // Urun detay sayfalarinda gosterme
  if (pathname.startsWith('/products/')) return null;

  return (
    <nav className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">🧸</span>
          <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
            Amigurumi Panel
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-300 px-2.5 py-1 rounded-full">
            OpenAI
          </span>
        </div>
      </div>
    </nav>
  );
}
