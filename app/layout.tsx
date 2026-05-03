import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Request — Sai Shree Vita Life",
  description: "Request nursing, housekeeping or maintenance assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
