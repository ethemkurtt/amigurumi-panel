import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Amigurumi Panel – AI Gorsel Uretim",
  description: "OpenAI GPT Image ile profesyonel amigurumi urun gorselleri uretin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
