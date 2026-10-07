"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";

type ToastMessage = { en: string; id: string };
type ToastKind = "info" | "success" | "error";
type Toast = { id: number; message: ToastMessage; kind: ToastKind };
type ToastContextValue = (message: ToastMessage, kind?: ToastKind) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);
  const language = useLanguage();
  const reducedMotion = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ToastContextValue>((message, kind = "info") => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { id, message, kind }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 5200));
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] z-[100] mx-auto flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-6 sm:mx-0" aria-live="polite" aria-relevant="additions text">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`alert pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-ink shadow-[0_18px_50px_rgba(0,24,42,.18)] ${toast.kind === "error" ? "border-l-4 border-l-error" : toast.kind === "success" ? "border-l-4 border-l-success" : "border-l-4 border-l-primary"}`}
              initial={reducedMotion ? false : { opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: reducedMotion ? 0 : 0.22 }}
              role={toast.kind === "error" ? "alert" : "status"}
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">{toast.kind === "error" ? "!" : toast.kind === "success" ? "✓" : "i"}</span>
              <span className="min-w-0 flex-1 text-sm leading-5">{toast.message[language]}</span>
              <button className="btn btn-ghost btn-xs -mr-1 shrink-0 rounded-full text-muted" type="button" onClick={() => dismiss(toast.id)} aria-label={language === "id" ? "Tutup notifikasi" : "Dismiss notification"}>✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}
