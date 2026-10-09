import type { Metadata } from "next";
import { LegalPage } from "../legal-content";

export const metadata: Metadata = {
  title: "Terms of Service | Nourish",
  description: "Terms for using Nourish nutrition tracking and meal analysis.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service | Nourish", description: "Terms for using Nourish nutrition tracking and meal analysis.", url: "/terms", siteName: "Nourish", type: "website" },
};

export default function Page() {
  return <LegalPage kind="terms" />;
}
