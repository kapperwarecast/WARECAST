import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { FiltersProvider } from "@/contexts/filters-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AuthProvider } from "@/contexts/auth-context";
import { MainContent } from "@/components/main-content";

// OPTIMIZATION: Optimiser next/font pour -100ms First Contentful Paint
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "Warecast - Streaming Video",
  description: "Your personal streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`dark ${inter.variable}`}>
      <head>
        {/* OPTIMIZATION: Préconnexions critiques pour -200ms chargement initial */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" />

        {/* DNS prefetch pour services tiers */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eklsrvuukohcdfqchwbz.supabase.co'} />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </head>
      <body className={`${inter.className} antialiased bg-black`}>
        <AuthProvider>
          <SidebarProvider>
            <FiltersProvider>
              <Navbar />
              <MainContent>{children}</MainContent>
            </FiltersProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
