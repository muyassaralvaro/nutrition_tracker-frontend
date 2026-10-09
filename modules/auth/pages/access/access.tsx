"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Brand } from "@/shared/components/brand/Brand";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { api, API_ORIGIN } from "@/shared/api-client";
import { styles } from "./access.styles";

const copy = {
  en: {
    brandLabel: "Nourish home", about: "About Nourish", promoEyebrow: "A FRESH TAKE ON FEELING GOOD",
    promoTitle: "Good habits grow", promoAccent: "one day at a time.", promoDescription: "Know your meals. Move your way. See the progress that matters to you.",
    balance: "TODAY'S BALANCE", dailyGoal: "of daily goal", onTrack: "Feeling on track", everyStep: "Every step counts", promoFooter: "NOURISH YOUR EVERYDAY",
    welcome: "WELCOME TO NOURISH", title: "Welcome", accent: "in.", description: "Track meals, check your nutrition, and see your progress. Sign in or create an account with Google.",
    google: "Continue with Google", agreement: "I have read and agree to the", and: "and", terms: "Terms of Service", privacy: "Privacy Policy",
    consentRequired: "Agree to the Terms of Service and Privacy Policy to continue.", googlePending: "Google sign-in is unavailable right now.",
    serverUnavailable: "Could not reach Nourish server. Refresh to try again.", oauthFailed: "Google sign-in failed. Try again.",
    signupLimited: "Too many new accounts from this network. Try again tomorrow or contact support@nourish.my.id.",
    accountExists: "This email belongs to an older account. Contact support@nourish.my.id to link Google safely.",
  },
  id: {
    brandLabel: "Beranda Nourish", about: "Tentang Nourish", promoEyebrow: "CARA BARU UNTUK MERASA LEBIH BAIK",
    promoTitle: "Bangun kebiasaan", promoAccent: "baik tiap hari.", promoDescription: "Kenali makananmu, bergerak dengan caramu, dan lihat kemajuannya.",
    balance: "KESEIMBANGAN HARI INI", dailyGoal: "dari target harian", onTrack: "Tetap sesuai jalur", everyStep: "Setiap langkah berarti", promoFooter: "RAWAT DIRIMU SETIAP HARI",
    welcome: "SELAMAT DATANG DI NOURISH", title: "Selamat", accent: "datang.", description: "Catat makanan, periksa gizi, dan lihat kemajuanmu. Masuk atau buat akun lewat Google.",
    google: "Lanjut dengan Google", agreement: "Saya telah membaca dan menyetujui", and: "dan", terms: "Syarat Layanan", privacy: "Kebijakan Privasi",
    consentRequired: "Setujui Syarat Layanan dan Kebijakan Privasi untuk melanjutkan.", googlePending: "Login Google belum tersedia saat ini.",
    serverUnavailable: "Server Nourish tidak dapat dihubungi. Muat ulang untuk mencoba lagi.", oauthFailed: "Login Google gagal. Coba lagi.",
    signupLimited: "Terlalu banyak akun baru dari jaringan ini. Coba lagi besok atau hubungi support@nourish.my.id.",
    accountExists: "Email ini milik akun lama. Hubungi support@nourish.my.id untuk menautkan Google dengan aman.",
  },
} as const;

function GoogleMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.2 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.9 24.5c0-1.6-.2-3.1-.4-4.5H24v9h12.9a11 11 0 0 1-4.8 7.2l7.7 6C44.3 38 46.9 31.9 46.9 24.5Z" />
    <path fill="#FBBC05" d="M10.5 28.6A14.4 14.4 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-8-6.2A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8-6.2Z" />
    <path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.7-6A14.4 14.4 0 0 1 24 38.5c-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48Z" />
  </svg>;
}

export function AccessPage() {
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const reducedMotion = useReducedMotion();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalError, setLegalError] = useState(false);

  useEffect(() => {
    api<{ data: { google_enabled: boolean } }>("/api/v1/auth/options")
      .then(({ data }) => setGoogleEnabled(data.google_enabled))
      .catch(() => setOptionsError(true));
    const oauth = new URLSearchParams(window.location.search).get("oauth");
    if (oauth) {
      const message = oauth === "consent_required" ? "consentRequired" : oauth === "signup_limited" ? "signupLimited" : oauth === "account_exists" ? "accountExists" : "oauthFailed";
      showToast({ en: copy.en[message], id: copy.id[message] }, "error");
    }
  }, [showToast]);

  function checkConsent(event: MouseEvent<HTMLAnchorElement>) {
    if (!googleEnabled) {
      event.preventDefault();
      showToast({ en: copy.en.googlePending, id: copy.id.googlePending }, "error");
      return;
    }
    if (!acceptedTerms) {
      event.preventDefault();
      setLegalError(true);
      showToast({ en: copy.en.consentRequired, id: copy.id.consentRequired }, "error");
      document.getElementById("legal-consent")?.focus();
    }
  }

  return <main className={`${styles.shell} h-dvh !min-h-0`}>
    <aside className={`${styles.promo} h-dvh !min-h-0`} aria-label={text.about}>
      <span className={styles.promoOrbitTop} aria-hidden="true" /><span className={styles.promoOrbitBottom} aria-hidden="true" />
      <Brand href="/login" ariaLabel={text.brandLabel} />
      <motion.div className={`${styles.promoContent} ${styles.loginPromoContent}`} initial={reducedMotion ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.4 }}>
        <span className={styles.promoEyebrow}>{text.promoEyebrow}</span>
        <h2 className={`${styles.promoTitle} ${styles.loginPromoTitle}`}>{text.promoTitle} <span className="text-brand-lemon">{text.promoAccent}</span></h2>
        <p className={styles.promoDescription}>{text.promoDescription}</p>
        <div className={styles.promoGraphic} aria-hidden="true"><div className={styles.promoCard}><span className={styles.promoCardLabel}>{text.balance}</span><div className={styles.promoRing}><span className={styles.promoRingCenter}>72%<small className={styles.promoRingCaption}>{text.dailyGoal}</small></span></div><div className={styles.promoCardBottom}><span>{text.onTrack}</span><strong className="text-[1.3rem] text-[#006199]">✦</strong></div></div><div className={styles.promoFloat}>{text.everyStep} <span className="text-[1.4rem] leading-[.7]">↗</span></div></div>
      </motion.div>
      <span className={styles.promoFooter}>{text.promoFooter}</span>
    </aside>
    <div className={`${styles.formSide} h-dvh min-h-0`}>
      <header className={`${styles.formHeader} ${styles.loginFormHeader}`}><div className={styles.mobileBrand}><Brand href="/login" ariaLabel={text.brandLabel} /></div><div className="flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div></header>
      <motion.section className={`${styles.formContent} ${styles.loginFormContent}`} aria-labelledby="access-title" initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.38 }}>
        <p className={`${styles.eyebrow} ${styles.loginEyebrow}`}>{text.welcome}</p>
        <h1 className={`${styles.title} ${styles.loginTitle}`} id="access-title">{text.title} <span className="text-primary">{text.accent}</span></h1>
        <p className={`${styles.description} ${styles.loginDescription}`}>{text.description}</p>
        <div className={`mb-5 flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm leading-6 shadow-sm ${legalError ? "border-error ring-2 ring-error/25" : "border-line"}`}>
          <input className="checkbox checkbox-primary mt-1 shrink-0" id="legal-consent" type="checkbox" checked={acceptedTerms} aria-invalid={legalError} aria-describedby="legal-consent-text" onChange={(event) => { setAcceptedTerms(event.target.checked); setLegalError(false); }} />
          <p id="legal-consent-text" className="text-muted"><label className="cursor-pointer" htmlFor="legal-consent">{text.agreement}</label> <Link className={styles.switchLink} href="/terms" target="_blank" rel="noopener noreferrer">{text.terms}</Link> {text.and} <Link className={styles.switchLink} href="/privacy" target="_blank" rel="noopener noreferrer">{text.privacy}</Link>.</p>
        </div>
        {optionsError && <p role="alert" className="mb-3 text-center text-sm text-error">{text.serverUnavailable}</p>}
        <a className={`${styles.googleButton} ${styles.loginGoogle} ${!googleEnabled ? "opacity-50" : ""}`} href={`${API_ORIGIN}/api/v1/auth/google/redirect?consent=1`} onClick={checkConsent} aria-disabled={!googleEnabled} title={!googleEnabled && !optionsError ? text.googlePending : undefined}>
          <span className="mr-2 size-5"><GoogleMark /></span> {text.google}
        </a>
        {!googleEnabled && !optionsError && <p className="mt-2 text-center text-xs text-muted">{text.googlePending}</p>}
      </motion.section>
    </div>
  </main>;
}
