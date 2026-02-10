import type { Metadata } from "next";
import { Outfit, Geist_Mono, MuseoModerno } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const museo = MuseoModerno({
  variable: "--font-museo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUXYA POS | Gestion Lolly",
  description: "Système de vente premium pour Lolly",
};

import { ShopProvider } from "@/context/ShopContext";
import { UserProvider, UserProfile } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/Sidebar";
import GlobalLoader from "@/components/GlobalLoader";
import AiFloatingButton from "@/components/AiFloatingButton";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  
  let user = null;
  try {
     const { data, error: authError } = await supabase.auth.getUser();
     if (!authError && data?.user) {
        user = data.user;
     }
  } catch (e) {
     console.error('[RootLayout] Auth check crashed');
  }

  let initialProfile: UserProfile | null = null;
  if (user) {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*, has_stock_access')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && data) {
        initialProfile = data;
      } else if (!data && !profileError) {
        // SECURITY: New users are CASHIERS by default now
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: user.id, email: user.email, role: 'cashier', has_stock_access: false }])
          .select().maybeSingle();
        initialProfile = newProfile;
      }
    } catch (err) {
      console.error('[RootLayout] Profile logic crashed');
    }
  }

  const isCashier = initialProfile?.role === 'cashier';

  return (
    <html lang="fr" className="dark">
      <body
        className={`${outfit.variable} ${geistMono.variable} ${museo.variable} antialiased selection:bg-shop/30 overflow-x-hidden`}
      >
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-shop/10 via-background to-background" />
        <Suspense fallback={<GlobalLoader />}>
          <ToastProvider>
            <UserProvider initialProfile={initialProfile}>
              <ShopProvider>
                <div className="flex min-h-screen relative">
                  {!isCashier && <Sidebar />}
                  <main className={`flex-1 min-w-0 overflow-y-auto ${isCashier ? 'w-full' : ''}`}>
                    {children}
                  </main>
                  {!isCashier && <AiFloatingButton />}
                </div>
              </ShopProvider>
            </UserProvider>
          </ToastProvider>
        </Suspense>
      </body>
    </html>
  );
}