import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nourish — nutrition, your way",
  description: "A calmer way to track meals, movement, and progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
