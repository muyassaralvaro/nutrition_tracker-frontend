"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { ApiError, errorText } from "@/shared/api-client";
import { displayHeight, displayWeight, estimateTargets, feetAndInches, heightToCm, leanMassWeightRange, NUTRIENTS, NUTRIENT_LIMITS, referenceWeightRange, weightToKg, type ActivityType, type BodyBuild, type FormulaSex, type Goal, type Nutrient, type NutrientAmounts, type UnitSystem } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { ageFromBirthDate, fetchTargetEstimate, saveSetup, useTodayKey, type Profile } from "../../tracker-data";

type Draft = Profile & { weightKg: number | null };
const activityMinuteOptions = [0, 15, 30, 60, 90, 120, 180, 240] as const;

const copy = {
  en: {
    steps: ["About you", "Your direction", "Movement", "Daily targets"],
    title: ["Start with your basics.", "What feels right for you?", "How do you move?", "Review your nutrition plan."],
    intro: ["These details set the starting point for your estimate.", "Choose a goal and the shape that feels closest to you.", "Usual active minutes and activity type shape the estimate.", "These adult estimates are editable. Use your own numbers when you prefer."],
    name: "Name", namePlaceholder: "Your name", birthDate: "Date of birth", birthHint: "Your birth date is stored with your account and used to calculate age and nutrition needs.", age: "Calculated age", years: "years", height: "Height", feet: "Feet", inches: "Inches", weight: "Current weight", units: "Units", metric: "kg / cm", imperial: "lb / ft + in", gender: "Gender", chooseGender: "Select gender", female: "Woman", male: "Man", goal: "Your goal", goals: { lose: "Lose weight", maintain: "Maintain", gain: "Gain weight" },
    build: "Body shape and muscle", builds: { lean: "Lean", soft: "Lean, softer middle", stocky: "Broad build", muscular: "Muscular" }, buildHint: "Self-description only. Shape cannot measure muscle or body fat.",
    range: "Height-based reference", rangeHint: "BMI 18.5–24.9 gives a broad weight range, not an ideal body. Muscle can make this range less useful.", leanRange: "Lean-mass reference", leanRangeHint: "Keeps current lean mass within a broad adult body-fat band: 10–24% for men, 20–34% for women. A planning reference, not an ideal-body diagnosis.", goalWeight: "Your goal weight (optional)", bodyFat: "Measured body fat % (optional)", leanMass: "Estimated lean mass from your entered body fat:",
    minutes: "Active minutes on a usual day", chooseMinutes: "Choose the closest amount", savedMinutes: "Saved amount", minuteOptions: ["Almost none · 0 min", "A little · about 15 min", "Light · about 30 min", "Moderate · about 1 hour", "Active · about 1½ hours", "Very active · about 2 hours", "Extended · about 3 hours", "Extended · about 4 hours"], type: "Main activity", types: { daily: "Everyday movement", cardio: "Cardio", strength: "Strength training", mixed: "Mixed training" }, activityHint: "Choose your closest daily amount. Minutes and activity type guide your calorie estimate; strength training also raises protein estimate.",
    estimate: "Use estimate", estimateMissing: "Complete your details or fill every target manually.", limit: "Calories and macros count within 90–105% of these targets. Fiber and minerals need at least 90%; sodium is an upper limit.", detail: "Estimates use age, height, weight, gender, and activity. Check with a clinician for medical diets.",
    core: "Energy and macros", minerals: "Fiber and minerals", back: "Back", next: "Continue", save: "Save my plan", cancel: "Close", missing: "Complete required fields in this step.", invalid: "Check target values and current weight.", saved: "Nutrition plan saved.",
  },
  id: {
    steps: ["Tentangmu", "Tujuanmu", "Aktivitas", "Target harian"],
    title: ["Mulai dari data dirimu.", "Apa tujuan yang cocok?", "Bagaimana kamu bergerak?", "Tinjau rencana gizimu."],
    intro: ["Data ini menjadi dasar perkiraan awal.", "Pilih tujuan dan bentuk tubuh yang paling mendekatimu.", "Menit aktif dan jenis aktivitas membentuk perkiraan.", "Perkiraan untuk dewasa ini bisa diubah. Gunakan angka sendiri jika perlu."],
    name: "Nama", namePlaceholder: "Nama Anda", birthDate: "Tanggal lahir", birthHint: "Tanggal lahir tersimpan pada akunmu dan digunakan untuk menghitung usia serta kebutuhan gizi.", age: "Usia terhitung", years: "tahun", height: "Tinggi", feet: "Kaki", inches: "Inci", weight: "Berat saat ini", units: "Satuan", metric: "kg / cm", imperial: "lb / kaki + inci", gender: "Gender", chooseGender: "Pilih gender", female: "Perempuan", male: "Laki-laki", goal: "Tujuanmu", goals: { lose: "Turunkan berat", maintain: "Pertahankan", gain: "Tambah berat" },
    build: "Bentuk tubuh dan otot", builds: { lean: "Ramping", soft: "Ramping, perut lebih lembut", stocky: "Badan lebar", muscular: "Berotot" }, buildHint: "Hanya gambaran diri. Bentuk tubuh tidak mengukur otot atau lemak.",
    range: "Acuan dari tinggi badan", rangeHint: "IMT 18,5–24,9 memberi rentang berat umum, bukan tubuh ideal. Otot dapat membuat rentang ini kurang sesuai.", leanRange: "Acuan massa tanpa lemak", leanRangeHint: "Mempertahankan massa tanpa lemak dalam kisaran lemak tubuh dewasa: 10–24% untuk laki-laki, 20–34% untuk perempuan. Acuan perencanaan, bukan diagnosis tubuh ideal.", goalWeight: "Berat tujuanmu (opsional)", bodyFat: "Lemak tubuh terukur % (opsional)", leanMass: "Perkiraan massa tanpa lemak dari data yang kamu isi:",
    minutes: "Menit aktif pada hari biasa", chooseMinutes: "Pilih jumlah yang paling mendekati", savedMinutes: "Jumlah tersimpan", minuteOptions: ["Hampir tidak ada · 0 menit", "Sedikit · sekitar 15 menit", "Ringan · sekitar 30 menit", "Sedang · sekitar 1 jam", "Aktif · sekitar 1,5 jam", "Sangat aktif · sekitar 2 jam", "Lama · sekitar 3 jam", "Lama · sekitar 4 jam"], type: "Aktivitas utama", types: { daily: "Gerak sehari-hari", cardio: "Kardio", strength: "Latihan beban", mixed: "Latihan campuran" }, activityHint: "Pilih jumlah harian yang paling mendekati. Menit dan jenis aktivitas menentukan perkiraan kalori; latihan beban juga meningkatkan perkiraan protein.",
    estimate: "Gunakan perkiraan", estimateMissing: "Lengkapi data diri atau isi semua target secara manual.", limit: "Kalori dan makro tercapai pada 90–105% target ini. Serat dan mineral minimal 90%; natrium adalah batas atas.", detail: "Perkiraan memakai usia, tinggi, berat, gender, dan aktivitas. Untuk diet medis, konsultasikan dengan tenaga kesehatan.",
    core: "Energi dan makro", minerals: "Serat dan mineral", back: "Kembali", next: "Lanjut", save: "Simpan rencana", cancel: "Tutup", missing: "Lengkapi data wajib pada langkah ini.", invalid: "Periksa target dan berat saat ini.", saved: "Rencana gizi disimpan.",
  },
} as const;

const inputClass = "input w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm placeholder:text-muted/70 focus:border-primary focus:outline-primary focus:shadow-md";
const selectClass = "select w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm focus:border-primary focus:outline-primary focus:shadow-md";
const labelClass = "grid content-start gap-2 text-sm font-bold";

function BodyFigure({ build }: { build: Exclude<BodyBuild, ""> }) {
  const shoulder = { lean: 36, soft: 35, stocky: 30, muscular: 28 }[build];
  const waist = { lean: 39, soft: 34, stocky: 32, muscular: 37 }[build];
  return <svg viewBox="0 0 100 116" className="mx-auto h-24 w-20 text-primary" fill="currentColor" aria-hidden="true"><circle cx="50" cy="14" r="10" opacity=".75" /><path d={`M${shoulder} 28 Q50 24 ${100 - shoulder} 28 L${100 - waist} 70 Q50 77 ${waist} 70Z`} opacity=".75" /><path d={`M${shoulder - 3} 30 Q${shoulder - 10} 40 ${shoulder - 7} 69 M${103 - shoulder} 30 Q${110 - shoulder} 40 ${107 - shoulder} 69`} fill="none" stroke="currentColor" strokeWidth={build === "muscular" ? 9 : 7} strokeLinecap="round" opacity=".7" /><path d="M43 72 39 106m18-34 4 34" fill="none" stroke="currentColor" strokeWidth={build === "stocky" ? 12 : 9} strokeLinecap="round" opacity=".75" />{build === "muscular" && <path d="M41 39h18M44 50h12M50 32v30" fill="none" stroke="var(--brand-sun)" strokeWidth="2.5" strokeLinecap="round" />}</svg>;
}

export function ProfileSetup({ profile, weightKg, onDone, onCancel }: { profile: Profile; weightKg: number | null; onDone: () => void; onCancel: () => void }) {
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...profile, weightKg });
  const [feet, setFeet] = useState(() => profile.heightCm === null ? "" : String(feetAndInches(profile.heightCm)[0]));
  const [inches, setInches] = useState(() => profile.heightCm === null ? "" : String(feetAndInches(profile.heightCm)[1]));
  const [targetDraft, setTargetDraft] = useState<Record<Nutrient, string>>(() => Object.fromEntries(NUTRIENTS.map((key) => [key, profile.targets?.[key]?.toString() ?? ""])) as Record<Nutrient, string>);
  const [editedTargets, setEditedTargets] = useState(Boolean(profile.targets) && profile.targetSource !== "estimated");
  const [busy, setBusy] = useState(false);
  const [serverInvalid, setServerInvalid] = useState<Set<string>>(new Set());
  const today = useTodayKey();
  const age = ageFromBirthDate(draft.birthDate, today || undefined);
  const estimate = estimateTargets({ ...draft, age });
  const weightRange = draft.heightCm && draft.heightCm >= 80 && draft.heightCm <= 250 ? referenceWeightRange(draft.heightCm) : null;
  const leanRange = draft.weightKg !== null && draft.bodyFatPercent !== null ? leanMassWeightRange(draft.weightKg, draft.bodyFatPercent, draft.sex) : null;
  const weightUnit = draft.unitSystem === "metric" ? "kg" : "lb";
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const showErrors = attemptedStep === step;
  const badTarget = (key: Nutrient) => targetDraft[key] === "" || !Number.isFinite(Number(targetDraft[key])) || Number(targetDraft[key]) < (key === "calories" ? 800 : 1) || Number(targetDraft[key]) > NUTRIENT_LIMITS[key];

  function update<K extends keyof Draft>(key: K, value: Draft[K]) { setServerInvalid(new Set()); setDraft((current) => ({ ...current, [key]: value })); }
  function numeric(value: string) { const amount = Number(value); return value === "" || !Number.isFinite(amount) ? null : amount; }
  function changeUnit(unit: UnitSystem) {
    if (unit === "imperial" && draft.heightCm !== null) {
      const [nextFeet, nextInches] = feetAndInches(draft.heightCm);
      setFeet(String(nextFeet));
      setInches(String(nextInches));
    }
    update("unitSystem", unit);
  }
  function updateImperialHeight(nextFeet: string, nextInches: string) {
    setFeet(nextFeet);
    setInches(nextInches);
    const foot = numeric(nextFeet);
    const inch = numeric(nextInches);
    update("heightCm", foot !== null && inch !== null && Number.isInteger(foot) && Number.isInteger(inch) && foot >= 2 && foot <= 8 && inch >= 0 && inch < 12 ? heightToCm(foot * 12 + inch, "imperial") : null);
  }
  function notify(key: "missing" | "invalid" | "saved", kind: "error" | "success") { showToast({ en: copy.en[key], id: copy.id[key] }, kind); }
  async function applyEstimate() {
    if (!estimate || draft.weightKg === null) return false;
    setBusy(true);
    try {
      const targets = await fetchTargetEstimate({ ...draft, age }, draft.weightKg);
      setTargetDraft(Object.fromEntries(NUTRIENTS.map((key) => [key, String(targets[key])])) as Record<Nutrient, string>);
      setEditedTargets(false);
      return true;
    } catch (error) { showToast({ en: errorText(error), id: errorText(error) }, "error"); return false; }
    finally { setBusy(false); }
  }

  async function next() {
    const valid = step === 0 ? Boolean(draft.name.trim() && age !== null && age >= 18 && age <= 120 && draft.heightCm !== null && draft.heightCm >= 80 && draft.heightCm <= 250 && draft.weightKg !== null && draft.weightKg >= 20 && draft.weightKg <= 500 && draft.sex)
      : step === 1 ? Boolean(draft.goal && draft.build && (draft.goalWeightKg === null || draft.goalWeightKg >= 20 && draft.goalWeightKg <= 500) && (draft.bodyFatPercent === null || draft.bodyFatPercent >= 3 && draft.bodyFatPercent <= 70))
        : Boolean(draft.activityType && draft.activityMinutes !== null && Number.isInteger(draft.activityMinutes) && draft.activityMinutes >= 0 && draft.activityMinutes <= 240);
    if (!valid) { setAttemptedStep(step); notify("missing", "error"); return; }
    if (step === 2 && !editedTargets && !(await applyEstimate())) return;
    setAttemptedStep(null);
    setStep((current) => current + 1);
  }

  async function finish() {
    if (NUTRIENTS.some(badTarget)) { setAttemptedStep(3); notify("invalid", "error"); return; }
    const targets = Object.fromEntries(NUTRIENTS.map((key) => [key, Number(targetDraft[key])])) as NutrientAmounts;
    const { weightKg: currentWeight, ...plan } = draft;
    if (currentWeight === null) { setAttemptedStep(3); notify("invalid", "error"); return; }
    setBusy(true);
    try { await saveSetup({ ...plan, age, targets }, currentWeight, editedTargets ? "edited" : "estimated"); notify("saved", "success"); onDone(); }
    catch (error) {
      const fields = error instanceof ApiError ? Object.keys(error.errors) : [];
      const first = fields[0] ?? "";
      const failedStep = ["name", "birth_date", "height_cm", "weight_kg", "sex"].includes(first) ? 0
        : ["goal", "body_build", "goal_weight_kg", "body_fat_percent"].includes(first) ? 1
          : ["activity_minutes", "activity_type"].includes(first) ? 2 : 3;
      setServerInvalid(new Set(fields)); setStep(failedStep); setAttemptedStep(failedStep);
      showToast({ en: errorText(error), id: errorText(error) }, "error");
    }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{language === "id" ? "PENGATURAN PROFIL" : "PROFILE SETUP"}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] sm:text-4xl">{text.title[step]}</h1></div><button className="btn btn-ghost btn-sm rounded-xl" type="button" onClick={onCancel}>{text.cancel}</button></div>
    <p className="max-w-2xl text-sm leading-6 text-muted">{text.intro[step]}</p>
    <p className="text-xs font-extrabold text-primary sm:hidden">{step + 1} / 4 · {text.steps[step]}</p>
    <ol className="grid grid-cols-4 gap-2" aria-label={language === "id" ? "Langkah profil" : "Profile steps"}>{text.steps.map((label, index) => <li key={label} className="min-w-0"><span className={`block h-2 rounded-full ${index <= step ? "bg-brand-blue" : "bg-base-300"}`} /><span className={`mt-2 hidden text-[.66rem] font-bold sm:block ${index === step ? "text-primary" : "text-muted"}`}>{index + 1}. {label}</span></li>)}</ol>
    <motion.section key={step} className="rounded-[1.7rem] border border-line bg-surface p-5 sm:p-8" initial={reducedMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
      {step === 0 && <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>{text.name}<input className={inputClass} value={draft.name} placeholder={text.namePlaceholder} maxLength={80} autoComplete="name" aria-invalid={serverInvalid.has("name") || showErrors && !draft.name.trim()} required onChange={(event) => update("name", event.target.value)} /></label>
          <label className={labelClass}>{text.birthDate}<input className={inputClass} type="date" max={today || undefined} value={draft.birthDate} aria-invalid={serverInvalid.has("birth_date") || showErrors && (age === null || age < 18 || age > 120)} required onChange={(event) => update("birthDate", event.target.value)} /><span className="text-xs font-normal leading-5 text-muted">{text.birthHint}</span></label>
        </div>
        {age !== null && <p className="rounded-xl bg-brand-sky/15 px-4 py-3 text-sm font-bold text-primary">{text.age}: {age} {text.years}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold">{text.units}</p><div className="join" role="group" aria-label={text.units}>{(["metric", "imperial"] as const).map((unit) => <button key={unit} type="button" aria-pressed={draft.unitSystem === unit} className={`btn btn-sm join-item ${draft.unitSystem === unit ? "btn-primary" : "btn-outline border-line bg-base-200 text-ink"}`} onClick={() => changeUnit(unit as UnitSystem)}>{text[unit]}</button>)}</div></div>
        <div className="grid gap-5 sm:grid-cols-2">
          {draft.unitSystem === "metric" ? <label className={labelClass}>{text.height} (cm)<input className={inputClass} type="number" min={80} max={250} step="0.1" inputMode="decimal" placeholder="170" value={draft.heightCm === null ? "" : displayHeight(draft.heightCm, "metric")} aria-invalid={serverInvalid.has("height_cm") || showErrors && (draft.heightCm === null || draft.heightCm < 80 || draft.heightCm > 250)} required onChange={(event) => { const value = numeric(event.target.value); update("heightCm", value === null ? null : heightToCm(value, "metric")); }} /></label> : <div className="grid content-start gap-2 text-sm font-bold"><span>{text.height}</span><div className="grid grid-cols-2 gap-3"><label className={labelClass}>{text.feet}<input className={inputClass} type="number" min={2} max={8} step={1} inputMode="numeric" placeholder="5" value={feet} aria-invalid={serverInvalid.has("height_cm") || showErrors && (draft.heightCm === null || draft.heightCm < 80 || draft.heightCm > 250)} required onChange={(event) => updateImperialHeight(event.target.value, inches)} /></label><label className={labelClass}>{text.inches}<input className={inputClass} type="number" min={0} max={11} step={1} inputMode="numeric" placeholder="11" value={inches} aria-invalid={serverInvalid.has("height_cm") || showErrors && (draft.heightCm === null || draft.heightCm < 80 || draft.heightCm > 250)} required onChange={(event) => updateImperialHeight(feet, event.target.value)} /></label></div></div>}
          <label className={`${labelClass} ${draft.unitSystem === "imperial" ? "sm:pt-7" : ""}`}>{text.weight} ({weightUnit})<input className={inputClass} type="number" min={draft.unitSystem === "metric" ? 20 : 44.1} max={draft.unitSystem === "metric" ? 500 : 1102.2} step="0.1" inputMode="decimal" placeholder={draft.unitSystem === "metric" ? "70" : "154"} value={draft.weightKg === null ? "" : displayWeight(draft.weightKg, draft.unitSystem)} aria-invalid={serverInvalid.has("weight_kg") || showErrors && (draft.weightKg === null || draft.weightKg < 20 || draft.weightKg > 500)} required onChange={(event) => { const value = numeric(event.target.value); update("weightKg", value === null ? null : weightToKg(value, draft.unitSystem)); }} /></label>
        </div>
        <label className={labelClass}>{text.gender}<select className={selectClass} value={draft.sex} aria-invalid={serverInvalid.has("sex") || showErrors && !draft.sex} required onChange={(event) => update("sex", event.target.value as FormulaSex)}><option value="">{text.chooseGender}</option><option value="female">{text.female}</option><option value="male">{text.male}</option></select></label>
      </div>}
      {step === 1 && <div className="space-y-7">
        <div><h2 className="font-extrabold">{text.goal}</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{(["lose", "maintain", "gain"] as const).map((goal) => <button key={goal} type="button" aria-pressed={draft.goal === goal} data-invalid={serverInvalid.has("goal") || showErrors && !draft.goal} className={`rounded-2xl border p-4 text-left font-bold shadow-sm transition-shadow hover:shadow-md ${draft.goal === goal ? "border-primary bg-primary/10 text-primary" : "border-line bg-base-200/60 hover:border-primary"}`} onClick={() => update("goal", goal as Goal)}>{text.goals[goal]}</button>)}</div></div>
        <div><h2 className="font-extrabold">{text.build}</h2><p className="mt-1 text-xs leading-5 text-muted">{text.buildHint}</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{(["lean", "soft", "stocky", "muscular"] as const).map((build) => <button key={build} type="button" aria-pressed={draft.build === build} data-invalid={serverInvalid.has("body_build") || showErrors && !draft.build} className={`rounded-2xl border p-3 text-center shadow-sm transition-shadow hover:shadow-md ${draft.build === build ? "border-primary bg-primary/10" : "border-line bg-base-200/60 hover:border-primary"}`} onClick={() => update("build", build)}><BodyFigure build={build} /><span className="mt-2 block text-xs font-extrabold sm:text-sm">{text.builds[build]}</span></button>)}</div></div>
        {weightRange && <div className="rounded-2xl bg-base-200 p-5 shadow-sm"><p className="text-xs font-extrabold tracking-[.1em] text-primary">{text.range}</p><p className="mt-2 text-2xl font-extrabold">{number.format(displayWeight(weightRange[0], draft.unitSystem))}–{number.format(displayWeight(weightRange[1], draft.unitSystem))} {weightUnit}</p><p className="mt-2 text-xs leading-5 text-muted">{text.rangeHint}</p></div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>{text.goalWeight} ({weightUnit})<input className={inputClass} type="number" min={draft.unitSystem === "metric" ? 20 : 44.1} max={draft.unitSystem === "metric" ? 500 : 1102.2} step="0.1" inputMode="decimal" placeholder={draft.unitSystem === "metric" ? "70" : "154"} value={draft.goalWeightKg === null ? "" : displayWeight(draft.goalWeightKg, draft.unitSystem)} aria-invalid={serverInvalid.has("goal_weight_kg") || showErrors && draft.goalWeightKg !== null && (draft.goalWeightKg < 20 || draft.goalWeightKg > 500)} onChange={(event) => { const value = numeric(event.target.value); update("goalWeightKg", value === null ? null : weightToKg(value, draft.unitSystem)); }} /></label>
          <label className={labelClass}>{text.bodyFat}<input className={inputClass} type="number" min={3} max={70} step="0.1" inputMode="decimal" placeholder="20" value={draft.bodyFatPercent ?? ""} aria-invalid={serverInvalid.has("body_fat_percent") || showErrors && draft.bodyFatPercent !== null && (draft.bodyFatPercent < 3 || draft.bodyFatPercent > 70)} onChange={(event) => update("bodyFatPercent", numeric(event.target.value))} /></label>
        </div>
        {draft.weightKg && draft.bodyFatPercent && <p className="text-sm text-muted">{text.leanMass} <strong className="text-ink">{number.format(displayWeight(draft.weightKg * (1 - draft.bodyFatPercent / 100), draft.unitSystem))} {weightUnit}</strong></p>}
        {leanRange && <div className="rounded-2xl border border-brand-sky/60 bg-brand-sky/10 p-5 shadow-sm"><p className="text-xs font-extrabold tracking-[.1em] text-primary">{text.leanRange}</p><p className="mt-2 text-2xl font-extrabold">{number.format(displayWeight(leanRange[0], draft.unitSystem))}–{number.format(displayWeight(leanRange[1], draft.unitSystem))} {weightUnit}</p><p className="mt-2 text-xs leading-5 text-muted">{text.leanRangeHint}</p></div>}
      </div>}
      {step === 2 && <div className="space-y-6"><label className={labelClass}>{text.minutes}<select className={selectClass} value={draft.activityMinutes ?? ""} aria-invalid={serverInvalid.has("activity_minutes") || showErrors && (draft.activityMinutes === null || !Number.isInteger(draft.activityMinutes) || draft.activityMinutes < 0 || draft.activityMinutes > 240)} required onChange={(event) => update("activityMinutes", Number(event.target.value))}><option value="" disabled>{text.chooseMinutes}</option>{profile.activityMinutes !== null && !activityMinuteOptions.some((minutes) => minutes === profile.activityMinutes) && <option value={profile.activityMinutes}>{text.savedMinutes} · {profile.activityMinutes} {language === "id" ? "menit/hari" : "min/day"}</option>}{activityMinuteOptions.map((minutes, index) => <option key={minutes} value={minutes}>{text.minuteOptions[index]}</option>)}</select></label><div><h2 className="font-extrabold">{text.type}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{(["daily", "cardio", "strength", "mixed"] as const).map((type) => <button key={type} type="button" aria-pressed={draft.activityType === type} data-invalid={serverInvalid.has("activity_type") || showErrors && !draft.activityType} className={`rounded-2xl border p-5 text-left font-bold transition-colors ${draft.activityType === type ? "border-primary bg-primary/10 text-primary" : "border-line hover:border-primary"}`} onClick={() => update("activityType", type as ActivityType)}>{text.types[type]}</button>)}</div></div><p className="text-sm leading-6 text-muted">{text.activityHint}</p></div>}
      {step === 3 && <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-lg text-sm leading-6 text-muted">{estimate ? text.detail : text.estimateMissing}</p>{estimate && <button className="btn btn-outline btn-sm rounded-xl border-line text-primary" type="button" onClick={applyEstimate}>{text.estimate}</button>}</div>{[NUTRIENTS.slice(0, 4), NUTRIENTS.slice(4)].map((group, index) => <div key={index}><h2 className="mb-3 text-sm font-extrabold text-primary">{index === 0 ? text.core : text.minerals}</h2><div className="grid gap-4 sm:grid-cols-3">{group.map((key) => <label key={key} className={labelClass}><span>{nutrientLabels[language][key]} <span className="font-normal text-muted">({nutrientUnits[key]})</span></span><input className={inputClass} type="number" inputMode="decimal" min={key === "calories" ? 800 : 1} max={NUTRIENT_LIMITS[key]} step={key === "iron" ? "0.1" : "1"} value={targetDraft[key]} aria-invalid={serverInvalid.has(`targets.${key}`) || showErrors && badTarget(key)} onChange={(event) => { setServerInvalid(new Set()); setEditedTargets(true); setTargetDraft((current) => ({ ...current, [key]: event.target.value })); }} /></label>)}</div></div>)}<p className="text-xs leading-5 text-muted">{text.limit}</p></div>}
    </motion.section>
    <div className="flex justify-between gap-3"><button className="btn btn-ghost rounded-xl" type="button" onClick={step === 0 ? onCancel : () => { setAttemptedStep(null); setStep((current) => current - 1); }}>{text.back}</button><button className="btn btn-primary rounded-xl px-6 font-extrabold" type="button" disabled={busy} onClick={step === 3 ? finish : next}>{step === 3 ? text.save : text.next}</button></div>
  </div>;
}
