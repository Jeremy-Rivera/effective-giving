import type { Metadata, Viewport } from "next";
import { Noto_Serif_Devanagari, Noto_Serif_Gujarati, Source_Serif_4 } from "next/font/google";
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

// Self-hosted at build time (no request to Google from the participant's
// phone, nothing render-blocking). display: swap shows fallback text at once.
// Devanagari and Gujarati are only fetched when those scripts are on screen.
const latin = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], display: "swap", variable: "--font-latin" });
const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["400", "600"], display: "swap", preload: false, variable: "--font-devanagari" });
const gujarati = Noto_Serif_Gujarati({ subsets: ["gujarati"], weight: ["400", "600"], display: "swap", preload: false, variable: "--font-gujarati" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${devanagari.variable} ${gujarati.variable}`}>
      <body>
        <LocaleProvider>
          <SiteFrame>{children}</SiteFrame>
        </LocaleProvider>
      </body>
    </html>
  );
}
