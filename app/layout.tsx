import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NodNexa Studio — De referencia a guion",
  description: "Convierte referencias de contenido en guiones originales con la voz de cada marca.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "NodNexa Studio", description: "De referencia a guion con voz de marca.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${manrope.variable} ${newsreader.variable}`}>{children}</body></html>;
}
