import type { Metadata } from "next";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/lib/auth-context";
import { FavoritesProvider } from "@/lib/favorites-context";

export const metadata: Metadata = {
  title: "Jobeller",
  description: "Jobeller",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <FavoritesProvider>
            <SiteHeader />
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
