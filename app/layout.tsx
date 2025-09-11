import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { FiltersProvider } from "@/contexts/filters-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { MainContent } from "@/components/main-content";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="fr" className="dark">
      <body className={`${inter.className} antialiased bg-black`}>
        <SidebarProvider>
          <FiltersProvider>
            <Navbar />
            <MainContent>{children}</MainContent>
          </FiltersProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
