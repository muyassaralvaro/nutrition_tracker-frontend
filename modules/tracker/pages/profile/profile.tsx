"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayHeight, displayWeight, feetAndInches, NUTRIENTS } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isProfileComplete, saveAvatar, useTrackerData } from "../../tracker-data";
import { ProfileSetup } from "./ProfileSetup";

const copy = {
  en: {
    eyebrow: "YOUR PROFILE", member: "Your Nourish space", newMember: "Your space starts here", status: "Personal plan", missing: "Finish setup to see your plan", start: "Build my plan", edit: "Edit plan", photo: "Change profile photo", photoError: "Choose a JPG, PNG, or WebP photo under 3 MB.",
    basics: "Your details", age: "Age", height: "Height", weight: "Current weight", bodyFat: "Body fat", noData: "Not set", years: "years", cm: "cm", kg: "kg",
    direction: "Your direction", goal: "Goal", goalWeight: "Goal weight", build: "Body shape", activity: "Daily activity", minutes: "min/day", goals: { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" }, builds: { lean: "Lean", soft: "Lean, softer middle", stocky: "Broad build", muscular: "Muscular" }, activities: { daily: "Everyday movement", cardio: "Cardio", strength: "Strength", mixed: "Mixed" },
    targets: "Your daily targets", targetHint: "Editable starting values. Sodium is a limit; other values are targets.", history: "Weight history", historyHint: "Your latest check-ins", emptyHistory: "No weight check-ins yet.", privacy: "Preview data stays in this browser tab and clears on log out.",
  },
  id: {
    eyebrow: "PROFILMU", member: "Ruang Nourish milikmu", newMember: "Ruangmu dimulai di sini", status: "Rencana pribadi", missing: "Lengkapi profil untuk melihat rencana", start: "Buat rencana", edit: "Ubah rencana", photo: "Ganti foto profil", photoError: "Pilih foto JPG, PNG, atau WebP di bawah 3 MB.",
    basics: "Data dirimu", age: "Usia", height: "Tinggi", weight: "Berat saat ini", bodyFat: "Lemak tubuh", noData: "Belum diisi", years: "tahun", cm: "cm", kg: "kg",
    direction: "Arah tujuan", goal: "Tujuan", goalWeight: "Berat tujuan", build: "Bentuk tubuh", activity: "Aktivitas harian", minutes: "menit/hari", goals: { lose: "Turunkan berat", maintain: "Jaga berat", gain: "Tambah berat" }, builds: { lean: "Ramping", soft: "Ramping, perut lebih lembut", stocky: "Badan lebar", muscular: "Berotot" }, activities: { daily: "Gerak sehari-hari", cardio: "Kardio", strength: "Latihan beban", mixed: "Campuran" },
    targets: "Target harianmu", targetHint: "Angka awal yang bisa diubah. Natrium adalah batas; nilai lain adalah target.", history: "Riwayat berat", historyHint: "Catatan terbarumu", emptyHistory: "Belum ada catatan berat.", privacy: "Data pratinjau tersimpan di tab ini dan terhapus saat keluar.",
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
  const photoInput = useRef<HTMLInputElement>(null);
  const showToast = useToast();
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      showToast({ en: copy.en.photoError, id: copy.id.photoError }, "error");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = 160; canvas.height = 160;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const size = Math.min(bitmap.width, bitmap.height);
      context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 160, 160);
      bitmap.close();
      saveAvatar(canvas.toDataURL("image/jpeg", 0.8));
    } catch {
      showToast({ en: copy.en.photoError, id: copy.id.photoError }, "error");
    }
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
      <div className="relative mt-6 flex flex-wrap gap-3"><button className="btn rounded-xl border-0 bg-brand-sun font-extrabold text-[#143345] hover:bg-brand-lemon" type="button" onClick={() => setEditing(true)}>{complete ? text.edit : text.start} ↗</button><button className="btn btn-outline rounded-xl border-white/60 text-white hover:bg-white/10" type="button" onClick={() => photoInput.current?.click()}>{text.photo}</button><input ref={photoInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2" aria-label={text.basics}>
      <div className="rounded-[1.5rem] border border-line bg-surface p-6"><h2 className="text-xl font-extrabold">{text.basics}</h2><dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><dt className="text-xs text-muted">{text.age}</dt><dd className="mt-2 text-lg font-extrabold">{profile.age ? `${profile.age} ${text.years}` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.height}</dt><dd className="mt-2 text-lg font-extrabold">{profile.heightCm ? profile.unitSystem === "imperial" ? `${feetAndInches(profile.heightCm)[0]} ${language === "id" ? "kaki" : "ft"} ${feetAndInches(profile.heightCm)[1]} ${language === "id" ? "inci" : "in"}` : `${number.format(displayHeight(profile.heightCm, "metric"))} cm` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.weight}</dt><dd className="mt-2 text-lg font-extrabold">{latest ? `${number.format(displayWeight(latest.kg, profile.unitSystem))} ${weightUnit}` : "—"}</dd></div><div><dt className="text-xs text-muted">{text.bodyFat}</dt><dd className="mt-2 text-lg font-extrabold">{profile.bodyFatPercent !== null ? `${number.format(profile.bodyFatPercent)}%` : "—"}</dd></div></dl></div>
      <div className="rounded-[1.5rem] border border-line bg-surface p-6"><h2 className="text-xl font-extrabold">{text.direction}</h2><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted">{text.goal}</dt><dd className="mt-1 font-bold">{profile.goal ? text.goals[profile.goal] : text.noData}</dd></div><div><dt className="text-muted">{text.goalWeight}</dt><dd className="mt-1 font-bold">{profile.goalWeightKg !== null ? `${number.format(displayWeight(profile.goalWeightKg, profile.unitSystem))} ${weightUnit}` : text.noData}</dd></div><div><dt className="text-muted">{text.build}</dt><dd className="mt-1 font-bold">{profile.build ? text.builds[profile.build] : text.noData}</dd></div><div><dt className="text-muted">{text.activity}</dt><dd className="mt-1 font-bold">{profile.activityType ? `${text.activities[profile.activityType]} · ${profile.activityMinutes ?? 0} ${text.minutes}` : text.noData}</dd></div></dl></div>
    </section>

    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold">{text.targets}</h2><p className="mt-1 text-sm text-muted">{text.targetHint}</p></div><button className="btn btn-ghost btn-sm rounded-xl text-primary" type="button" onClick={() => setEditing(true)}>{text.edit}</button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{NUTRIENTS.map((key) => <div key={key} className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{nutrientLabels[language][key]}</p><p className="mt-2 text-lg font-extrabold">{profile.targets ? number.format(profile.targets[key]) : "—"} <span className="text-xs font-normal text-muted">{profile.targets ? nutrientUnits[key] : ""}</span></p></div>)}</div></section>

    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[1.5rem] bg-brand-lemon/45 p-6"><p className="text-xs font-extrabold tracking-[.14em]">{text.weight}</p><p className="mt-4 text-3xl font-extrabold">{latest ? `${number.format(displayWeight(latest.kg, profile.unitSystem))} ${weightUnit}` : "—"}</p><div className="mt-5"><WeightCheckIn /></div></div><div className="rounded-[1.5rem] border border-line bg-surface p-6"><h2 className="text-xl font-extrabold">{text.history}</h2><p className="mt-1 text-sm text-muted">{text.historyHint}</p>{weights.length ? <ol className="mt-4 divide-y divide-line">{[...weights].reverse().slice(0, 5).map((entry) => <li key={entry.date} className="flex justify-between py-3 text-sm"><span className="text-muted">{entry.date}</span><strong>{number.format(displayWeight(entry.kg, profile.unitSystem))} {weightUnit}</strong></li>)}</ol> : <p className="mt-5 text-sm text-muted">{text.emptyHistory}</p>}</div></section>
    <p className="text-xs text-muted">{text.privacy}</p>
  </div>;
}
