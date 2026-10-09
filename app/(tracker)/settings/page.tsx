import type { Metadata } from "next";
import { SettingsPage } from "@/modules/tracker";

export const metadata: Metadata = { title: "Settings | Nourish" };

export default function Page() { return <SettingsPage />; }
