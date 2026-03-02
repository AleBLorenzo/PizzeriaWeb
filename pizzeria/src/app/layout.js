import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionButton from "./SessionButton"; // Client Component para logout

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Pizzería Demo",
  description: "Proyecto de prueba con Supabase y Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionButton />
        {children}
      </body>
    </html>
  );
}