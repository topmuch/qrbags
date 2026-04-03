import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/pwa-registration";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QRBag - Protection intelligente des bagages",
    template: "%s | QRBag",
  },
  description: "Protégez vos bagages avec un autocollant QR intelligent. Sans application, sans batterie, sans GPS. Un seul scan pour la tranquillité d'esprit.",
  keywords: ["QR", "bagage", "voyage", "hajj", "protection", "sticker", "luggage", "travel", "pèlerinage"],
  authors: [{ name: "QRBag Team" }],
  creator: "MMASOLUTION",
  publisher: "QRBag",
  metadataBase: new URL("https://qrbag.com"),

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#ff7f00" },
    ],
  },

  // Open Graph
  openGraph: {
    title: "QRBag - Protection intelligente des bagages",
    description: "Un autocollant QR intelligent pour protéger vos effets personnels. Sans application. Sans batterie. Sans GPS.",
    url: "https://qrbag.com",
    siteName: "QRBag",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "QRBag Logo",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "QRBag - Protection intelligente des bagages",
    description: "Un autocollant QR intelligent pour protéger vos effets personnels.",
    images: ["/icons/icon-512x512.png"],
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "QRBag",
  appleWebApp: {
    capable: true,
    title: "QRBag",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px)" },
    ],
  },

  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Other
  robots: {
    index: true,
    follow: true,
  },

  // Alternates
  alternates: {
    canonical: "https://qrbag.com",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme script - runs before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QRBag" />
        <meta name="application-name" content="QRBag" />
        <meta name="msapplication-TileColor" content="#ff7f00" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Google Site Verification */}
        <meta name="google-site-verification" content="google89137c0360e6b581.html" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
