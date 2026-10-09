import type { Metadata } from "next";
import { ToastProvider } from "@/shared/components/toast/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nourish.my.id"),
  applicationName: "Nourish",
  title: "Nourish | Meal Photo Nutrition Tracker",
  description: "Track meals from photos, review nutrition estimates, set daily targets, and follow your weight progress with Nourish.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
