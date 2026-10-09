"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { errorText } from "@/shared/api-client";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayHeight, displayWeight, feetAndInches, GOAL_LOWER_RATIO, GOAL_UPPER_RATIO, MACRO_NUTRIENTS, NUTRIENTS } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isProfileComplete, loadWeightMonth, saveAvatar, useTodayKey, useTrackerData, type WeightEntry } from "../../tracker-data";
import { ProfileSetup } from "./ProfileSetup";
import { WeightHistoryChart } from "./WeightHistoryChart";
import { formatWeightDate, shiftWeightMonth, weightMonthSeries } from "./weight-history";

const copy = {
  en: {
    eyebrow: "YOUR PROFILE", member: "Your Nourish space", newMember: "Your space starts here", status: "Personal plan", missing: "Finish setup to see your plan", start: "Build my plan", edit: "Edit plan", photo: "Change profile photo", photoError: "Choose a JPG, PNG, or WebP photo under 3 MB.", photoSaved: "Profile photo saved.",
    basics: "Your details", age: "Age", height: "Height", weight: "Current weight", bodyFat: "Body fat", noData: "Not set", years: "years", cm: "cm", kg: "kg",
    direction: "Your direction", goal: "Goal", goalWeight: "Goal weight", build: "Body shape", activity: "Daily activity", minutes: "min/day", goals: { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" }, builds: { lean: "Lean", soft: "Lean, softer middle", stocky: "Broad build", muscular: "Muscular" }, activities: { daily: "Everyday movement", cardio: "Cardio", strength: "Strength", mixed: "Mixed" },
    targets: "Your daily targets", targetHint: "Editable values. Calories and macros count within 90–105%; fiber and minerals need at least 90%. Sodium is an upper limit.", targetRange: "Goal range", targetMinimum: "Minimum", targetLimit: "Upper limit", history: "Weight history", historyHint: "Daily view by month", historyTrend: "Daily weight", firstCheckIn: "First check-in", lastCheckIn: "Last check-in", sinceLast: "Since last check-in", checkIns: "check-ins", emptyHistory: "No weight recorded by this month.", goalProgress: "Goal progress", toGoal: "to goal", goalLine: "Goal weight", previousMonth: "Previous month", nextMonth: "Next month", carriedWeight: "Last recorded weight", carryHint: "Days without a check-in use your last recorded weight.", loadingHistory: "Loading weight history…", historyError: "Could not load weight history.", retryHistory: "Try again", privacy: "Profile, weight, and photo are saved to your account. Your photo stays private and can be changed here.",
  },
  id: {
    eyebrow: "PROFILMU", member: "Ruang Nourish milikmu", newMember: "Ruangmu dimulai di sini", status: "Rencana pribadi", missing: "Lengkapi profil untuk melihat rencana", start: "Buat rencana", edit: "Ubah rencana", photo: "Ganti foto profil", photoError: "Pilih foto JPG, PNG, atau WebP di bawah 3 MB.", photoSaved: "Foto profil tersimpan.",
    basics: "Data dirimu", age: "Usia", height: "Tinggi", weight: "Berat saat ini", bodyFat: "Lemak tubuh", noData: "Belum diisi", years: "tahun", cm: "cm", kg: "kg",
    direction: "Arah tujuan", goal: "Tujuan", goalWeight: "Berat tujuan", build: "Bentuk tubuh", activity: "Aktivitas harian", minutes: "menit/hari", goals: { lose: "Turunkan berat", maintain: "Jaga berat", gain: "Tambah berat" }, builds: { lean: "Ramping", soft: "Ramping, perut lebih lembut", stocky: "Badan lebar", muscular: "Berotot" }, activities: { daily: "Gerak sehari-hari", cardio: "Kardio", strength: "Latihan beban", mixed: "Campuran" },
    targets: "Target harianmu", targetHint: "Angka bisa diubah. Kalori dan makro tercapai pada 90–105%; serat dan mineral minimal 90%. Natrium adalah batas atas.", targetRange: "Rentang target", targetMinimum: "Minimum", targetLimit: "Batas atas", history: "Riwayat berat", historyHint: "Tampilan harian per bulan", historyTrend: "Berat harian", firstCheckIn: "Catatan pertama", lastCheckIn: "Terakhir dicatat", sinceLast: "Sejak catatan lalu", checkIns: "catatan", emptyHistory: "Belum ada berat tercatat hingga bulan ini.", goalProgress: "Progres target", toGoal: "menuju target", goalLine: "Berat tujuan", previousMonth: "Bulan sebelumnya", nextMonth: "Bulan berikutnya", carriedWeight: "Berat terakhir tercatat", carryHint: "Hari tanpa catatan memakai berat terakhir yang tercatat.", loadingHistory: "Memuat riwayat berat…", historyError: "Riwayat berat gagal dimuat.", retryHistory: "Coba lagi", privacy: "Profil, berat, dan foto tersimpan di akunmu. Foto tetap privat dan bisa diganti di sini.",
  },
} as const;

export function ProfilePage() {
  const language = useLanguage();
  const text = copy[language];
  const data = useTrackerData();
  const { profile, weights } = data;
  const complete = isProfileComplete(data);
  const latest = weights.at(-1);
  const [editing, setEditing] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const showToast = useToast();
  const today = useTodayKey();
  const currentMonth = today.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const month = selectedMonth ?? currentMonth;
  const [monthData, setMonthData] = useState<{ month: string; entries: WeightEntry[]; previous: WeightEntry | null; error: boolean } | null>(null);
  const [historyRetry, setHistoryRetry] = useState(0);
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";
  const monthLabel = month ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`)) : "";
  const monthlySeries = useMemo(() => month && monthData?.month === month && !monthData.error ? weightMonthSeries(month, monthData.entries, monthData.previous, today) : [], [month, monthData, today]);
  const previous = weights.at(-2);
  const change = latest && previous ? displayWeight(latest.kg - previous.kg, profile.unitSystem) : null;
  const goalKg = profile.goalWeightKg;
  const first = weights.at(0);
  const toGoal = latest && goalKg !== null ? displayWeight(Math.abs(latest.kg - goalKg), profile.unitSystem) : null;
  const progress = latest && goalKg !== null && first && first.kg !== goalKg ? Math.min(100, Math.max(0, ((first.kg - latest.kg) / (first.kg - goalKg)) * 100)) : null;

  useEffect(() => {
    if (!month) return;
    let active = true;
    void loadWeightMonth(month).then(({ entries, previous }) => {
      if (active) setMonthData({ month, entries, previous, error: false });
    }).catch(() => {
      if (active) setMonthData({ month, entries: [], previous: null, error: true });
    });
    return () => { active = false; };
  }, [month, weights, historyRetry]);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      showToast({ en: copy.en.photoError, id: copy.id.photoError }, "error");
      return;
    }
    setPhotoBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      let image: Blob | null;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        const size = Math.min(bitmap.width, bitmap.height);
        context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
        image = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      } finally { bitmap.close(); }
      if (!image) throw new Error(text.photoError);
      await saveAvatar(image);
      showToast({ en: copy.en.photoSaved, id: copy.id.photoSaved }, "success");
    } catch (error) { showToast({ en: errorText(error), id: errorText(error) }, "error"); }
    finally { setPhotoBusy(false); }
  }

  if (editing) return <ProfileSetup profile={profile} weightKg={latest?.kg ?? null} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />;

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[2rem] bg-brand-blue p-6 text-white sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[42px] border-white/10" aria-hidden="true" />
      <p className="relative text-[.68rem] font-extrabold tracking-[.18em] text-brand-lemon">{text.eyebrow}</p>
      <div className="relative mt-6 flex flex-wrap items-center gap-5">
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/80 bg-brand-sky text-4xl font-extrabold text-brand-blue sm:size-28">
          {profile.avatar ? <Image src={profile.avatar} alt={profile.name || text.member} fill unoptimized className="object-cover" /> : (profile.name.slice(0, 1) || "N").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#dbf3ff]">{profile.name ? text.member : text.newMember}</p><h1 className="mt-1 break-words text-3xl font-extrabold tracking-[-.06em] sm:text-5xl">{profile.name || "Nourish"}</h1><p className="mt-2 text-sm text-[#dbf3ff]">{complete ? text.status : text.missing}</p></div>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-3"><button className="btn rounded-xl border-0 bg-brand-sun font-extrabold text-[#143345] hover:bg-brand-lemon" type="button" onClick={() => setEditing(true)}>{complete ? text.edit : text.start} ↗</button><button className="btn btn-outline rounded-xl border-white/60 text-white hover:bg-white/10" type="button" disabled={photoBusy} onClick={() => photoInput.current?.click()}>{photoBusy ? "…" : text.photo}</button><input ref={photoInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={photoBusy} /></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2" aria-label={text.basics}>
      <div className="rounded-[1.5rem] border border-line bg-surface p-6"><h2 className="text-xl font-extrabold">{text.basics}</h2><dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><dt className="text-xs text-muted">{text.age}</dt><dd className="mt-2 text-lg font-extrabold">{profile.age ? `${profile.age} ${text.years}` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.height}</dt><dd className="mt-2 text-lg font-extrabold">{profile.heightCm ? profile.unitSystem === "imperial" ? `${feetAndInches(profile.heightCm)[0]} ${language === "id" ? "kaki" : "ft"} ${feetAndInches(profile.heightCm)[1]} ${language === "id" ? "inci" : "in"}` : `${number.format(displayHeight(profile.heightCm, "metric"))} cm` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.weight}</dt><dd className="mt-2 text-lg font-extrabold">{latest ? `${number.format(displayWeight(latest.kg, profile.unitSystem))} ${weightUnit}` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.bodyFat}</dt><dd className="mt-2 text-lg font-extrabold">{profile.bodyFatPercent !== null ? `${number.format(profile.bodyFatPercent)}%` : "—"}</dd></div></dl></div>
      <div className="rounded-[1.5rem] border border-line bg-surface p-6"><h2 className="text-xl font-extrabold">{text.direction}</h2><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted">{text.goal}</dt><dd className="mt-1 font-bold">{profile.goal ? text.goals[profile.goal] : text.noData}</dd></div><div><dt className="text-muted">{text.goalWeight}</dt><dd className="mt-1 font-bold">{profile.goalWeightKg !== null ? `${number.format(displayWeight(profile.goalWeightKg, profile.unitSystem))} ${weightUnit}` : text.noData}</dd></div><div><dt className="text-muted">{text.build}</dt><dd className="mt-1 font-bold">{profile.build ? text.builds[profile.build] : text.noData}</dd></div><div><dt className="text-muted">{text.activity}</dt><dd className="mt-1 font-bold">{profile.activityType ? `${text.activities[profile.activityType]} · ${profile.activityMinutes ?? 0} ${text.minutes}` : text.noData}</dd></div></dl></div>
    </section>

    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold">{text.targets}</h2><p className="mt-1 text-sm text-muted">{text.targetHint}</p></div><button className="btn btn-ghost btn-sm rounded-xl text-primary" type="button" onClick={() => setEditing(true)}>{text.edit}</button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{NUTRIENTS.map((key) => { const target = profile.targets?.[key]; const isLimit = key === "sodium"; const isRange = MACRO_NUTRIENTS.includes(key); const rule = target === undefined ? "—" : isLimit ? `≤ ${number.format(target)}` : isRange ? `${number.format(target * GOAL_LOWER_RATIO)}–${number.format(target * GOAL_UPPER_RATIO)}` : `≥ ${number.format(target * GOAL_LOWER_RATIO)}`; return <div key={key} className={`rounded-xl border p-4 ${isLimit ? "border-success/35 bg-[var(--tone-limit-bg)]" : isRange ? "border-primary/30 bg-[var(--tone-macro-bg)]" : "border-accent/40 bg-[var(--tone-micro-bg)]"}`}><p className="text-xs text-muted">{nutrientLabels[language][key]}</p><p className="mt-2 text-lg font-extrabold">{target === undefined ? "—" : number.format(target)} <span className="text-xs font-normal text-muted">{target === undefined ? "" : nutrientUnits[key]}</span></p><p className="mt-1 text-xs text-muted">{isLimit ? text.targetLimit : isRange ? text.targetRange : text.targetMinimum}: {rule} {target === undefined ? "" : nutrientUnits[key]}</p></div>; })}</div></section>

    <section className="grid items-stretch gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="grid content-start gap-4 rounded-[1.5rem] bg-brand-blue p-6 text-white">
        <div>
          <p className="text-xs font-extrabold tracking-[.14em] text-brand-lemon">{text.weight}</p>
          <p className="mt-2 text-5xl font-extrabold leading-none">{latest ? <>{number.format(displayWeight(latest.kg, profile.unitSystem))} {weightUnit}</> : "—"}</p>
          <p className="mt-2 text-sm font-bold text-[#dbf3ff]">{text.lastCheckIn}: {latest ? <time dateTime={latest.date}>{formatWeightDate(latest.date, language)}</time> : "—"}</p>
          <div className="mt-4"><WeightCheckIn className="btn rounded-xl border-0 bg-brand-sun font-extrabold text-[#143345] hover:bg-brand-lemon" /></div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 p-3.5"><dt className="text-xs font-bold text-[#dbf3ff]">{text.sinceLast}</dt><dd className="mt-1 break-words text-base font-extrabold">{change !== null ? `${change > 0 ? "+" : change < 0 ? "−" : ""}${number.format(Math.abs(change))} ${weightUnit}` : latest ? text.firstCheckIn : "—"}</dd></div>
          <div className="min-w-0 rounded-xl border border-white/15 bg-white/10 p-3.5"><dt className="text-xs font-bold text-[#dbf3ff]">{text.goalWeight}</dt><dd className="mt-1 break-words text-base font-extrabold">{goalKg !== null ? `${number.format(displayWeight(goalKg, profile.unitSystem))} ${weightUnit}` : text.noData}</dd></div>
        </dl>
        {goalKg !== null && latest && <div className="rounded-xl border border-white/15 bg-white/10 p-4"><div className="flex items-center justify-between text-xs font-bold text-[#dbf3ff]"><span>{text.goalProgress}</span><span>{Math.round(progress ?? 0)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-brand-sun" style={{ width: `${progress ?? 0}%` }} /></div><p className="mt-2 text-sm font-extrabold">{number.format(toGoal ?? 0)} {weightUnit} {text.toGoal}</p></div>}
      </div>
      <div className="flex min-w-0 flex-col rounded-[1.5rem] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-extrabold">{text.history}</h2><p className="mt-1 text-sm text-muted">{text.historyHint}</p></div>
          <nav className="flex items-center gap-1" aria-label={text.history}>
            <button className="btn btn-ghost btn-sm size-9 rounded-full text-xl text-primary" type="button" aria-label={text.previousMonth} title={text.previousMonth} disabled={!monthData || monthData.month !== month || !monthData.previous} onClick={() => setSelectedMonth(shiftWeightMonth(month, -1))}>‹</button>
            <span className="min-w-28 text-center text-sm font-bold capitalize">{monthLabel}</span>
            <button className="btn btn-ghost btn-sm size-9 rounded-full text-xl text-primary" type="button" aria-label={text.nextMonth} title={text.nextMonth} disabled={!currentMonth || month >= currentMonth} onClick={() => setSelectedMonth(shiftWeightMonth(month, 1))}>›</button>
          </nav>
        </div>
        {monthData?.month !== month ? <div className="grid min-h-64 flex-1 place-items-center text-sm text-muted lg:min-h-0" role="status">{text.loadingHistory}</div>
          : monthData.error ? <div className="grid min-h-64 flex-1 place-content-center justify-items-center gap-3 text-sm text-muted lg:min-h-0"><p role="alert">{text.historyError}</p><button className="btn btn-outline btn-sm rounded-xl" type="button" onClick={() => { setMonthData(null); setHistoryRetry((value) => value + 1); }}>{text.retryHistory}</button></div>
            : monthlySeries.some((day) => day.kg !== null) ? <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-base-200/50 p-4">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted"><span>{text.historyTrend}</span><span>{monthData.entries.length} {text.checkIns}</span></div>
              <WeightHistoryChart series={monthlySeries} language={language} unitSystem={profile.unitSystem} label={text.historyTrend} carriedLabel={text.carriedWeight} goalKg={goalKg} />
              {goalKg !== null && <p className="mt-2 flex items-center gap-2 text-xs text-muted"><span className="h-0 w-6 border-t-2 border-dashed border-muted" />{text.goalLine}</p>}
              <p className="mt-2 text-xs text-muted">{text.carryHint}</p>
            </div> : <div className="grid min-h-64 flex-1 place-items-center text-center text-sm text-muted lg:min-h-0">{text.emptyHistory}</div>}
      </div>
    </section>
    <p className="text-xs text-muted">{text.privacy}</p>
  </div>;
}
