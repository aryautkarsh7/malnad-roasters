import "./globals.css";
import { Newsreader, Instrument_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  title: { default: "Malnad Roasters", template: "%s | Malnad Roasters" },
  description: "Single-origin and blended coffee from Karnataka, roasted in small batches.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f4ef",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <Header />
          <main className="page">{children}</main>
          <footer className="footer">
            Malnad Roasters is a demo storefront. Payments are simulated and no orders are shipped.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
