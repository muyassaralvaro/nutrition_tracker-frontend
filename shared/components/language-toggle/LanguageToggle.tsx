"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { setLanguage, useLanguage } from "@/shared/language";

export function LanguageToggle() {
  const language = useLanguage();
  const reducedMotion = useReducedMotion();
  const next = language === "en" ? "id" : "en";
  const label = language === "en" ? "Switch to Indonesian" : "Ganti ke bahasa Inggris";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <button
      className="grid size-[2.8rem] shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-surface text-[.72rem] font-extrabold text-ink transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none"
      type="button"
      onClick={() => setLanguage(next)}
      aria-label={label}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={next} lang={next} initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reducedMotion ? 0 : 0.16 }}>{next.toUpperCase()}</motion.span>
      </AnimatePresence>
    </button>
  );
}
