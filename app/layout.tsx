import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Caveat,
  IBM_Plex_Sans,
  Noto_Naskh_Arabic,
} from "next/font/google";
import { headers } from "next/headers";

import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const displayFont = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const handFont = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const urduFont = Noto_Naskh_Arabic({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
      ?.split(",")[0]
      .trim() ?? "localhost:3001";
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: {
      default: "LumpMap 3D — Anatomy-first lump education",
      template: "%s | LumpMap 3D",
    },
    description:
      "An educational 3D anatomy navigator for common superficial lumps. Learn what may be happening beneath the skin and when to seek care.",
    applicationName: "LumpMap 3D",
    keywords: [
      "skin lump education",
      "3D anatomy",
      "pilonidal disease",
      "ingrown hair",
      "skin abscess",
    ],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "Not every lump is a cyst. | LumpMap 3D",
      description:
        "Explore common skin lumps by location, depth, and symptoms—then learn what kind of care may be appropriate.",
      siteName: "LumpMap 3D",
      images: [
        {
          url: "/og.png",
          width: 1731,
          height: 909,
          alt: "A calm educational skin cutaway showing a superficial lump beside a hair follicle.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Not every lump is a cyst. | LumpMap 3D",
      description:
        "Anatomy-first health education, from body location to beneath the skin.",
      images: ["/og.png"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f0e5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${handFont.variable} ${urduFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
