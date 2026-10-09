"use client";

import { useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/shared/api-client";
import { highlightInvalid } from "@/shared/form-validation";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { useLanguage } from "@/shared/language";
import { clearTrackerData } from "../../tracker-data";

const copy = {
  en: {
    eyebrow: "YOUR SPACE", title: "Settings", intro: "Small choices that make Nourish feel like yours.", preferences: "Preferences",
    language: "Language", languageHint: "Switch between English and Indonesian.", theme: "Appearance", themeHint: "Choose light or dark mode.",
    account: "Account",
    contact: "Contact", contactHint: "support@nourish.my.id",
    remove: "Delete account", removeHint: "Permanently delete your profile, meals, photos, and weight history.", removeConfirm: "Delete your account and all nutrition data permanently? This cannot be undone.",
    deleteWord: "Type DELETE to confirm", deleteInvalid: "Type DELETE to confirm account deletion.", deleted: "Account deleted.",
    about: "About Nourish", aboutBody: "Nourish tracks meals, weight, and editable nutrition targets. Photo analysis needs a configured provider and a running queue worker.",
    logout: "Log out", loggedOut: "Signed out.", cancel: "Cancel", confirmDelete: "Delete my account", terms: "Terms of Service", privacy: "Privacy Policy",
  },
  id: {
    eyebrow: "RUANGMU", title: "Pengaturan", intro: "Pilihan kecil agar Nourish terasa lebih sesuai untukmu.", preferences: "Preferensi",
    language: "Bahasa", languageHint: "Ganti antara bahasa Indonesia dan Inggris.", theme: "Tampilan", themeHint: "Pilih mode terang atau gelap.",
    account: "Akun",
    contact: "Kontak", contactHint: "support@nourish.my.id",
    remove: "Hapus akun", removeHint: "Hapus permanen profil, makanan, foto, dan riwayat beratmu.", removeConfirm: "Hapus akun dan semua data gizi secara permanen? Tindakan ini tidak bisa dibatalkan.",
    deleteWord: "Ketik DELETE untuk konfirmasi", deleteInvalid: "Ketik DELETE untuk menghapus akun.", deleted: "Akun dihapus.",
    about: "Tentang Nourish", aboutBody: "Nourish mencatat makanan, berat, dan target gizi yang bisa diubah. Analisis foto perlu penyedia yang dikonfigurasi dan worker antrean yang berjalan.",
    logout: "Keluar", loggedOut: "Berhasil keluar.", cancel: "Batal", confirmDelete: "Hapus akun saya", terms: "Syarat Layanan", privacy: "Kebijakan Privasi",
  },
} as const;

const inputClass = "input w-full max-w-none rounded-xl border border-line bg-base-200 text-ink shadow-sm focus:border-primary focus:shadow-md";

export function SettingsPage() {
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const router = useRouter();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try { await api("/api/v1/auth/logout", { method: "POST" }); clearTrackerData(); showToast({ en: copy.en.loggedOut, id: copy.id.loggedOut }, "success"); router.replace("/login"); }
    catch (error) { showToast({ en: errorText(error), id: errorText(error) }, "error"); }
    finally { setBusy(false); }
  }
  async function deleteAccount(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("confirm") !== "DELETE") {
      const field = form.elements.namedItem("confirm") as HTMLInputElement;
      field.setCustomValidity(text.deleteInvalid);
      highlightInvalid(form, () => showToast({ en: copy.en.deleteInvalid, id: copy.id.deleteInvalid }, "error"));
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/me", { method: "DELETE" });
      clearTrackerData(); deleteDialog.current?.close(); showToast({ en: copy.en.deleted, id: copy.id.deleted }, "success"); router.replace("/login");
    } catch (error) {
      highlightInvalid(form, () => {});
      showToast({ en: errorText(error), id: errorText(error) }, "error");
    } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4rem)] leading-tight font-extrabold tracking-[-.07em]">{text.title}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div>
    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><h2 className="text-xl font-extrabold">{text.preferences}</h2><div className="mt-4 divide-y divide-line"><div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-bold">{text.language}</h3><p className="mt-1 text-sm text-muted">{text.languageHint}</p></div><LanguageToggle /></div><div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-bold">{text.theme}</h3><p className="mt-1 text-sm text-muted">{text.themeHint}</p></div><ThemeToggle /></div></div></section>
    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><h2 className="text-xl font-extrabold">{text.account}</h2><div className="mt-4 divide-y divide-line"><div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-bold">{text.contact}</h3><p className="mt-1 text-sm text-muted">{text.contactHint}</p></div><a className="btn btn-ghost btn-square rounded-xl text-primary" href="mailto:support@nourish.my.id" aria-label={text.contact}>↗</a></div><div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-bold">{text.remove}</h3><p className="mt-1 text-sm text-muted">{text.removeHint}</p></div><button className="btn btn-ghost btn-square rounded-xl text-error" type="button" onClick={() => deleteDialog.current?.showModal()} aria-label={text.remove}>↗</button></div></div></section>
    <details className="group rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8"><summary className="flex cursor-pointer list-none items-center justify-between text-xl font-extrabold marker:hidden">{text.about}<span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{text.aboutBody}</p></details>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-primary"><Link className="underline underline-offset-4" href="/terms">{text.terms}</Link><Link className="underline underline-offset-4" href="/privacy">{text.privacy}</Link></div>
    <button className="btn btn-primary rounded-xl px-6 font-extrabold" type="button" disabled={busy} onClick={logout}>{text.logout}</button>

    <dialog ref={deleteDialog} className="modal z-50"><div className="modal-box rounded-[1.6rem] border border-line bg-surface text-ink"><h2 className="text-2xl font-extrabold text-error">{text.remove}</h2><p className="mt-3 text-sm leading-6 text-muted">{text.removeConfirm}</p><form className="mt-5 grid gap-4" onSubmit={deleteAccount} onInvalid={(event) => highlightInvalid(event.currentTarget, () => {})}><label className="grid gap-2 text-sm font-bold">{text.deleteWord}<input className={inputClass} name="confirm" type="text" autoComplete="off" onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label><div className="mt-2 flex justify-end gap-2"><button className="btn btn-ghost rounded-xl" type="button" onClick={() => deleteDialog.current?.close()}>{text.cancel}</button><button className="btn btn-error rounded-xl" type="submit" disabled={busy}>{text.confirmDelete}</button></div></form></div></dialog>
  </div>;
}
