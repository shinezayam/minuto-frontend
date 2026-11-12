import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Minuto — Монгол хэлний хурлын AI туслах",
    template: "%s | Minuto",
  },
  description:
    "Хурлаа бичээд, шийдвэр, үүрэг даалгавар бүхий хурлын тэмдэглэлийг AI-аар автоматаар гаргаарай. Монгол хэлэнд зориулсан.",
  keywords: [
    "хурлын тэмдэглэл",
    "AI meeting assistant",
    "Mongolian speech to text",
    "хурлын бичвэр",
    "meeting minutes",
    "transcription",
  ],
  authors: [{ name: "Гэрэгэ Системс" }],
  creator: "Minuto",
  publisher: "Гэрэгэ Системс ХХК",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "https://mongolian-ai-minutes.vercel.app",
    siteName: "Minuto",
    title: "Minuto — Монгол хэлний хурлын AI туслах",
    description:
      "Хурлаа бичээд, шийдвэр, үүрэг даалгавар бүхий хурлын тэмдэглэлийг AI-аар автоматаар гаргаарай.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Minuto - AI Meeting Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minuto — Монгол хэлний хурлын AI туслах",
    description:
      "Хурлаа бичээд, шийдвэр, үүрэг даалгавар бүхий хурлын тэмдэглэлийг AI-аар автоматаар гаргаарай.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${inter.variable} ${manrope.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://tokenhub.mn" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
