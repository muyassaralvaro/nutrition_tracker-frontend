"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Brand } from "@/shared/components/brand/Brand";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useLanguage } from "@/shared/language";
import { clearTrackerData, initializeTracker, localDateKey, refreshDay, useTrackerData } from "../tracker-data";

type IconName = "home" | "calendar" | "camera" | "profile" | "settings";

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h2m-8 4h3" /></>,
    camera: <><path d="M3 7h4l2-2h6l2 2h4v13H3V7Z" /><circle cx="12" cy="13" r="3.5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M10 2h4l.6 2.4 2.2.9 2.1-1.3 2.8 2.8-1.3 2.1.9 2.2L23 12l-1.7.9-.9 2.2 1.3 2.1-2.8 2.8-2.1-1.3-2.2.9L14 22h-4l-.6-2.4-2.2-.9-2.1 1.3-2.8-2.8 1.3-2.1-.9-2.2L1 12l1.7-.9.9-2.2-1.3-2.1 2.8-2.8 2.1 1.3 2.2-.9L10 2Z" /></>,
  };
  return <svg className={name === "camera" ? "size-7 sm:size-8" : "size-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const links = [
  { href: "/home", icon: "home" },
  { href: "/calendar", icon: "calendar" },
  { href: "/camera", icon: "camera" },
  { href: "/profile", icon: "profile" },
  { href: "/settings", icon: "settings" },
] as const;

const labels = {
  en: ["Home", "Calendar", "Camera", "Profile", "Settings"],
  id: ["Beranda", "Kalender", "Kamera", "Profil", "Pengaturan"],
} as const;

export function TrackerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const language = useLanguage();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { status, days } = useTrackerData();

  useEffect(() => { void initializeTracker().catch(() => {}); }, []);
  useEffect(() => { if (status === "unauthorized") router.replace("/login"); }, [status, router]);
  useEffect(() => {
    const expired = () => { clearTrackerData(); router.replace("/login"); };
    window.addEventListener("nourish:unauthorized", expired);
    return () => window.removeEventListener("nourish:unauthorized", expired);
  }, [router]);
  useEffect(() => { const today = localDateKey(); if (status === "ready" && !days[today]) void refreshDay(today).catch(() => {}); }, [status, days, pathname]);

  if (status !== "ready") return <div className="grid min-h-svh place-items-center bg-canvas px-6 text-center text-ink" role="status">
    {status === "error" ? <div><p className="font-bold">{language === "id" ? "Server tidak dapat dijangkau." : "Could not reach the server."}</p><button className="btn btn-primary mt-4 rounded-xl" type="button" onClick={() => void initializeTracker(true).catch(() => {})}>{language === "id" ? "Coba lagi" : "Retry"}</button></div> : <span className="loading loading-spinner loading-lg text-primary" aria-label={language === "id" ? "Memuat data" : "Loading data"} />}
  </div>;

  return (
    <div className="min-h-svh overflow-x-hidden bg-canvas text-ink transition-colors duration-300 motion-reduce:transition-none">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
        <Brand href="/home" ariaLabel={language === "id" ? "Beranda Nourish" : "Nourish home"} />
        <div className="flex items-center gap-2">
          <LanguageToggle /><ThemeToggle />
        </div>
      </header>

      <motion.main key={pathname} className="mx-auto max-w-6xl px-5 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-10 sm:pb-[calc(8rem+env(safe-area-inset-bottom))]" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22 }}>
        {children}
      </motion.main>

      <nav className="fixed right-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] left-2 z-40 mx-auto grid max-w-[640px] grid-cols-[1fr_1fr_1.4fr_1fr_1fr] items-end rounded-[1.4rem] border border-line bg-surface/95 px-1.5 py-1.5 shadow-[0_18px_45px_rgba(0,30,50,.18)] backdrop-blur-xl sm:right-3 sm:bottom-[max(.75rem,env(safe-area-inset-bottom))] sm:left-3 sm:rounded-[1.7rem] sm:px-3 sm:py-2" aria-label={language === "id" ? "Navigasi utama" : "Main navigation"}>
        {links.map((link, index) => {
          const active = pathname === link.href;
          const camera = link.icon === "camera";
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`group flex min-w-0 flex-col items-center gap-1 rounded-2xl py-1 text-[.61rem] font-bold transition-colors duration-200 motion-reduce:transition-none sm:gap-1.5 sm:py-2 sm:text-[.72rem] ${camera ? "-mt-4 -mb-2 p-0 sm:-mt-5 sm:-mb-3" : ""} ${active && !camera ? "text-primary" : "text-muted hover:text-primary"}`}>
              <span className={`grid place-items-center transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none ${camera ? "size-[4.25rem] rounded-full bg-brand-blue text-white ring-4 ring-brand-sky/40 shadow-[0_9px_22px_rgba(0,97,153,.34)] sm:size-20" : active ? "size-8 rounded-xl bg-primary/10" : "size-8"}`}><NavIcon name={link.icon} /></span>
              <span className={camera ? "sr-only" : "truncate"}>{labels[language][index]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
