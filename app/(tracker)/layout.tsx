import type { Metadata } from "next";
import { TrackerShell } from "@/modules/tracker";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrackerShell>{children}</TrackerShell>;
}
