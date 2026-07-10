import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PWARegister } from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Casa · Finanzas",
  description: "Finanzas mensuales de Juli y Nacho",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Casa",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#17150f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const noFlashTheme = `
(function(){
  try {
    // Por defecto la app es CLARA. Solo va a oscuro si se eligió explícitamente.
    if (localStorage.getItem('appcasa.theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
    var u = localStorage.getItem('appcasa.usuario');
    if (u) document.documentElement.setAttribute('data-user', u.toLowerCase());
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
        <PWARegister />
      </body>
    </html>
  );
}
