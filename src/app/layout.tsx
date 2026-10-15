import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore -- Next.js handles global CSS imports at build time.
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Munsif Khan | AI Engineer Portfolio",
  description: "Portfolio of Munsif Khan, a Software Engineering graduate specializing in Machine Learning, AI, and intelligent applications.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
