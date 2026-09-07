import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Hangtuah PM — Rise Stronger",
  description:
    "Kanban project management for Hangtuah Jakarta Basketball Club divisions.",
  icons: {
    icon: [
      { url: "/hangtuahpm/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/hangtuahpm/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/hangtuahpm/brand/favicon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${barlow.variable} ${jetbrains.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
