import { Syne, Space_Grotesk, Space_Mono, Plus_Jakarta_Sans, Orbitron } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "PRJ TRAP VAULT | Monochromatic Streetwear Store",
  description: "Exclusive premium streetwear collections. Shop our curated range of signature hoodies, oversized tees, and tactical cargo pants. Secure payment gateway in Naira via Paystack.",
  keywords: "streetwear, trap vault, clothing store, nigeria fashion, black and white clothing, hoodies, cargo pants",
  icons: {
    icon: "/prj-logo.jpg",
    shortcut: "/prj-logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${plusJakartaSans.variable} ${orbitron.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/prj-logo.jpg" />
        <link rel="shortcut icon" href="/prj-logo.jpg" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Inject Paystack Inline Popup script */}
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
