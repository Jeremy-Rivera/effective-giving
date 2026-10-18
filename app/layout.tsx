import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Jain Philanthropy and Effective Altruism",
  description: "A research study on charitable giving.",
  robots: { index: false, follow: false },
};

// viewport-fit=cover lets the bottom bar on /give use the safe-area insets.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#fdfdfb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Gujarati:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <SiteFrame>{children}</SiteFrame>
        </LocaleProvider>
      </body>
    </html>
  );
}
