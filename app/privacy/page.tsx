import type { Metadata } from "next";
import { LegalPage } from "../legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Nourish",
  description: "How Nourish handles account, health profile, meal, and photo data.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy | Nourish", description: "How Nourish handles account, health profile, meal, and photo data.", url: "/privacy", siteName: "Nourish", type: "website" },
};

export default function Page() {
  return <LegalPage kind="privacy" />;
}
