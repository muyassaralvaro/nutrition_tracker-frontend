"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type SubmitEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { highlightInvalid } from "@/shared/form-validation";
import { api, ApiError, errorText } from "@/shared/api-client";
import { NUTRIENTS, NUTRIENT_LIMITS, scalePortion, type LoggedAmounts, type Nutrient } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isValidDate, loadMeal, localDateKey, saveMeal, useTodayKey, useTrackerData, type MealItem } from "../../tracker-data";

const subscribeRoute = () => () => {};
function routeDate() {
  const date = new URLSearchParams(window.location.search).get("date") ?? "";
  return isValidDate(date) && date <= localDateKey() ? date : "";
}
function routeEditId() { return new URLSearchParams(window.location.search).get("edit") ?? ""; }
function routeManual() { return window.location.hash === "#manual-meal" || new URLSearchParams(window.location.search).has("manual"); }

type FlowMode = "camera" | "review" | "manual";
type CameraState = "loading" | "ready" | "denied" | "unavailable" | "error";
type ReviewItem = { name: string; description: string; grams: string; nutrients: Record<Nutrient, string>; portionBasis: { grams: number; nutrients: Record<Nutrient, string> } | null };
type Analysis = { id: string; status: "queued" | "processing" | "succeeded" | "failed" | "canceled"; draft: { title: string; items: MealItem[] } | null; error_code: string | null };
const blankItem = (): ReviewItem => ({ name: "", description: "", grams: "", nutrients: Object.fromEntries(NUTRIENTS.map((key) => [key, ""])) as Record<Nutrient, string>, portionBasis: null });
const reviewItem = (item: MealItem): ReviewItem => {
  const nutrients = Object.fromEntries(NUTRIENTS.map((key) => [key, item.nutrients[key] === null ? "" : String(item.nutrients[key])])) as Record<Nutrient, string>;
  return { name: item.name, description: item.description ?? "", grams: item.grams === null ? "" : String(item.grams), nutrients, portionBasis: item.grams && item.grams > 0 ? { grams: item.grams, nutrients: { ...nutrients } } : null };
};

const copy = {
  en: {
    eyebrow: "MEAL CAMERA", title: "See what is on your plate.", intro: "Camera opens first. Capture a meal, switch cameras, or upload a photo.",
    camera: "Use camera", capture: "Capture photo", switch: "Switch camera", upload: "Upload photo", retry: "Try camera again", retake: "Retake photo",
    manual: "Enter without photo", uploading: "Uploading photo…", queued: "Photo uploaded. Waiting for analysis…", analyzing: "Estimating dish, calories, and nutrients…", nutritionDetails: "Nutrition estimate", ready: "Camera ready", loading: "Starting camera…",
    denied: "Camera access is blocked. Allow it in your browser, or upload a photo.", unavailable: "No camera found here. Upload a photo or enter the meal manually.", error: "Camera could not start. Try again or upload a photo.",
    captureError: "Camera has no frame yet. Try again.", invalidImage: "Choose a JPG, PNG, or WebP image up to 10 MB.",
    photoAlt: "Selected meal photo", photoHint: "One dish, one estimate. Check the portion and nutrients before saving.", foodContextTitle: "Add food details", foodContext: "Extra details (optional)", foodContextPlaceholder: "e.g. strawberry matcha mochi, one piece", foodContextHint: "Name the dish, toppings, or portion if the photo alone may be unclear.", foodContextInvalid: "Keep food details to 500 characters or fewer.", analyzePhoto: "Analyze meal photo", reanalyzePhoto: "Reanalyze same photo", addDetails: "Add details or analyze", retryAnalysis: "Try analysis again", notAccurate: "Result not accurate?", close: "Close", analysisFailed: "Photo analysis unavailable. Enter the meal details manually below.", languageFailed: "Model used an unsupported language. Retake the photo or enter the meal manually.",
    manualTitle: "Enter meal details", manualHint: "Enter the whole dish. Leave unknown minerals empty.",
    editTitle: "Edit your meal", editHint: "Adjust the logged time and nutrition values whenever needed.", missing: "Meal not found.", loadingMeal: "Loading meal…", backHome: "Back to home",
    mealName: "Food or meal name", mealPlaceholder: "e.g. rice and chicken", date: "Date", time: "Meal time", required: "Energy and macros", optional: "Fiber and minerals",
    save: "Save meal", update: "Update meal", saved: "Meal saved in nutrition log.", updated: "Meal updated.", invalid: "Check highlighted fields.", item: "Dish", description: "Short dish description", grams: "Estimated portion (g, optional)",
  },
  id: {
    eyebrow: "KAMERA MAKANAN", title: "Kenali isi piringmu.", intro: "Kamera langsung terbuka. Ambil foto makanan, ganti kamera, atau unggah foto.",
    camera: "Buka kamera", capture: "Ambil foto", switch: "Ganti kamera", upload: "Unggah foto", retry: "Coba kamera lagi", retake: "Foto ulang",
    manual: "Isi tanpa foto", uploading: "Mengunggah foto…", queued: "Foto terunggah. Menunggu analisis…", analyzing: "Memperkirakan hidangan, kalori, dan gizi…", nutritionDetails: "Perkiraan gizi", ready: "Kamera siap", loading: "Menyalakan kamera…",
    denied: "Akses kamera diblokir. Izinkan lewat browser, atau unggah foto.", unavailable: "Kamera tidak ditemukan. Unggah foto atau isi makanan manual.", error: "Kamera gagal dibuka. Coba lagi atau unggah foto.",
    captureError: "Kamera belum menampilkan gambar. Coba lagi.", invalidImage: "Pilih gambar JPG, PNG, atau WebP hingga 10 MB.",
    photoAlt: "Foto makanan yang dipilih", photoHint: "Satu hidangan, satu perkiraan. Periksa porsi dan gizi sebelum menyimpan.", foodContextTitle: "Tambahkan detail makanan", foodContext: "Detail tambahan (opsional)", foodContextPlaceholder: "cont. mochi matcha stroberi, satu buah", foodContextHint: "Sebutkan hidangan, topping, atau porsi jika foto saja kurang jelas.", foodContextInvalid: "Batasi detail makanan maksimal 500 karakter.", analyzePhoto: "Analisis foto makanan", reanalyzePhoto: "Analisis ulang foto yang sama", addDetails: "Tambah detail atau analisis", retryAnalysis: "Coba analisis lagi", notAccurate: "Hasil tidak sesuai?", close: "Tutup", analysisFailed: "Analisis foto tidak tersedia. Isi detail makanan secara manual di bawah.", languageFailed: "Model memakai bahasa yang tidak didukung. Foto ulang atau isi makanan secara manual.",
    manualTitle: "Isi detail makanan", manualHint: "Isi seluruh hidangan. Biarkan mineral yang belum diketahui kosong.",
    editTitle: "Ubah makanan", editHint: "Ubah waktu dan nilai gizi makanan kapan saja.", missing: "Makanan tidak ditemukan.", loadingMeal: "Memuat makanan…", backHome: "Kembali ke beranda",
    mealName: "Nama makanan", mealPlaceholder: "cont. nasi dan ayam", date: "Tanggal", time: "Waktu makan", required: "Energi dan makro", optional: "Serat dan mineral",
    save: "Simpan makanan", update: "Perbarui makanan", saved: "Makanan ditambah ke catatan gizi.", updated: "Makanan diperbarui.", invalid: "Periksa kolom yang ditandai.", item: "Hidangan", description: "Deskripsi singkat hidangan", grams: "Perkiraan porsi (g, opsional)",
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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [foodContext, setFoodContext] = useState("");
  const [contextInvalid, setContextInvalid] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<"details" | "uploading" | "queued" | "processing">("details");
  const [photoEnabled, setPhotoEnabled] = useState<boolean | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [mealTitle, setMealTitle] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([blankItem()]);
  const [busy, setBusy] = useState(false);
  const [editError, setEditError] = useState(false);
  const analysisGeneration = useRef(0);
  const analysisInFlight = useRef(false);
  const retainedAnalysisIds = useRef(new Set<string>());
  const requestId = useRef<{ payload: string; id: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const contextDialog = useRef<HTMLDialogElement>(null);
  const promptedPhoto = useRef<File | null>(null);
  const readyForReview = analysisReady || (mode === "review" && photoEnabled === false);

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
    api<{ data: { photo_analysis_enabled: boolean } }>("/api/v1/auth/options").then(({ data }) => setPhotoEnabled(data.photo_analysis_enabled)).catch(() => {});
  }, []);
  useEffect(() => {
    if (photoEnabled === false) { contextDialog.current?.close(); return; }
    if (mode !== "review" || !selectedPhoto || promptedPhoto.current === selectedPhoto) return;
    promptedPhoto.current = selectedPhoto;
    contextDialog.current?.showModal();
  }, [mode, selectedPhoto, photoEnabled]);

  useEffect(() => {
    if (!editId) return;
    void loadMeal(editId).then((meal) => { setMealTitle(meal.name); setItems(meal.items.map(reviewItem)); })
      .catch((error) => { setEditError(true); showToast({ en: errorText(error), id: errorText(error) }, "error"); });
  }, [editId, showToast]);
  useEffect(() => () => { analysisGeneration.current += 1; }, []);

  function discardAnalysis(id: string) {
    retainedAnalysisIds.current.delete(id);
    void api(`/api/v1/meal-analyses/${id}`, { method: "DELETE" }).catch(() => {});
  }
  function cancelAnalysis() {
    analysisGeneration.current += 1;
    analysisInFlight.current = false;
    for (const id of retainedAnalysisIds.current) discardAnalysis(id);
    setAnalysisId(null);
  }
  function openCamera() { cancelAnalysis(); contextDialog.current?.close(); setPreview(null); setSelectedPhoto(null); setFoodContext(""); setContextInvalid(false); setAnalysisReady(false); setAnalysisStage("details"); setMealTitle(""); setItems([blankItem()]); requestId.current = null; setCameraState("loading"); setFlowMode("camera"); }
  function switchCamera() { setCameraState("loading"); setFacing((current) => current === "environment" ? "user" : "environment"); }
  function retryCamera() { setCameraState("loading"); setRetry((current) => current + 1); }
  function openManual() { cancelAnalysis(); contextDialog.current?.close(); setPreview(null); setSelectedPhoto(null); setFoodContext(""); setMealTitle(""); setItems([blankItem()]); requestId.current = null; setFlowMode("manual"); }

  async function analyzePhoto(file: File, generation: number, context: string, previousId: string | null) {
    let createdId: string | null = null;
    try {
      const upload = new FormData();
      upload.append("image", file);
      upload.append("language", language);
      if (context) upload.append("food_context", context);
      const { data: first } = await api<{ data: Analysis }>("/api/v1/meal-analyses", { method: "POST", body: upload });
      createdId = first.id;
      retainedAnalysisIds.current.add(first.id);
      if (analysisGeneration.current !== generation) { discardAnalysis(first.id); return; }
      setAnalysisStage("queued");
      for (let count = 0; count < 45; count++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (analysisGeneration.current !== generation) return;
        const { data } = await api<{ data: Analysis }>(`/api/v1/meal-analyses/${first.id}`);
        if (analysisGeneration.current !== generation) return;
        if (data.status === "processing") setAnalysisStage("processing");
        if (data.status === "succeeded" && data.draft) {
          setMealTitle(data.draft.title);
          setItems(data.draft.items.map(reviewItem));
          setAnalysisId(first.id);
          setAnalysisReady(true);
          setAnalysisStage("details");
          if (previousId && previousId !== first.id) discardAnalysis(previousId);
          return;
        }
        if (data.status === "failed" && data.error_code === "language_mismatch") throw new Error("language_mismatch");
        if (data.status === "failed" || data.status === "canceled") break;
      }
      throw new Error(text.analysisFailed);
    } catch (error) {
      if (analysisGeneration.current !== generation) return;
      setAnalysisStage("details");
      if (error instanceof ApiError && error.errors.food_context) {
        if (createdId) discardAnalysis(createdId);
        setContextInvalid(true);
        contextDialog.current?.showModal();
        showToast({ en: copy.en.foodContextInvalid, id: copy.id.foodContextInvalid }, "error");
        return;
      }
      if (createdId) {
        if (previousId) discardAnalysis(createdId);
        else setAnalysisId(createdId);
      }
      setAnalysisReady(true);
      const languageMismatch = error instanceof Error && error.message === "language_mismatch";
      showToast({ en: languageMismatch ? copy.en.languageFailed : error instanceof ApiError && error.status !== 503 ? errorText(error) : copy.en.analysisFailed, id: languageMismatch ? copy.id.languageFailed : copy.id.analysisFailed }, "error");
    }
  }
  function reviewPhoto(file: File) {
    cancelAnalysis();
    setMealTitle(""); setItems([blankItem()]); setAnalysisReady(false); setAnalysisStage("details"); setContextInvalid(false);
    setFoodContext("");
    setSelectedPhoto(file);
    setPreview(URL.createObjectURL(file));
    setFlowMode("review");
    requestId.current = null;
    if (photoEnabled === false) {
      setAnalysisReady(true);
      showToast({ en: copy.en.analysisFailed, id: copy.id.analysisFailed }, "info");
    }
  }
  function beginAnalysis() {
    if (!selectedPhoto || analysisStage !== "details" || analysisInFlight.current || photoEnabled === false || busy) return;
    if (foodContext.trim().length > 500) {
      setContextInvalid(true);
      showToast({ en: copy.en.foodContextInvalid, id: copy.id.foodContextInvalid }, "error");
      return;
    }
    analysisInFlight.current = true;
    const generation = ++analysisGeneration.current;
    contextDialog.current?.close();
    setAnalysisStage("uploading");
    void analyzePhoto(selectedPhoto, generation, foodContext.trim(), analysisId).finally(() => {
      if (analysisGeneration.current === generation) analysisInFlight.current = false;
    });
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showToast({ en: copy.en.invalidImage, id: copy.id.invalidImage }, "error");
      return;
    }
    reviewPhoto(file);
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
      reviewPhoto(new File([blob], "meal.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.88);
  }

  function updateItem(index: number, update: Partial<ReviewItem>) { setItems((current) => current.map((item, position) => position === index ? { ...item, ...update } : item)); }
  function changeGrams(index: number, grams: string) {
    const amount = Number(grams);
    setItems((current) => current.map((item, position) => {
      if (position !== index) return item;
      if (grams === "" || !Number.isFinite(amount) || amount <= 0) return { ...item, grams };
      if (!item.portionBasis) return { ...item, grams, portionBasis: { grams: amount, nutrients: { ...item.nutrients } } };
      return { ...item, grams, nutrients: scalePortion(item.portionBasis.nutrients, item.portionBasis.grams, amount) };
    }));
  }
  function changeNutrient(index: number, key: Nutrient, value: string) {
    setItems((current) => current.map((item, position) => {
      if (position !== index) return item;
      const nutrients = { ...item.nutrients, [key]: value };
      const grams = Number(item.grams);
      return { ...item, nutrients, portionBasis: item.grams !== "" && Number.isFinite(grams) && grams > 0 ? { grams, nutrients: { ...nutrients } } : null };
    }));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (analysisInFlight.current) return;
    const form = event.currentTarget;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    if (!name.value.trim() || (items.length > 1 && items.some((item) => !item.name.trim()))) {
      const missingIndex = items.length > 1 ? items.findIndex((item) => !item.name.trim()) : -1;
      const field = missingIndex >= 0 ? form.elements.namedItem(`item-${missingIndex}-name`) as HTMLInputElement : name;
      field.setCustomValidity(text.invalid);
      highlightInvalid(form, () => showToast({ en: copy.en.invalid, id: copy.id.invalid }, "error"));
      field.focus();
      return;
    }
    const values = new FormData(form);
    const mealItems: MealItem[] = items.map((item) => ({ food_id: null, name: items.length === 1 ? name.value.trim() : item.name.trim(), description: item.description.trim() || null, grams: item.grams ? Number(item.grams) : null,
      nutrients: Object.fromEntries(NUTRIENTS.map((key) => [key, item.nutrients[key] === "" ? null : Number(item.nutrients[key])])) as LoggedAmounts }));
    const input = {
      date: String(values.get("date") ?? ""),
      time: String(values.get("time") ?? ""),
      name: name.value.trim(), items: mealItems, analysisId: mode === "review" ? analysisId : null,
    };
    const serialized = JSON.stringify(input);
    if (!requestId.current || requestId.current.payload !== serialized) requestId.current = { payload: serialized, id: crypto.randomUUID() };
    setBusy(true);
    try {
      await saveMeal(input, editId || undefined, requestId.current.id);
      showToast({ en: editId ? copy.en.updated : copy.en.saved, id: editId ? copy.id.updated : copy.id.saved }, "success");
      if (editId) router.push("/home"); else openCamera();
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.errors)) {
          const match = field.match(/^items\.(\d+)\.(?:nutrients\.)?(\w+)$/);
          const input = match ? form.elements.namedItem(`item-${match[1]}-${match[2]}`) as HTMLInputElement | null : form.elements.namedItem(field === "title" ? "name" : field === "meal_date" ? "date" : field === "meal_time" ? "time" : field) as HTMLInputElement | null;
          input?.setCustomValidity(messages[0] ?? text.invalid);
        }
        highlightInvalid(form, () => {});
      }
      showToast({ en: errorText(error), id: errorText(error) }, "error");
    } finally { setBusy(false); }
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
        {photoEnabled === false && <p className="absolute inset-x-6 top-1/3 mx-auto max-w-sm rounded-xl bg-black/50 p-3 text-center text-xs font-bold backdrop-blur-sm">{text.analysisFailed}</p>}
        <div className="absolute right-5 bottom-[calc(7rem+env(safe-area-inset-bottom))] left-5 mx-auto max-w-sm sm:right-8 sm:left-8">
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
        <button className="btn absolute right-3 bottom-3 z-10 rounded-xl border border-white/30 bg-black/65 px-4 font-bold text-white backdrop-blur-sm hover:bg-black/80" type="button" disabled={busy} onClick={openCamera}>{text.retake}</button>
        {analysisStage !== "details" && <div className="absolute inset-0 grid place-items-center bg-black/40 px-5 text-white backdrop-blur-[1px]" role="status" aria-live="polite"><div className="w-full max-w-xs rounded-2xl border border-white/25 bg-black/65 px-6 py-5 text-center shadow-lg"><p className="text-sm font-extrabold">{analysisStage === "uploading" ? text.uploading : analysisStage === "queued" ? text.queued : text.analyzing}</p><progress className="progress progress-warning mt-4 w-full" aria-label={text.analyzing} /></div></div>}
      </section>}

      {mode === "review" && photoEnabled !== false && analysisStage === "details" && <div className="flex justify-end"><button className="btn btn-outline rounded-xl border-line bg-surface text-primary" type="button" disabled={busy} onClick={() => contextDialog.current?.showModal()}>{analysisReady ? items[0]?.name ? text.notAccurate : text.retryAnalysis : text.addDetails}</button></div>}

      {mode === "review" && <dialog ref={contextDialog} className="modal z-50" aria-labelledby="food-context-title">
        <div className="modal-box max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-[1.6rem] border border-line bg-surface p-5 text-ink shadow-2xl sm:p-7">
          <form method="dialog" className="float-right"><button className="btn btn-ghost size-11 rounded-full" type="submit" aria-label={text.close}>✕</button></form>
          <h2 id="food-context-title" className="pr-10 text-xl font-extrabold tracking-[-.04em]">{text.foodContextTitle}</h2>
          <p id="food-context-hint" className="mt-2 text-sm leading-6 text-muted">{text.foodContextHint}</p>
          <label className="mt-5 grid gap-2 text-sm font-bold" htmlFor="food-context">{text.foodContext}</label>
          <textarea id="food-context" className={`textarea mt-2 min-h-28 w-full max-w-none rounded-xl border bg-base-200 text-ink shadow-sm placeholder:text-muted/70 focus:border-primary focus:shadow-md ${contextInvalid ? "border-error ring-2 ring-error/30" : "border-line"}`} maxLength={500} placeholder={text.foodContextPlaceholder} value={foodContext} disabled={analysisStage !== "details" || photoEnabled === false || busy} aria-invalid={contextInvalid} aria-describedby={contextInvalid ? "food-context-hint food-context-error" : "food-context-hint"} onChange={(event) => { setFoodContext(event.target.value); setContextInvalid(false); }} />
          {contextInvalid && <p id="food-context-error" className="mt-2 text-sm text-error" role="alert">{text.foodContextInvalid}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted">{foodContext.length}/500</span><button className="btn btn-primary rounded-xl px-5 font-extrabold" type="button" disabled={analysisStage !== "details" || photoEnabled === false || busy} onClick={beginAnalysis}>{analysisReady ? text.reanalyzePhoto : text.analyzePhoto}</button></div>
        </div>
        <form method="dialog" className="modal-backdrop"><button type="submit" aria-label={text.close}>{text.close}</button></form>
      </dialog>}

      {mode === "review" && photoEnabled === false && <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">{text.analysisFailed}</p>}

      {mode === "manual" && <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-line bg-surface p-5 shadow-sm sm:p-7"><div><h2 className="text-xl font-extrabold">{text.manualTitle}</h2><p className="mt-1 text-sm text-muted">{text.manualHint}</p></div><div className="flex flex-wrap gap-2"><button className="btn btn-outline rounded-xl border-line bg-base-200 text-primary" type="button" onClick={openCamera}>{text.camera}</button><button className="btn btn-outline rounded-xl border-line bg-base-200 text-primary" type="button" onClick={() => uploadRef.current?.click()}>{text.upload}</button></div></section>}

      {mode === "edit" && !editMeal && <section className="rounded-[1.6rem] border border-line bg-surface p-6 shadow-sm"><p className="font-bold">{editError ? text.missing : text.loadingMeal}</p>{editError && <Link className="btn btn-primary mt-4 rounded-xl" href="/home">{text.backHome}</Link>}</section>}

      {mode !== "camera" && (mode !== "review" || readyForReview) && (mode !== "edit" || editMeal) && <motion.section id="meal-review" className="rounded-[1.7rem] border border-line bg-surface p-5 shadow-sm sm:p-8" aria-labelledby="meal-review-title" initial={mode === "review" && !reducedMotion ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h2 id="meal-review-title" className="text-2xl font-extrabold tracking-[-.05em]">{mode === "edit" ? text.editTitle : mode === "review" ? text.nutritionDetails : text.manualTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{mode === "edit" ? text.editHint : mode === "review" ? text.photoHint : text.manualHint}</p>
        <form key={editMeal?.id ?? mode + logDate} className="mt-6" onSubmit={submit} onInvalid={(event) => highlightInvalid(event.currentTarget, () => showToast({ en: copy.en.invalid, id: copy.id.invalid }, "error"))}>
          <fieldset disabled={analysisStage !== "details"} className={`space-y-6 ${analysisStage === "details" ? "" : "opacity-60"}`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold sm:col-span-3">{text.mealName}<input className={inputClass} name="name" maxLength={80} placeholder={text.mealPlaceholder} value={mealTitle} onChange={(event) => { event.currentTarget.setCustomValidity(""); setMealTitle(event.target.value); }} required /></label>
            <label className="grid gap-2 text-sm font-bold">{text.date}<input className={inputClass} name="date" type="date" min="1900-01-01" max={today || undefined} defaultValue={editMeal?.date ?? logDate} required /></label>
            <label className="grid gap-2 text-sm font-bold">{text.time}<input className={inputClass} name="time" type="time" defaultValue={editMeal?.time ?? new Date().toTimeString().slice(0, 5)} required /></label>
          </div>
          {items.map((item, index) => <section key={index} className="space-y-4 rounded-2xl border border-line bg-base-200/50 p-4 sm:p-5" aria-label={`${text.item} ${index + 1}`}>
            <h3 className="font-extrabold text-primary">{text.item}{items.length > 1 ? ` ${index + 1}` : ""}</h3>
            {items.length > 1 && <label className="grid gap-2 text-sm font-bold">{text.item}<input className={inputClass} name={`item-${index}-name`} maxLength={160} value={item.name} onChange={(event) => { event.currentTarget.setCustomValidity(""); updateItem(index, { name: event.target.value }); }} required /></label>}
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">{text.description}<input className={inputClass} name={`item-${index}-description`} maxLength={200} value={item.description} onChange={(event) => { event.currentTarget.setCustomValidity(""); updateItem(index, { description: event.target.value }); }} required={mode === "review" && Boolean(analysisId)} /></label><label className="grid gap-2 text-sm font-bold">{text.grams}<input className={inputClass} name={`item-${index}-grams`} type="number" min="0.1" max="2000" step="0.1" inputMode="decimal" value={item.grams} onChange={(event) => { event.currentTarget.setCustomValidity(""); changeGrams(index, event.target.value); }} /></label></div>
            <div><h4 className="text-sm font-extrabold text-primary">{text.required}</h4><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{NUTRIENTS.slice(0, 4).map((key) => <label key={key} className="grid gap-2 text-xs font-bold">{nutrientLabels[language][key]} ({nutrientUnits[key]})<input className={inputClass} name={`item-${index}-${key}`} type="number" min={0} max={NUTRIENT_LIMITS[key]} step="0.01" inputMode="decimal" value={item.nutrients[key]} onChange={(event) => { event.currentTarget.setCustomValidity(""); changeNutrient(index, key, event.target.value); }} required /></label>)}</div></div>
            <div><h4 className="text-sm font-extrabold text-primary">{text.optional}</h4><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">{NUTRIENTS.slice(4).map((key) => <label key={key} className="grid gap-2 text-xs font-bold">{nutrientLabels[language][key]} ({nutrientUnits[key]})<input className={inputClass} name={`item-${index}-${key}`} type="number" min={0} max={NUTRIENT_LIMITS[key]} step="0.01" inputMode="decimal" placeholder="—" value={item.nutrients[key]} onChange={(event) => { event.currentTarget.setCustomValidity(""); changeNutrient(index, key, event.target.value); }} /></label>)}</div></div>
          </section>)}
          <div className="flex flex-wrap gap-3"><button className="btn btn-primary rounded-xl px-6 font-extrabold" type="submit" disabled={busy}>{busy ? "…" : mode === "edit" ? text.update : text.save}</button>{mode === "edit" && <Link className="btn btn-ghost rounded-xl" href="/home">{text.backHome}</Link>}</div>
          </fieldset>
        </form>
      </motion.section>}
    </div>
  );
}
