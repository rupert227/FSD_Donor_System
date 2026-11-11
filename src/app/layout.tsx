import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Sans } from "next/font/google";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "Caritas Manila - FSD Donor System",
  description: "Caritas Manila Foundation Support Division Donor System",
  icons: {
    icon: [
      { url: "/caritas_icon.png", type: "image/png" },
    ],
    shortcut: "/caritas_icon.png",
    apple: "/caritas_icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
