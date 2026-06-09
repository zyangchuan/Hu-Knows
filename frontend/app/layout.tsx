import type { Metadata, Viewport } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "胡 Hu Knows or Don't Know",
  description:
    "Anti-scam Mahjong game for Singapore — learn scam defence while playing!",
  // "Add to Home Screen" runs fullscreen (no Safari address/menu bar).
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hu Knows" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a1f0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      "",
    authCookieName:
      process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ||
      process.env.AUTH_COOKIE_NAME ||
      "access_token",
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;700&family=JetBrains+Mono:wght@600&display=swap"
          rel="stylesheet"
        />
        <script
          id="hu-runtime-config"
          dangerouslySetInnerHTML={{
            __html: `window.__HU_CONFIG__=${JSON.stringify(runtimeConfig).replace(/</g, "\\u003c")};`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
