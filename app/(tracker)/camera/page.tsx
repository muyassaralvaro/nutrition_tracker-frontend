import type { Metadata } from "next";
import { CameraPage } from "@/modules/tracker";

export const metadata: Metadata = { title: "Meal camera | Nourish" };

export default function Page() { return <CameraPage />; }
