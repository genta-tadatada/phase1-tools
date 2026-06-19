import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP, Space_Grotesk, M_PLUS_Rounded_1c, Quicksand } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const mPlusRounded1c = M_PLUS_Rounded_1c({
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ただただ — すべて、タダで。いますぐ、使える。",
  description: "便利なツール・一問一答クイズ・ブラウザゲームを、タダで、いますぐ。広告控えめ・完全無料。",
  manifest: "/manifest.json",
  metadataBase: new URL("https://tadatada.net"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "ただただ",
    title: "ただただ — すべて、タダで。いますぐ、使える。",
    description: "便利なツール・一問一答クイズ・ブラウザゲームを、タダで、いますぐ。広告控えめ・完全無料。",
    url: "https://tadatada.net",
    images: [{ url: "/assets/ogp-default.jpg", width: 1200, height: 630, alt: "ただただ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ただただ — すべて、タダで。いますぐ、使える。",
    description: "便利なツール・一問一答クイズ・ブラウザゲームを、タダで、いますぐ。",
    images: ["/assets/ogp-default.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151b26", // manifest.json の theme_color と一致させる
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansJP.variable} ${spaceGrotesk.variable} ${mPlusRounded1c.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster />
          <PWAInstallBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
