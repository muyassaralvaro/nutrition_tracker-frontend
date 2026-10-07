"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { highlightInvalid } from "@/shared/form-validation";
import { errorText } from "@/shared/api-client";
import { displayWeight, weightToKg } from "../nutrition";
import { saveWeight, useTodayKey, useTrackerData } from "../tracker-data";

const copy = {
  en: { button: "Check in weight", title: "Weight check-in", intro: "One entry per day. A new entry on the same date replaces the old one.", date: "Date", weight: "Weight", save: "Save weight", close: "Close", saved: "Weight check-in saved.", invalidMetric: "Choose a valid date up to today and weight from 20 to 500 kg.", invalidImperial: "Choose a valid date up to today and weight from 44 to 1,102 lb." },
  id: { button: "Catat berat badan", title: "Catatan berat badan", intro: "Satu catatan per hari. Entri baru pada tanggal yang sama mengganti yang lama.", date: "Tanggal", weight: "Berat", save: "Simpan berat", close: "Tutup", saved: "Catatan berat badan disimpan.", invalidMetric: "Pilih tanggal valid hingga hari ini dan berat 20 sampai 500 kg.", invalidImperial: "Pilih tanggal valid hingga hari ini dan berat 44 sampai 1.102 lb." },
} as const;

export function WeightCheckIn({ date, className = "btn btn-primary rounded-xl font-extrabold" }: { date?: string; className?: string }) {
  const language = useLanguage();
  const text = copy[language];
  const today = useTodayKey();
  const { profile, weights } = useTrackerData();
  const unitSystem = profile.unitSystem;
  const weightUnit = unitSystem === "imperial" ? "lb" : "kg";
  const latest = weights.at(-1);
  const showToast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const date = String(values.get("date") ?? "");
    const kg = weightToKg(Number(values.get("weight")), unitSystem);
    const valid = Boolean(date && kg >= 20 && kg <= 500);
    const invalidKey = unitSystem === "imperial" ? "invalidImperial" : "invalidMetric";
    if (!valid) {
      const field = form.elements.namedItem("weight") as HTMLInputElement;
      field.setCustomValidity(text[invalidKey]);
      highlightInvalid(form, () => showToast({ en: copy.en[invalidKey], id: copy.id[invalidKey] }, "error"));
      field.focus();
      return;
    }
    setBusy(true);
    try { await saveWeight(date, kg); showToast({ en: copy.en.saved, id: copy.id.saved }, "success"); dialog.current?.close(); }
    catch (error) { showToast({ en: errorText(error), id: errorText(error) }, "error"); }
    finally { setBusy(false); }
  }

  return <>
    <button className={className} type="button" onClick={() => dialog.current?.showModal()}>{text.button}</button>
    <dialog ref={dialog} className="modal z-50"><div className="modal-box max-w-md rounded-[1.6rem] border border-line bg-surface p-6 text-ink sm:p-8"><form method="dialog" className="float-right"><button className="btn btn-ghost btn-sm rounded-full" type="submit" aria-label={text.close}>✕</button></form><h2 className="pr-10 text-2xl font-extrabold tracking-[-.05em]">{text.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text.intro}</p><form key={`${date || today}-${unitSystem}`} className="mt-6 grid gap-4" onSubmit={submit} onInvalid={(event) => highlightInvalid(event.currentTarget, () => showToast({ en: copy.en[unitSystem === "imperial" ? "invalidImperial" : "invalidMetric"], id: copy.id[unitSystem === "imperial" ? "invalidImperial" : "invalidMetric"] }, "error"))}><label className="grid gap-2 text-sm font-bold">{text.date}<input className="input w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm focus:shadow-md" name="date" type="date" min="1900-01-01" defaultValue={date || today} max={today || undefined} required /></label><label className="grid gap-2 text-sm font-bold">{text.weight} ({weightUnit})<input className="input w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm placeholder:text-muted/70 focus:shadow-md" name="weight" type="number" inputMode="decimal" min={unitSystem === "imperial" ? 44.1 : 20} max={unitSystem === "imperial" ? 1102.2 : 500} step="0.1" placeholder={latest ? String(displayWeight(latest.kg, unitSystem)) : unitSystem === "imperial" ? "154" : "70"} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label><button className="btn btn-primary mt-2 rounded-xl font-extrabold" type="submit" disabled={busy}>{busy ? "…" : text.save}</button></form></div><form method="dialog" className="modal-backdrop"><button type="submit" aria-label={text.close}>{text.close}</button></form></dialog>
  </>;
}
