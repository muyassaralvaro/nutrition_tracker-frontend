import type { Metadata } from "next";
import { WelcomePage } from "@/modules/onboarding";

export const metadata: Metadata = {
  title: "Meal Photo Nutrition Tracker | Nourish",
  description: "Take a meal photo, review its estimated calories and nutrients, then track your daily nutrition targets and weight progress with Nourish.",
  alternates: { canonical: "/" },
  openGraph: { title: "Meal Photo Nutrition Tracker | Nourish", description: "Review meal photo nutrition estimates and follow your daily targets with Nourish.", url: "/", siteName: "Nourish", type: "website" },
};

export default function Page() {
  return <WelcomePage />;
}
