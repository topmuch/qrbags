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
  metadataBase: new URL("https://qrbags.com"),
  title: {
    default: "QRBags — Retrouver une valise perdue à l'aéroport | Objets trouvés",
    template: "%s | QRBags",
  },
  description: "Valise perdue à l'aéroport ? QRBags est l'étiquette QR intelligente pour retrouver vos bagages perdus et vos objets trouvés. Sans application, sans batterie, sans GPS. France, Belgique, Suisse, Luxembourg, Canada et Afrique francophone.",
  keywords: [
    "valise perdue", "valise perdue aéroport", "bagage perdu", "bagage aéroport",
    "objets trouvés", "objets trouvés aéroport", "valise trouvée", "retrouver valise",
    "retrouver bagage perdu", "étiquette bagage", "étiquette valise", "étiquette QR bagage",
    "suivi bagage", "localiser valise", "QR code bagage", "protection bagage",
    "bagage hajj", "étiquette bagage hajj", "omra", "pèlerinage",
    "QR", "bagage", "voyage", "hajj", "sticker", "luggage", "travel",
  ],
  authors: [{ name: "QRBags Team" }],
  creator: "MMASOLUTION",
  publisher: "QRBags",

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#ffffff" },
    ],
  },

  // Open Graph
  openGraph: {
    title: "QRBags — Retrouver une valise perdue à l'aéroport",
    description: "Étiquette QR intelligente pour retrouver vos bagages perdus et vos objets trouvés. Sans application, sans batterie, sans GPS. Un scan suffit.",
    url: "https://qrbags.com",
    siteName: "QRBags",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "QRBags — Étiquette QR pour bagages",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "QRBags - Protection intelligente des bagages",
    description: "Un autocollant QR intelligent pour protéger vos effets personnels.",
    images: ["/icons/icon-512x512.png"],
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "QRBags",
  appleWebApp: {
    capable: true,
    title: "QRBags",
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
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Alternates — hreflang : le site est en français, servi à toute la francophonie
  alternates: {
    canonical: "/",
    languages: {
      fr: "https://qrbags.com",
      "x-default": "https://qrbags.com",
    },
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
        <meta name="apple-mobile-web-app-title" content="QRBags" />
        <meta name="application-name" content="QRBags" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA manifest & apple-touch-icon */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* 🎯 SEO — Données structurées JSON-LD (Organization + WebSite) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://qrbags.com/#organization",
                  name: "QRBags",
                  url: "https://qrbags.com",
                  logo: { "@type": "ImageObject", url: "https://qrbags.com/icons/icon-512x512.png" },
                  email: "contact@qrbags.com",
                  description: "Étiquettes QR intelligentes pour retrouver les bagages perdus et les objets trouvés à l'aéroport.",
                  areaServed: [
                    "FR", "BE", "CH", "LU", "CA", "SN", "CI", "ML", "BF", "NE", "TG", "BJ", "GN", "CM", "GA", "CG", "CD", "MA", "DZ", "TN", "SA", "AE",
                  ],
                  sameAs: [
                    "https://facebook.com/qrbags",
                    "https://instagram.com/qrbags",
                    "https://twitter.com/qrbags",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://qrbags.com/#website",
                  url: "https://qrbags.com",
                  name: "QRBags",
                  publisher: { "@id": "https://qrbags.com/#organization" },
                  inLanguage: "fr",
                },
              ],
            }),
          }}
        />
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
