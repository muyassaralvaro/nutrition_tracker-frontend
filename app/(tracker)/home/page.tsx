import type { Metadata } from "next";
import { HomePage } from "@/modules/tracker";

export const metadata: Metadata = { title: "Daily nutrition | Nourish" };

export default function Page() { return <HomePage />; }
