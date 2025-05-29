import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story Buddy - Dein serieller Geschichtenerzähler",
  description: "Ein KI-gestützter Buddy zum Erstellen serieller Geschichten mit Kontext-Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
} 