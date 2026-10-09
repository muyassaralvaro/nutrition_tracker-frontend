import type { Metadata } from "next";
import { CalendarPage } from "@/modules/tracker";

export const metadata: Metadata = { title: "Nutrition calendar | Nourish" };

export default function Page() { return <CalendarPage />; }
