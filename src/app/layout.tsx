import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storybuddy - Dein Partner für die Entwicklung von großartigen Geschichten",
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