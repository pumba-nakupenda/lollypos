
import type { Metadata } from "next";
import { MuseoModerno, Roboto } from "next/font/google";
import "./globals.css";
import ShoppingAssistant from "@/components/ai/ShoppingAssistant";
import MobileNav from "@/components/MobileNav";
import { Providers } from "@/components/Providers";

const museo = MuseoModerno({ 
  subsets: ["latin"],
  variable: "--font-museo",
  weight: "variable"
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "LOLLY SHOP - L'Excellence Beauté & Tech au Sénégal",
  description: "Découvrez l'univers Lolly : Luxya pour la beauté et maroquinerie premium, Homtek pour la tech et papeterie. Livraison express à Dakar et partout au Sénégal.",
  keywords: ["Lolly Shop", "Luxya", "Homtek", "Beauté Sénégal", "Tech Dakar", "Maroquinerie premium", "E-commerce Sénégal", "Boutique Lolly"],
  authors: [{ name: "Lolly Group" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  alternates: {
    canonical: "https://lolly.sn",
  },
  openGraph: {
    title: "LOLLY SHOP - L'Excellence Beauté & Tech",
    description: "Le meilleur de la beauté, maroquinerie et technologie au Sénégal.",
    url: "https://lolly.sn",
    siteName: "Lolly Shop",
    images: [
      {
        url: "/og-image.png", // Ensure this exists or use a generic one
        width: 1200,
        height: 630,
      },
    ],
    locale: "fr_SN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOLLY SHOP - L'Excellence au Sénégal",
    description: "Luxya & Homtek : Votre destination shopping premium à Dakar.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Lolly Group",
    "url": "https://lolly.sn",
    "logo": "https://lolly.sn/icon.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+221772354747",
      "contactType": "customer service",
      "areaServed": "SN",
      "availableLanguage": "French"
    },
    "sameAs": [
      "https://www.instagram.com/lolly_senegal",
      "https://www.facebook.com/lolly.sn"
    ]
  };

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${roboto.variable} ${museo.variable} font-sans antialiased`}>
              <Providers>
                {children}
                <ShoppingAssistant />
              </Providers>
            </body>
    </html>
  );
}
