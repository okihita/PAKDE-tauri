import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAKDE — Pengelola Administrasi Koperasi Desa",
  description:
    "Aplikasi desktop offline-first untuk koperasi Indonesia. Manajemen anggota, akuntansi double-entry, inventaris, penjualan, dan analisis keuangan — semua di perangkat Anda.",
  openGraph: {
    title: "PAKDE — Pengelola Administrasi Koperasi Desa",
    description:
      "Aplikasi desktop offline-first untuk koperasi Indonesia. Kelola anggota, akuntansi, dan inventaris — tanpa internet.",
    siteName: "PAKDE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
