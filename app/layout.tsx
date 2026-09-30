import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://enterthearena.com"),
  title: "The Arena | Action Gaming Anime",
  description:
    "SNK's transmedia universe — King of Fighters, Fatal Fury, Metal Slug, and Samurai Shodown. Games, anime, comics, and the global FGC community.",
  keywords: [
    "The Arena",
    "Arena SNK",
    "SNK games",
    "King of Fighters",
    "Fatal Fury",
    "Fatal Fury City of the Wolves",
    "Metal Slug",
    "Samurai Shodown",
    "anime games",
    "fighting games",
    "FGC",
    "transmedia entertainment",
    "Erik Feig",
    "Matt Reilly",
    "Markus Gerdemann",
    "Crunchyroll",
    "Netflix anime",
    "Picturestart",
    "Summit Entertainment",
    "Warner Brothers Entertainment",
    "Dr. Stone",
    "Naruto",
    "action anime",
    "esports",
    "2D fighting game",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://enterthearena.com",
    languages: {
      en: "https://enterthearena.com",
      "x-default": "https://enterthearena.com",
    },
  },
  openGraph: {
    title: "The Arena | Action Gaming Anime",
    description: "Iconic action franchises. Prestige animation. Global community. Enter The Arena.",
    url: "https://enterthearena.com",
    siteName: "The Arena",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/OG-Image.png",
        width: 1200,
        height: 630,
        alt: "The Arena — Action Gaming Anime",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Arena | Action Gaming Anime",
    description: "Iconic action franchises. Prestige animation. Global community. Enter The Arena.",
    images: ["/OG-Image.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "The Arena",
              alternateName: "Arena SNK",
              url: "https://enterthearena.com",
              logo: "https://enterthearena.com/icon.png",
              foundingDate: "2024",
              description:
                "Transmedia entertainment studio built on 35 years of SNK's iconic action IP.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Los Angeles",
                addressCountry: "US",
              },
              sameAs: [
                "https://instagram.com/thearena",
                "https://tiktok.com/@thearenahq",
                "https://youtube.com/@TheArenaSNK",
                "https://discord.gg/thearena",
              ],
              member: [
                {
                  "@type": "Person",
                  name: "Erik Feig",
                  jobTitle: "Co-Founder",
                  worksFor: { "@type": "Organization", name: "The Arena" },
                },
                {
                  "@type": "Person",
                  name: "Matt Reilly",
                  jobTitle: "Co-Founder",
                  worksFor: { "@type": "Organization", name: "The Arena" },
                },
                {
                  "@type": "Person",
                  name: "Markus Gerdemann",
                  jobTitle: "President of Marketing & Brand",
                  worksFor: { "@type": "Organization", name: "The Arena" },
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Arena",
              url: "https://enterthearena.com",
              description:
                "SNK's transmedia action universe — home to King of Fighters, Fatal Fury, Metal Slug, Samurai Shodown, anime, and the global FGC community.",
              publisher: {
                "@type": "Organization",
                name: "The Arena",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full overflow-hidden bg-black text-white">{children}</body>
    </html>
  );
}
