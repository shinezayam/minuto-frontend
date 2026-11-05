import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Minuto — Монгол хэлний хурлын AI туслах",
  description:
    "Хурлаа бичээд, шийдвэр, үүрэг даалгавар бүхий хурлын тэмдэглэлийг AI-аар автоматаар гаргаарай. Монгол хэлэнд зориулсан.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className={`${inter.variable} ${manrope.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
