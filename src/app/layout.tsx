import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apostila · Área de membros · Núcleo Avalanche",
  description: "Estudos Avançados em I.A. Agêntica. Coloque a sua Naia no ar.",
  icons: {
    icon: "/sales/perfil-naia.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="m-bg-on">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/imersao.css" />
        <link rel="stylesheet" href="/motion.css" />
        <link rel="stylesheet" href="/naia-pet.css" />
        <link rel="stylesheet" href="/mapa-mental.css" />
      </head>
      <body className="member-body">
        <canvas id="m-bg" aria-hidden="true" width="1280" height="800"></canvas>
        <div className="glowtop"></div>
        {children}
        <Script src="/motion.js" strategy="lazyOnload" />
        <Script src="/naia-pet.js" strategy="lazyOnload" />
        <Script src="/mapa-mental.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
