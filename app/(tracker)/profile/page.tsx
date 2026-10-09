import type { Metadata } from "next";
import { ProfilePage } from "@/modules/tracker";

export const metadata: Metadata = { title: "Your profile | Nourish" };

export default function Page() { return <ProfilePage />; }
