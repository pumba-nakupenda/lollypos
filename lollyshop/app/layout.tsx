
import type { Metadata } from "next";
import { MuseoModerno, Roboto } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProductProvider } from "@/context/ProductContext";
import { AiProvider } from "@/context/AiContext";

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
  title: "LOLLY SHOP - L'Excellence",
  description: "La boutique officielle du groupe Lolly.",
};

import ShoppingAssistant from "@/components/ai/ShoppingAssistant";
import MobileNav from "@/components/MobileNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
            <body className={`${roboto.variable} ${museo.variable} font-sans antialiased`}>
              <CartProvider>
                <WishlistProvider>
                  <ProductProvider>
                    <AiProvider>
                      {children}
                      <ShoppingAssistant />
                      <MobileNav />
                    </AiProvider>
                  </ProductProvider>
                </WishlistProvider>
              </CartProvider>
            </body>
    </html>
  );
}
