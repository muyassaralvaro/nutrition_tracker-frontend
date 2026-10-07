"use client";

import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { useLanguage } from "@/shared/language";
import { clearTrackerData } from "../../tracker-data";

const copy = {
  en: {
    eyebrow: "YOUR SPACE", title: "Settings", intro: "Small choices that make Nourish feel like yours.",
    preferences: "Preferences", language: "Language", languageHint: "Switch between English and Indonesian.", theme: "Appearance", themeHint: "Choose light or dark mode.",
    account: "Account", password: "Reset password", passwordHint: "Available after account sign-in is connected.", contact: "Contact", contactHint: "Support contact will be added before launch.", remove: "Remove account", removeHint: "Account removal will be available when accounts exist.",
    about: "About Nourish", aboutBody: "Nourish is a nutrition tracker in progress. This preview lets you set targets and log weight and meals manually. Photo analysis, accounts, and support are still being built.",
    preview: "Preview data", previewHint: "Clear profile, weight, and meal entries stored in this browser tab.", clear: "Clear preview data", confirm: "Clear profile, weight, and meal entries from this tab? This cannot be undone.", cleared: "Preview data cleared.",
    logout: "Log out", logoutHint: "Leave preview and clear data from this tab.", loggedOut: "Preview ended. Local profile, weight, and meal data were cleared.",
    passwordPending: "Password reset needs account sign-in, which is not connected yet.", contactPending: "Support contact is not available in this preview yet.", removePending: "No account was created in preview, so there is no account to remove.",
  },
  id: {
    eyebrow: "RUANGMU", title: "Pengaturan", intro: "Pilihan kecil agar Nourish terasa lebih sesuai untukmu.",
    preferences: "Preferensi", language: "Bahasa", languageHint: "Ganti antara bahasa Indonesia dan Inggris.", theme: "Tampilan", themeHint: "Pilih mode terang atau gelap.",
    account: "Akun", password: "Atur ulang kata sandi", passwordHint: "Tersedia setelah login akun terhubung.", contact: "Kontak", contactHint: "Kontak bantuan akan tersedia sebelum peluncuran.", remove: "Hapus akun", removeHint: "Penghapusan akun tersedia saat fitur akun ada.",
    about: "Tentang Nourish", aboutBody: "Nourish adalah pelacak gizi yang sedang dibuat. Pratinjau ini memungkinkanmu menentukan target serta mencatat berat dan makanan secara manual. Analisis foto, akun, dan bantuan masih dikembangkan.",
    preview: "Data pratinjau", previewHint: "Hapus profil, berat, dan makanan yang tersimpan di tab browser ini.", clear: "Hapus data pratinjau", confirm: "Hapus profil, berat, dan makanan dari tab ini? Tindakan ini tidak bisa dibatalkan.", cleared: "Data pratinjau dihapus.",
    logout: "Keluar", logoutHint: "Tinggalkan pratinjau dan hapus data dari tab ini.", loggedOut: "Pratinjau berakhir. Data profil, berat, dan makanan di tab ini dihapus.",
    passwordPending: "Atur ulang kata sandi perlu login akun yang belum terhubung.", contactPending: "Kontak bantuan belum tersedia dalam pratinjau ini.", removePending: "Belum ada akun yang dibuat dalam pratinjau, jadi tidak ada akun untuk dihapus.",
  },
} as const;

export function SettingsPage() {
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const router = useRouter();

  function pending(key: "passwordPending" | "contactPending" | "removePending") {
    showToast({ en: copy.en[key], id: copy.id[key] });
  }

  function clearData() {
    if (!window.confirm(text.confirm)) return;
    clearTrackerData();
    showToast({ en: copy.en.cleared, id: copy.id.cleared }, "success");
  }

  function logout() {
    clearTrackerData();
    showToast({ en: copy.en.loggedOut, id: copy.id.loggedOut });
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4rem)] leading-tight font-extrabold tracking-[-.07em]">{text.title}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div>
      <section className="overflow-hidden rounded-[1.5rem] border border-line bg-surface" aria-labelledby="preferences-title"><h2 id="preferences-title" className="px-6 pt-6 text-xl font-extrabold sm:px-8">{text.preferences}</h2><div className="divide-y divide-line px-6 pb-3 sm:px-8"><div className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-bold">{text.language}</h3><p className="mt-1 text-sm text-muted">{text.languageHint}</p></div><LanguageToggle /></div><div className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-bold">{text.theme}</h3><p className="mt-1 text-sm text-muted">{text.themeHint}</p></div><ThemeToggle /></div></div></section>
      <section className="overflow-hidden rounded-[1.5rem] border border-line bg-surface" aria-labelledby="account-title"><h2 id="account-title" className="px-6 pt-6 text-xl font-extrabold sm:px-8">{text.account}</h2><div className="divide-y divide-line px-6 pb-3 sm:px-8"><div className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-bold">{text.password}</h3><p className="mt-1 text-sm text-muted">{text.passwordHint}</p></div><button className="btn btn-ghost btn-square shrink-0 rounded-xl text-primary" type="button" onClick={() => pending("passwordPending")} aria-label={text.password}>↗</button></div><div className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-bold">{text.contact}</h3><p className="mt-1 text-sm text-muted">{text.contactHint}</p></div><button className="btn btn-ghost btn-square shrink-0 rounded-xl text-primary" type="button" onClick={() => pending("contactPending")} aria-label={text.contact}>↗</button></div><div className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-bold">{text.remove}</h3><p className="mt-1 text-sm text-muted">{text.removeHint}</p></div><button className="btn btn-ghost btn-square shrink-0 rounded-xl text-error" type="button" onClick={() => pending("removePending")} aria-label={text.remove}>↗</button></div></div></section>
      <details className="group rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><summary className="flex cursor-pointer list-none items-center justify-between text-xl font-extrabold marker:hidden">{text.about}<span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{text.aboutBody}</p></details>
      <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8" aria-labelledby="preview-title"><h2 id="preview-title" className="text-xl font-extrabold">{text.preview}</h2><p className="mt-2 text-sm text-muted">{text.previewHint}</p><button className="btn btn-outline mt-5 rounded-xl border-error/40 text-error hover:border-error hover:bg-error/10" type="button" onClick={clearData}>{text.clear}</button></section>
      <button className="btn btn-primary w-full rounded-xl font-extrabold sm:w-auto" type="button" onClick={logout}>{text.logout}</button><p className="-mt-3 text-xs text-muted">{text.logoutHint}</p>
    </div>
  );
}
