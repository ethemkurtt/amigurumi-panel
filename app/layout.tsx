import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigurumi Panel – AI Görsel Üretim",
  description: "ChatGPT DALL-E ve Google Gemini ile profesyonel amigurumi ürün görselleri üretin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#0a0a0f] text-white">{children}</body>
    </html>
  );
}
