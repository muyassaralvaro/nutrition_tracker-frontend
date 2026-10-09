import type { Metadata } from "next";
import { AccessPage } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Sign in | Nourish",
  description: "Sign in to Nourish with Google to track meals, nutrition goals, and weight progress.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <AccessPage />;
}
