"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener("nourish-theme-change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("nourish-theme-change", onChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");
  const language = useLanguage();
  const reducedMotion = useReducedMotion();
  const label = language === "id"
    ? `Ganti ke tema ${theme === "light" ? "gelap" : "terang"}`
    : `Switch to ${theme === "light" ? "dark" : "light"} theme`;

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("nourish_theme");
    } catch {
      // Browser storage can be unavailable; system preference still works.
    }
    if (saved === "light" || saved === "dark") {
      document.documentElement.dataset.theme = saved;
      window.dispatchEvent(new Event("nourish-theme-change"));
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("nourish-theme-change"));
    try {
      localStorage.setItem("nourish_theme", next);
    } catch {
      // Theme still changes for this page when storage is unavailable.
    }
  }

  return (
    <button
      className="grid size-[2.8rem] shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none [&_svg]:size-5"
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} className="grid place-items-center" initial={reducedMotion ? false : { opacity: 0, rotate: -30, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, rotate: 30, scale: 0.8 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
          {theme === "light" ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.1 15.4A8.3 8.3 0 0 1 8.6 3.9 8.4 8.4 0 1 0 20.1 15.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
