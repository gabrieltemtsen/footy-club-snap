import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Finder Snap",
  description: "A Farcaster Snap for football fans to discover fellow supporters.",
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
