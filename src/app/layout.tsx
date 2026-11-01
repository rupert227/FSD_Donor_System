import "./globals.css";
import { IBM_Plex_Sans, Poppins } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Caritas Manila",
    template: "%s",
  },
};

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
