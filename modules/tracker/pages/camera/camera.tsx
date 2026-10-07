"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type SubmitEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { highlightInvalid } from "@/shared/form-validation";
import { NUTRIENTS, NUTRIENT_LIMITS, type LoggedAmounts } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isValidDate, localDateKey, saveMeal, useTodayKey, useTrackerData } from "../../tracker-data";

const subscribeRoute = () => () => {};
function routeDate() {
  const date = new URLSearchParams(window.location.search).get("date") ?? "";
  return isValidDate(date) && date <= localDateKey() ? date : "";
}
function routeEditId() { return new URLSearchParams(window.location.search).get("edit") ?? ""; }
function routeManual() { return window.location.hash === "#manual-meal" || new URLSearchParams(window.location.search).has("manual"); }

type FlowMode = "camera" | "review" | "manual";
type CameraState = "loading" | "ready" | "denied" | "unavailable" | "error";

const copy = {
  en: {
    eyebrow: "MEAL CAMERA", title: "See what is on your plate.", intro: "Camera opens first. Capture a meal, switch cameras, or upload a photo.",
    camera: "Use camera", capture: "Capture photo", switch: "Switch camera", upload: "Upload photo", retry: "Try camera again", retake: "Retake photo",
    manual: "Enter without photo", analyzing: "Preparing nutrition details…", nutritionDetails: "Nutrition details", ready: "Camera ready", loading: "Starting camera…",
    denied: "Camera access is blocked. Allow it in your browser, or upload a photo.", unavailable: "No camera found here. Upload a photo or enter the meal manually.", error: "Camera could not start. Try again or upload a photo.",
    captureError: "Camera has no frame yet. Try again.", invalidImage: "Choose a JPG, PNG, or WebP image up to 10 MB.",
    photoAlt: "Selected meal photo", photoHint: "AI photo estimates are coming soon. Enter or correct each nutrition value before saving.",
    manualTitle: "Enter meal details", manualHint: "Use a label or weighed ingredients. Empty mineral fields stay unknown.",
    editTitle: "Edit your meal", editHint: "Adjust the logged time and nutrition values whenever needed.", missing: "Meal not found.", backHome: "Back to home",
    mealName: "Food or meal name", mealPlaceholder: "e.g. rice and chicken", date: "Date", time: "Meal time", required: "Energy and macros", optional: "Fiber and minerals",
    save: "Save meal", update: "Update meal", saved: "Meal saved in nutrition log.", updated: "Meal updated.", invalid: "Check name, date, time, and nutrition values.",
  },
  id: {
    eyebrow: "KAMERA MAKANAN", title: "Kenali isi piringmu.", intro: "Kamera langsung terbuka. Ambil foto makanan, ganti kamera, atau unggah foto.",
    camera: "Buka kamera", capture: "Ambil foto", switch: "Ganti kamera", upload: "Unggah foto", retry: "Coba kamera lagi", retake: "Foto ulang",
    manual: "Isi tanpa foto", analyzing: "Menyiapkan detail gizi…", nutritionDetails: "Detail gizi", ready: "Kamera siap", loading: "Menyalakan kamera…",
    denied: "Akses kamera diblokir. Izinkan lewat browser, atau unggah foto.", unavailable: "Kamera tidak ditemukan. Unggah foto atau isi makanan manual.", error: "Kamera gagal dibuka. Coba lagi atau unggah foto.",
    captureError: "Kamera belum menampilkan gambar. Coba lagi.", invalidImage: "Pilih gambar JPG, PNG, atau WebP hingga 10 MB.",
    photoAlt: "Foto makanan yang dipilih", photoHint: "Perkiraan AI akan tersedia nanti. Isi atau perbaiki setiap nilai gizi sebelum menyimpan.",
    manualTitle: "Isi detail makanan", manualHint: "Gunakan label gizi atau bahan yang ditimbang. Mineral kosong tetap tidak diketahui.",
    editTitle: "Ubah makanan", editHint: "Ubah waktu dan nilai gizi makanan kapan saja.", missing: "Makanan tidak ditemukan.", backHome: "Kembali ke beranda",
    mealName: "Nama makanan", mealPlaceholder: "mis. nasi dan ayam", date: "Tanggal", time: "Waktu makan", required: "Energi dan makro", optional: "Serat dan mineral",
    save: "Simpan makanan", update: "Perbarui makanan", saved: "Makanan ditambah ke catatan gizi.", updated: "Makanan diperbarui.", invalid: "Periksa nama, tanggal, waktu, dan nilai gizi.",
  },
} as const;

const inputClass = "input w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm placeholder:text-muted/70 focus:border-primary focus:shadow-md";

export function CameraPage() {
  const router = useRouter();
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const reducedMotion = useReducedMotion();
  const today = useTodayKey();
  const logDate = useSyncExternalStore(subscribeRoute, routeDate, () => "") || today;
  const editId = useSyncExternalStore(subscribeRoute, routeEditId, () => "");
  const manualRequested = useSyncExternalStore(subscribeRoute, routeManual, () => false);
  const { meals } = useTrackerData();
  const editMeal = meals.find((meal) => meal.id === editId);
  const [flowMode, setFlowMode] = useState<FlowMode | null>(null);
  const mode = editId ? "edit" : flowMode ?? (manualRequested ? "manual" : "camera");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "camera") return;
    let active = true;
    const video = videoRef.current;
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) {
      Promise.resolve().then(() => { if (active) setCameraState("unavailable"); });
      return () => { active = false; };
    }
    media.getUserMedia({ audio: false, video: { facingMode: { ideal: facing } } }).then((stream) => {
      if (!active) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      if (!video) return;
      video.onloadedmetadata = () => {
        if (!active) return;
        void video.play().then(() => { if (active) setCameraState("ready"); }).catch(() => { if (active) setCameraState("error"); });
      };
      video.srcObject = stream;
    }).catch((error: unknown) => {
      if (!active) return;
      const name = error instanceof DOMException ? error.name : "";
      setCameraState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" ? "unavailable" : "error");
    });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (video) { video.onloadedmetadata = null; video.srcObject = null; }
    };
  }, [mode, facing, retry]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (mode !== "review") return;
    const timer = setTimeout(() => setAnalysisReady(true), reducedMotion ? 0 : 1400);
    return () => clearTimeout(timer);
  }, [mode, preview, reducedMotion]);

  function openCamera() { setPreview(null); setCameraState("loading"); setFlowMode("camera"); }
  function switchCamera() { setCameraState("loading"); setFacing((current) => current === "environment" ? "user" : "environment"); }
  function retryCamera() { setCameraState("loading"); setRetry((current) => current + 1); }
  function openManual() { setPreview(null); setFlowMode("manual"); }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showToast({ en: copy.en.invalidImage, id: copy.id.invalidImage }, "error");
      return;
    }
    setAnalysisReady(false);
    setPreview(URL.createObjectURL(file));
    setFlowMode("review");
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      showToast({ en: copy.en.captureError, id: copy.id.captureError }, "error");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (facing === "user") { context.translate(canvas.width, 0); context.scale(-1, 1); }
    context.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { showToast({ en: copy.en.captureError, id: copy.id.captureError }, "error"); return; }
      setAnalysisReady(false);
      setPreview(URL.createObjectURL(blob));
      setFlowMode("review");
    }, "image/jpeg", 0.88);
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    if (!name.value.trim()) {
      name.setCustomValidity(text.invalid);
      highlightInvalid(form, () => showToast({ en: copy.en.invalid, id: copy.id.invalid }, "error"));
      name.focus();
      return;
    }
    const values = new FormData(form);
    const nutrients = Object.fromEntries(NUTRIENTS.map((key) => {
      const raw = String(values.get(key) ?? "").trim();
      return [key, raw === "" ? null : Number(raw)];
    })) as LoggedAmounts;
    const valid = saveMeal({
      date: String(values.get("date") ?? ""),
      time: String(values.get("time") ?? ""),
      name: String(values.get("name") ?? ""),
      nutrients,
    }, editId || undefined);
    showToast(valid ? { en: editId ? copy.en.updated : copy.en.saved, id: editId ? copy.id.updated : copy.id.saved } : { en: copy.en.invalid, id: copy.id.invalid }, valid ? "success" : "error");
    if (!valid) return;
    if (editId) router.push("/home");
    else openCamera();
  }

  return (
    <div className={mode === "camera" ? "h-0" : "mx-auto max-w-5xl space-y-6"}>
      {mode !== "camera" && mode !== "review" && <div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4rem)] leading-tight font-extrabold tracking-[-.07em]">{text.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{text.intro}</p></div>}
      <input ref={uploadRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} aria-label={text.upload} />

      {mode === "camera" && <section className="fixed inset-0 z-30 overflow-hidden bg-[#071b29] text-white" aria-label={text.title}>
        <video ref={videoRef} autoPlay muted playsInline className={"absolute inset-0 h-full w-full object-cover " + (facing === "user" ? "-scale-x-100 " : "") + (cameraState === "ready" ? "opacity-100" : "opacity-0")} aria-label={text.title} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-8 top-[22%] bottom-[31%] rounded-[2rem] border border-white/25 sm:inset-x-[25%]" aria-hidden="true" />
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 left-4 mx-auto flex max-w-5xl items-start justify-between gap-4 sm:right-8 sm:left-8">
          <div><p className="text-[.65rem] font-extrabold tracking-[.18em] text-brand-lemon">{text.eyebrow}</p><h1 className="mt-1 text-xl font-extrabold tracking-[-.04em] sm:text-2xl">{text.camera}</h1></div>
          <button className="grid size-12 shrink-0 place-items-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/65" type="button" aria-label={text.switch} title={text.switch} onClick={switchCamera}><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8V5h5m13 11v3h-5M4.5 15a8 8 0 0 0 13 3M19.5 9a8 8 0 0 0-13-3" /><path d="M8 12h8m-6-2v4m4-4v4" /></svg></button>
        </div>
        {cameraState !== "ready" && <div className="absolute inset-x-6 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-black/50 p-5 text-center text-sm font-bold leading-6 backdrop-blur-sm" role="status">{text[cameraState]}</div>}
        <div className="absolute right-5 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] left-5 mx-auto max-w-sm sm:right-8 sm:left-8">
          {cameraState !== "ready" && cameraState !== "loading" && <button className="mx-auto mb-4 block rounded-full border border-white/35 bg-black/50 px-4 py-2 text-sm font-bold backdrop-blur-sm" type="button" onClick={retryCamera}>{text.retry}</button>}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button className="flex min-w-0 flex-col items-center gap-1.5 text-xs font-bold text-white" type="button" onClick={() => uploadRef.current?.click()}><span className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-black/45 shadow-lg backdrop-blur-sm"><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1" /><path d="m4 17 6-6 4 4 3-3 4 5" /></svg></span><span>{text.upload}</span></button>
            <button className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/15 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,.35)] transition-transform active:scale-95 disabled:opacity-45" type="button" aria-label={text.capture} title={text.capture} disabled={cameraState !== "ready"} onClick={capture}><span className="size-full rounded-full bg-white" /></button>
            <button className="flex min-w-0 flex-col items-center gap-1.5 text-xs font-bold text-white" type="button" onClick={openManual}><span className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-black/45 shadow-lg backdrop-blur-sm"><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h16M7 16l9-9 2 2-9 9H7v-2ZM15 8l2-2a2 2 0 0 1 3 3l-2 2" /></svg></span><span>{text.manual}</span></button>
          </div>
        </div>
      </section>}

      {mode === "review" && <section className="relative h-[min(42svh,24rem)] min-h-52 overflow-hidden rounded-[1.8rem] border border-line bg-[#071b29] shadow-sm" aria-label={text.photoAlt}>
        {preview && <Image src={preview} alt={text.photoAlt} fill unoptimized className="object-contain" />}
        <button className="btn absolute right-3 bottom-3 z-10 rounded-xl border border-white/30 bg-black/65 px-4 font-bold text-white backdrop-blur-sm hover:bg-black/80" type="button" onClick={openCamera}>{text.retake}</button>
        {!analysisReady && <div className="absolute inset-0 grid place-items-center bg-black/35 text-white backdrop-blur-[1px]" role="status" aria-live="polite"><div className="rounded-2xl border border-white/25 bg-black/55 px-6 py-5 text-center shadow-lg"><motion.span className="mx-auto mb-3 block size-8 rounded-full border-[3px] border-brand-lemon/35 border-t-brand-lemon" aria-hidden="true" animate={reducedMotion ? undefined : { rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /><p className="text-sm font-extrabold">{text.analyzing}</p></div></div>}
      </section>}

      {mode === "manual" && <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-line bg-surface p-5 shadow-sm sm:p-7"><div><h2 className="text-xl font-extrabold">{text.manualTitle}</h2><p className="mt-1 text-sm text-muted">{text.manualHint}</p></div><div className="flex flex-wrap gap-2"><button className="btn btn-outline rounded-xl border-line bg-base-200 text-primary" type="button" onClick={openCamera}>{text.camera}</button><button className="btn btn-outline rounded-xl border-line bg-base-200 text-primary" type="button" onClick={() => uploadRef.current?.click()}>{text.upload}</button></div></section>}

      {mode === "edit" && !editMeal && <section className="rounded-[1.6rem] border border-line bg-surface p-6 shadow-sm"><p className="font-bold">{text.missing}</p><Link className="btn btn-primary mt-4 rounded-xl" href="/home">{text.backHome}</Link></section>}

      {mode !== "camera" && (mode !== "review" || analysisReady) && (mode !== "edit" || editMeal) && <motion.section id="meal-review" className="rounded-[1.7rem] border border-line bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="meal-review-title" initial={mode === "review" && !reducedMotion ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h2 id="meal-review-title" className="text-2xl font-extrabold tracking-[-.05em]">{mode === "edit" ? text.editTitle : mode === "review" ? text.nutritionDetails : text.manualTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{mode === "edit" ? text.editHint : mode === "review" ? text.photoHint : text.manualHint}</p>
        <form key={editMeal?.id ?? mode + logDate} className="mt-6 space-y-6" onSubmit={submit} onInvalid={(event) => highlightInvalid(event.currentTarget, () => showToast({ en: copy.en.invalid, id: copy.id.invalid }, "error"))}>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold sm:col-span-3">{text.mealName}<input className={inputClass} name="name" maxLength={80} placeholder={text.mealPlaceholder} defaultValue={editMeal?.name ?? ""} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
            <label className="grid gap-2 text-sm font-bold">{text.date}<input className={inputClass} name="date" type="date" max={today || undefined} defaultValue={editMeal?.date ?? logDate} required /></label>
            <label className="grid gap-2 text-sm font-bold">{text.time}<input className={inputClass} name="time" type="time" defaultValue={editMeal?.time ?? new Date().toTimeString().slice(0, 5)} required /></label>
          </div>
          <div><h3 className="text-sm font-extrabold text-primary">{text.required}</h3><div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">{NUTRIENTS.slice(0, 4).map((key) => <label key={key} className="grid gap-2 text-sm font-bold">{nutrientLabels[language][key]} ({nutrientUnits[key]})<input className={inputClass} name={key} type="number" min={0} max={NUTRIENT_LIMITS[key]} step="0.1" inputMode="decimal" placeholder="0" defaultValue={editMeal?.nutrients[key] ?? ""} required /></label>)}</div></div>
          <div><h3 className="text-sm font-extrabold text-primary">{text.optional}</h3><div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">{NUTRIENTS.slice(4).map((key) => <label key={key} className="grid gap-2 text-sm font-bold">{nutrientLabels[language][key]} ({nutrientUnits[key]})<input className={inputClass} name={key} type="number" min={0} max={NUTRIENT_LIMITS[key]} step="0.1" inputMode="decimal" placeholder="—" defaultValue={editMeal?.nutrients[key] ?? ""} /></label>)}</div></div>
          <div className="flex flex-wrap gap-3"><button className="btn btn-primary rounded-xl px-6 font-extrabold" type="submit">{mode === "edit" ? text.update : text.save}</button>{mode === "edit" && <Link className="btn btn-ghost rounded-xl" href="/home">{text.backHome}</Link>}</div>
        </form>
      </motion.section>}
    </div>
  );
}
