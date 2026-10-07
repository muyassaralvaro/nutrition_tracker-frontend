"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Brand } from "@/shared/components/brand/Brand";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useLanguage } from "@/shared/language";
import { normalizeNationalPhone } from "./phone-number";
import { styles } from "./access.styles";

type AccessMode = "login" | "register";

const COUNTRY_CODES = [
  { name: "Indonesia", nameId: "Indonesia", label: "ID +62", code: "+62" },
  { name: "Malaysia", nameId: "Malaysia", label: "MY +60", code: "+60" },
  { name: "Singapore", nameId: "Singapura", label: "SG +65", code: "+65" },
  { name: "Philippines", nameId: "Filipina", label: "PH +63", code: "+63" },
  { name: "Thailand", nameId: "Thailand", label: "TH +66", code: "+66" },
  { name: "Vietnam", nameId: "Vietnam", label: "VN +84", code: "+84" },
  { name: "India", nameId: "India", label: "IN +91", code: "+91" },
  { name: "Australia", nameId: "Australia", label: "AU +61", code: "+61" },
  { name: "Japan", nameId: "Jepang", label: "JP +81", code: "+81" },
  { name: "South Korea", nameId: "Korea Selatan", label: "KR +82", code: "+82" },
  { name: "United Kingdom", nameId: "Britania Raya", label: "UK +44", code: "+44" },
  { name: "United States or Canada", nameId: "Amerika Serikat atau Kanada", label: "US +1", code: "+1" },
] as const;

const copy = {
  en: {
    brandLabel: "Nourish home", about: "About Nourish", promoEyebrow: "A FRESH TAKE ON FEELING GOOD",
    promoTitle: "Good habits grow", promoAccent: "one day at a time.", promoDescription: "Know your meals. Move your way. See the progress that matters to you.",
    balance: "TODAY'S BALANCE", dailyGoal: "of daily goal", onTrack: "Feeling on track", everyStep: "Every step counts", promoFooter: "NOURISH YOUR EVERYDAY",
    join: "JOIN NOURISH", welcome: "WELCOME BACK", registerTitle: "Let's get", registerAccent: "started.", loginTitle: "Welcome", loginAccent: "back.",
    registerDescription: "Create your space for meals, movement, and goals that feel like yours.", loginDescription: "A little progress is still progress. Let’s pick up where you left off.",
    google: "Continue with Google", phoneDivider: "or continue with phone", fullName: "Full name", namePlaceholder: "Your name", phone: "Phone number",
    callingCode: "Country calling code", other: "Other", customCode: "Custom country calling code", phoneHint: "Leading 0 becomes", codeFallback: "your code",
    password: "Password", passwordPlaceholder: "At least 8 characters", confirmPassword: "Confirm password", confirmPlaceholder: "Repeat your password",
    createAccount: "Create account", signIn: "Sign in", haveAccount: "Already have an account?", newHere: "New to Nourish?", createLink: "Create an account",
    formFooter: "A calmer way to care for yourself.",
    invalidCode: "Enter a country calling code with 1 to 3 digits.", invalidPhone: "Enter a valid phone number with 8 to 15 digits, including country code.",
    passwordsMismatch: "Passwords do not match.", authPending: "Account access is coming next. Your details were not sent or saved.",
    googlePending: "Google sign-in is coming next. No account was created.",
  },
  id: {
    brandLabel: "Beranda Nourish", about: "Tentang Nourish", promoEyebrow: "CARA BARU UNTUK MERASA LEBIH BAIK",
    promoTitle: "Bangun kebiasaan", promoAccent: "baik tiap hari.", promoDescription: "Kenali makananmu, bergerak dengan caramu, dan lihat kemajuannya.",
    balance: "KESEIMBANGAN HARI INI", dailyGoal: "dari target harian", onTrack: "Tetap sesuai jalur", everyStep: "Setiap langkah berarti", promoFooter: "RAWAT DIRIMU SETIAP HARI",
    join: "GABUNG NOURISH", welcome: "SELAMAT DATANG LAGI", registerTitle: "Ayo", registerAccent: "mulai.", loginTitle: "Selamat", loginAccent: "kembali.",
    registerDescription: "Buat ruang untuk makanan, aktivitas, dan tujuan yang sesuai dengan dirimu.", loginDescription: "Langkah kecil tetap berarti. Lanjutkan dari tempat terakhir.",
    google: "Lanjut dengan Google", phoneDivider: "atau lanjut dengan telepon", fullName: "Nama lengkap", namePlaceholder: "Nama Anda", phone: "Nomor telepon",
    callingCode: "Kode negara", other: "Lainnya", customCode: "Kode negara lainnya", phoneHint: "Awalan 0 menjadi", codeFallback: "kode negara Anda",
    password: "Kata sandi", passwordPlaceholder: "Minimal 8 karakter", confirmPassword: "Konfirmasi kata sandi", confirmPlaceholder: "Ulangi kata sandi",
    createAccount: "Buat akun", signIn: "Masuk", haveAccount: "Sudah punya akun?", newHere: "Baru di Nourish?", createLink: "Buat akun",
    formFooter: "Cara lebih tenang untuk merawat diri.",
    invalidCode: "Masukkan kode negara 1 hingga 3 digit.", invalidPhone: "Masukkan nomor telepon 8 hingga 15 digit, termasuk kode negara.",
    passwordsMismatch: "Kata sandi tidak cocok.", authPending: "Akses akun belum tersedia. Data Anda tidak dikirim atau disimpan.",
    googlePending: "Login Google belum tersedia. Akun belum dibuat.",
  },
} as const;

type Notice = "invalidCode" | "invalidPhone" | "passwordsMismatch" | "authPending" | "googlePending";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.2 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.9 24.5c0-1.6-.2-3.1-.4-4.5H24v9h12.9a11 11 0 0 1-4.8 7.2l7.7 6C44.3 38 46.9 31.9 46.9 24.5Z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.4 14.4 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-8-6.2A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8-6.2Z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.7-6A14.4 14.4 0 0 1 24 38.5c-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export function AccessPage({ mode }: { mode: AccessMode }) {
  const language = useLanguage();
  const reducedMotion = useReducedMotion();
  const text = copy[language];
  const [notice, setNotice] = useState<Notice | null>(null);
  const [countryCode, setCountryCode] = useState("+62");
  const [customCode, setCustomCode] = useState("");
  const isRegister = mode === "register";
  const activeCode = countryCode === "other" ? customCode : countryCode;

  function handlePhoneInput(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const cursor = input.selectionStart ?? input.value.length;
    const beforeCursor = normalizeNationalPhone(input.value.slice(0, cursor), activeCode);
    input.value = normalizeNationalPhone(input.value, activeCode);
    input.setSelectionRange(beforeCursor.length, beforeCursor.length);
    setNotice(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const choice = String(values.get("callingCode") ?? "");
    const code = choice === "other" ? String(values.get("customCode") ?? "") : choice;
    const national = normalizeNationalPhone(String(values.get("phone") ?? ""), code);
    const digits = `${code.replace(/\D/g, "")}${national}`;

    if (!/^\+[1-9]\d{0,2}$/.test(code)) {
      setNotice("invalidCode");
      return;
    }
    if (digits.length < 8 || digits.length > 15) {
      setNotice("invalidPhone");
      return;
    }
    if (isRegister && values.get("password") !== values.get("confirmPassword")) {
      setNotice("passwordsMismatch");
      return;
    }

    // ponytail: This phase builds auth screens only; connect Laravel auth before accepting credentials.
    setNotice("authPending");
  }

  return (
    <main className={`${styles.shell} ${isRegister ? "" : "h-dvh !min-h-0"}`}>
      <aside className={`${styles.promo} ${isRegister ? "" : "h-dvh !min-h-0"}`} aria-label={text.about}>
        <span className={styles.promoOrbitTop} aria-hidden="true" />
        <span className={styles.promoOrbitBottom} aria-hidden="true" />
        <Brand href="/login" ariaLabel={text.brandLabel} />
        <motion.div className={`${styles.promoContent} ${isRegister ? "" : styles.loginPromoContent}`} initial={reducedMotion ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.4 }}>
          <span className={styles.promoEyebrow}>{text.promoEyebrow}</span>
          <h2 className={`${styles.promoTitle} ${isRegister ? "" : styles.loginPromoTitle}`}>{text.promoTitle} <span className="text-brand-lemon">{text.promoAccent}</span></h2>
          <p className={styles.promoDescription}>{text.promoDescription}</p>
          <div className={`${styles.promoGraphic} ${isRegister ? "" : styles.loginPromoGraphic}`} aria-hidden="true">
            <div className={styles.promoCard}>
              <span className={styles.promoCardLabel}>{text.balance}</span>
              <div className={styles.promoRing}><span className={styles.promoRingCenter}>72%<small className={styles.promoRingCaption}>{text.dailyGoal}</small></span></div>
              <div className={styles.promoCardBottom}><span>{text.onTrack}</span><strong className="text-[1.3rem] text-[#006199]">✦</strong></div>
            </div>
            <div className={styles.promoFloat}>{text.everyStep} <span className="text-[1.4rem] leading-[.7]">↗</span></div>
          </div>
        </motion.div>
        <span className={styles.promoFooter}>{text.promoFooter}</span>
      </aside>

      <div className={`${styles.formSide} ${isRegister ? "max-[959px]:min-h-svh" : "h-dvh min-h-0"}`}>
        <header className={`${styles.formHeader} ${isRegister ? "" : styles.loginFormHeader}`}>
          <div className={styles.mobileBrand}><Brand href="/login" ariaLabel={text.brandLabel} /></div>
          <div className="flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div>
        </header>

        <motion.section className={`${styles.formContent} ${isRegister ? "" : styles.loginFormContent}`} aria-labelledby="access-title" initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.38 }}>
          <p className={`${styles.eyebrow} ${isRegister ? "" : styles.loginEyebrow}`}>{isRegister ? text.join : text.welcome}</p>
          <h1 className={`${styles.title} ${isRegister ? "" : styles.loginTitle}`} id="access-title">{isRegister ? <>{text.registerTitle}<br /><span className="text-primary">{text.registerAccent}</span></> : <>{text.loginTitle} <span className="text-primary">{text.loginAccent}</span></>}</h1>
          <p className={`${styles.description} ${isRegister ? "" : styles.loginDescription}`}>{isRegister ? text.registerDescription : text.loginDescription}</p>

          <button className={`${styles.googleButton} ${isRegister ? "" : styles.loginGoogle}`} type="button" onClick={() => setNotice("googlePending")}>
            <span className="mr-2 size-5"><GoogleMark /></span> {text.google}
          </button>

          <div className={`${styles.divider} ${isRegister ? "" : styles.loginDivider}`}><span className="h-px flex-1 bg-line" /><span>{text.phoneDivider}</span><span className="h-px flex-1 bg-line" /></div>

          <form className={`${styles.form} ${isRegister ? "" : styles.loginForm}`} onSubmit={handleSubmit}>
            {isRegister && (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="full-name">{text.fullName}</label>
                <input className={styles.input} id="full-name" name="name" type="text" autoComplete="name" placeholder={text.namePlaceholder} required />
              </div>
            )}
            <div className={`${styles.field} ${isRegister ? "" : styles.loginField}`}>
              <label className={styles.fieldLabel} htmlFor="phone">{text.phone}</label>
              <div className={`${styles.phoneControl} ${isRegister ? "" : styles.loginControl}`}>
                <select className={`${styles.countrySelect} ${isRegister ? "" : styles.loginControlInner}`} name="callingCode" aria-label={text.callingCode} autoComplete="tel-country-code" value={countryCode} onChange={(event) => { setCountryCode(event.target.value); setNotice(null); }}>
                  {COUNTRY_CODES.map(({ name, nameId, label, code }) => <option className="bg-surface text-ink" key={code} value={code} aria-label={`${language === "id" ? nameId : name} ${code}`}>{label}</option>)}
                  <option className="bg-surface text-ink" value="other">{text.other}</option>
                </select>
                {countryCode === "other" && <input className={`${styles.customCode} ${isRegister ? "" : styles.loginControlInner}`} name="customCode" type="tel" inputMode="tel" aria-label={text.customCode} placeholder="+49" value={customCode} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 3); setCustomCode(digits ? `+${digits}` : ""); }} required />}
                <span className={styles.phoneDivider} aria-hidden="true" />
                <input className={`${styles.phoneNumber} ${isRegister ? "" : styles.loginControlInner}`} id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="812 3456 7890" aria-describedby="phone-hint" onInput={handlePhoneInput} required />
              </div>
              <span className={`${styles.fieldHint} ${isRegister ? "" : styles.loginFieldHint}`} id="phone-hint">{text.phoneHint} {activeCode || text.codeFallback}.</span>
            </div>
            <div className={`${styles.field} ${isRegister ? "" : styles.loginField}`}>
              <label className={styles.fieldLabel} htmlFor="password">{text.password}</label>
              <input className={`${styles.input} ${isRegister ? "" : styles.loginControl}`} id="password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder={text.passwordPlaceholder} minLength={8} required />
            </div>
            {isRegister && (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="confirm-password">{text.confirmPassword}</label>
                <input className={styles.input} id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder={text.confirmPlaceholder} minLength={8} required />
              </div>
            )}
            <button className={`${styles.submit} ${isRegister ? "" : styles.loginControl}`} type="submit">{isRegister ? text.createAccount : text.signIn}<span className="ml-auto text-[1.35rem] leading-none font-normal" aria-hidden="true">→</span></button>
          </form>

          {notice && <p className={styles.notice} role="status">{text[notice]}</p>}
          <p className={`${styles.switch} ${isRegister ? "" : styles.loginSwitch}`}>{isRegister ? text.haveAccount : text.newHere} <Link className={styles.switchLink} href={isRegister ? "/login" : "/register"}>{isRegister ? text.signIn : text.createLink}</Link></p>
        </motion.section>
        {isRegister && <p className={styles.formFooter}>{text.formFooter}</p>}
      </div>
    </main>
  );
}
