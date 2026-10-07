import { TrackerShell } from "@/modules/tracker";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrackerShell>{children}</TrackerShell>;
}
