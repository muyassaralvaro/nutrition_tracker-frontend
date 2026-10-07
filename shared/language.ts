"use client";

import { useSyncExternalStore } from "react";

export type Language = "en" | "id";

const key = "nourish_language";
const eventName = "nourish-language-change";
let fallback: Language = "en";

function currentLanguage(): Language {
  try {
    const saved = localStorage.getItem(key);
    if (saved === "en" || saved === "id") return saved;
  } catch {
    // ponytail: Browser storage can be unavailable; keep language for current page only.
  }
  return fallback;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(eventName, onChange);
  };
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, currentLanguage, () => "en");
}

export function setLanguage(language: Language) {
  fallback = language;
  document.documentElement.lang = language;
  try {
    localStorage.setItem(key, language);
  } catch {
    // Current page still updates when storage is unavailable.
  }
  window.dispatchEvent(new Event(eventName));
}
