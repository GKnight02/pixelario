import type { Metadata, Viewport } from "next";
import { Jersey_10, Pixelify_Sans, Silkscreen } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const jersey = Jersey_10({
  variable: "--font-jersey",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Pixelario — el libro de tus personas",
    template: "%s · Pixelario",
  },
  description:
    "Escribe un libro pixel sobre las personas importantes de tu vida: sus gustos, anécdotas, fechas y regalos.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d3a9e" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1238" },
  ],
};

// Se ejecuta antes del primer pintado: aplica día/noche sin parpadeo.
const themeScript = `(function(){try{var p=localStorage.getItem('pixelario-theme')||'system';var n=p==='night'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=n?'night':'day';}catch(e){document.documentElement.dataset.theme='day';}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="day"
      suppressHydrationWarning
      className={`${jersey.variable} ${silkscreen.variable} ${pixelify.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="candle-glow" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
