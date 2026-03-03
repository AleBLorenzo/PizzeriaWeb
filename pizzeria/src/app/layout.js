import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionButton from "./SessionButton";

/**
 * 🏗️ LAYOUT RAÍZ — Envuelve TODAS las páginas de la app
 *
 * ¿Por qué existe layout.js?
 * En Next.js App Router, layout.js define la estructura HTML compartida
 * que persiste entre navegaciones. Lo que pongas aquí se renderiza UNA SOLA VEZ
 * y no se desmonta al cambiar de página (a diferencia de los page.js).
 *
 * Ejemplo: la SessionButton (botón de logout) aparece en todas las páginas
 * porque está en el layout, no en cada page.js individualmente.
 *
 * MEJORAS respecto a la versión original:
 * 1. Metadata más completa (OpenGraph, favicon declarado)
 * 2. lang="es" en <html> → accesibilidad y SEO (tu versión tenía lang="en")
 * 3. suppressHydrationWarning → explicado abajo
 * 4. Comentarios que explican el rol de cada parte
 */

// ─────────────────────────────────────────────
// 🔤 FUENTES DE GOOGLE
//
// Next.js descarga y sirve las fuentes automáticamente.
// Ventajas vs <link> de Google Fonts:
//   - No hay petición externa en cada carga (mejor privacidad y rendimiento)
//   - Las fuentes se sirven desde tu mismo servidor (sin dependencia de Google)
//   - Optimización automática (subconjunto de caracteres, preload, etc.)
//
// variable: "--font-geist-sans" → crea una CSS custom property que luego
// usas en tu CSS/Tailwind: font-family: var(--font-geist-sans)
// ─────────────────────────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // NUEVO: muestra texto con fuente de respaldo mientras carga la fuente web
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ─────────────────────────────────────────────
// 📋 METADATA
//
// Next.js exporta metadata como un objeto — esto es mejor que poner
// <meta> tags manualmente en el <head> porque:
//   - Next.js los gestiona automáticamente (deduplicación, herencia entre layouts)
//   - Son válidos en Server Components (no necesitas "use client")
//   - Puedes generar metadata dinámica con generateMetadata() si la necesitas
// ─────────────────────────────────────────────
export const metadata = {
  title: {
    // template: permite que las páginas hijas solo definan su parte del título
    // Ejemplo: en /auth/login puedes poner title: "Login" y quedará "Login | Pizzería 🍕"
    template: "%s | Pizzería 🍕",
    default: "Pizzería 🍕",   // Título cuando ninguna página hija lo sobreescribe
  },
  description: "Pide tus pizzas favoritas online. Proyecto demo con Supabase y Next.js.",
  // OpenGraph: metadatos para cuando compartes el link en redes sociales (WhatsApp, Twitter, etc.)
  openGraph: {
    title: "Pizzería 🍕",
    description: "Pide tus pizzas favoritas online",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    /*
     * suppressHydrationWarning en <html> y <body>:
     *
     * ¿Qué es hidratación?
     * Next.js primero renderiza HTML estático en el servidor (SSR).
     * Luego, en el navegador, React "hidrata" ese HTML → lo convierte en
     * una app interactiva adjuntando los event listeners.
     *
     * El problema: algunas extensiones del navegador (LastPass, Dark Reader, etc.)
     * modifican el DOM entre el render del servidor y la hidratación del cliente.
     * Esto genera warnings en consola: "Text content did not match".
     * suppressHydrationWarning silencia esos warnings en <html> y <body>
     * porque es esperable que esos elementos varíen.
     *
     * IMPORTANTE: No uses suppressHydrationWarning en componentes normales
     * para "esconder" bugs reales. Solo es válido en <html> y <body>.
     */
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/*
          SessionButton está aquí (no en page.js) para que aparezca
          en TODAS las páginas sin repetir código.
          Es un Client Component ("use client") porque necesita useState/useEffect
          para saber si hay sesión activa.
        */}
        <SessionButton />

        {/*
          children = el contenido de la página actual (page.js)
          Next.js inyecta aquí el page.js correspondiente a la ruta visitada.
        */}
        <main>{children}</main>
      </body>
    </html>
  );
}