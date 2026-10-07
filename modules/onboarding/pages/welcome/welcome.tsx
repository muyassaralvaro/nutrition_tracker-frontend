"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Brand } from "@/shared/components/brand/Brand";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useLanguage, type Language } from "@/shared/language";
import { styles } from "./welcome.styles";

const copy = {
  en: {
    slides: [
      { label: "A clearer way to eat", title: "Make meals", accent: "make sense.", description: "Snap your plate, check the details, and keep a picture of what fuels your day." },
      { label: "Made for your goals", title: "Find your", accent: "own balance.", description: "Your weight, activity, and goals shape a daily target you can always adjust." },
      { label: "Progress at your pace", title: "See the", accent: "whole story.", description: "Meals, movement, and weight trends come together, one good day at a time." },
    ],
    mealSnap: "MEAL SNAP", lunch: "Lunch plate", mealCaption: "Looks good, feels good", foodsFound: "3 foods found",
    dailyGoal: "YOUR DAILY GOAL", kcalTarget: "kcal target", startingPoint: "A starting point made for you", carbs: "Carbs",
    week: "YOUR WEEK", smallSteps: "Small steps add up.", daysLogged: "4 of 5 days logged", rhythm: "Your rhythm", weekDays: ["M", "T", "W", "T", "F", "S", "S"],
    notes: ["A moment to nourish", "Made around you", "Keep your momentum"],
    skip: "Skip intro", back: "Back", continue: "Continue", getStarted: "Get started", opening: "Getting your space ready…",
    slidesLabel: "Introduction slides", slideLabel: (index: number) => `Go to slide ${index + 1}`, brandLabel: "Nourish home",
  },
  id: {
    slides: [
      { label: "Kenali makananmu", title: "Pahami", accent: "makananmu.", description: "Foto hidanganmu, lihat rincian gizi, dan kenali asupan harianmu." },
      { label: "Sesuai tujuanmu", title: "Target", accent: "untukmu.", description: "Berat badan, aktivitas, dan tujuanmu membentuk target harian yang bisa kamu ubah." },
      { label: "Maju dengan ritmemu", title: "Lihat", accent: "kemajuanmu.", description: "Catatan makan, olahraga, dan berat badan menunjukkan kemajuanmu dari waktu ke waktu." },
    ],
    mealSnap: "FOTO MAKANAN", lunch: "Makan siang", mealCaption: "Enak dan seimbang", foodsFound: "3 makanan",
    dailyGoal: "TARGET HARIAN", kcalTarget: "target kkal", startingPoint: "Awal yang sesuai untukmu", carbs: "Karbo",
    week: "PEKAN INI", smallSteps: "Langkah kecil berarti.", daysLogged: "Tercatat 4 dari 5 hari", rhythm: "Ritmemu", weekDays: ["S", "S", "R", "K", "J", "S", "M"],
    notes: ["Nikmati hari ini", "Sesuai tujuanmu", "Terus melangkah"],
    skip: "Lewati", back: "Kembali", continue: "Lanjut", getStarted: "Mulai", opening: "Menyiapkan ruangmu…",
    slidesLabel: "Slide pengenalan", slideLabel: (index: number) => `Buka slide ${index + 1}`, brandLabel: "Beranda Nourish",
  },
} as const;

type WelcomeCopy = (typeof copy)[Language];

function MealArtwork({ text }: { text: WelcomeCopy }) {
  return (
    <>
      <div className={styles.artTop}><span>{text.mealSnap}</span><span className={styles.artDots}>•••</span></div>
      <div className={styles.plate}>
        <svg className={styles.plateSvg} viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r="108" fill="#F8F5E8" />
          <circle cx="120" cy="120" r="92" fill="#FFFEF7" />
          <ellipse cx="86" cy="109" rx="42" ry="26" transform="rotate(-27 86 109)" fill="#4F925B" />
          <ellipse cx="153" cy="92" rx="43" ry="26" transform="rotate(24 153 92)" fill="#77AB62" />
          <ellipse cx="155" cy="151" rx="42" ry="26" transform="rotate(-24 155 151)" fill="#5C9B63" />
          <ellipse cx="79" cy="156" rx="32" ry="22" transform="rotate(22 79 156)" fill="#87B56A" />
          <circle cx="120" cy="122" r="40" fill="#FFFFFF" />
          <circle cx="120" cy="122" r="22" fill="#FFD444" />
          <circle cx="59" cy="92" r="11" fill="#EE715D" />
          <circle cx="181" cy="122" r="12" fill="#EE715D" />
          <circle cx="89" cy="188" r="9" fill="#EE715D" />
          <path d="M55 133c19 8 34 2 43-11M162 62c-15 16-19 28-13 39M172 176c-14-16-26-20-41-17" stroke="#2F7048" strokeWidth="5" strokeLinecap="round" />
          <circle cx="74" cy="71" r="3" fill="#2C5E44" /><circle cx="169" cy="187" r="3" fill="#2C5E44" />
        </svg>
      </div>
      <div className={styles.artBottom}><div className={styles.artBottomCopy}><strong className={styles.artBottomTitle}>{text.lunch}</strong><span className={styles.artBottomCaption}>{text.mealCaption}</span></div><span className={styles.artPill}>{text.foodsFound}</span></div>
    </>
  );
}

function GoalArtwork({ text }: { text: WelcomeCopy }) {
  return (
    <>
      <div className={styles.artTop}><span>{text.dailyGoal}</span><span className={styles.artDots}>•••</span></div>
      <div className={styles.goalRing}><div className={styles.goalRingCenter}><strong className={styles.goalRingValue}>1,850</strong><span className="text-[.72rem] text-muted max-[767px]:text-[.57rem]">{text.kcalTarget}</span></div></div>
      <div className={styles.goalCaption}>{text.startingPoint}</div>
      <div className={styles.macroRow}>
        <div className={styles.macroItem}><span className="size-[9px] rounded-full bg-brand-sky" />Protein <strong className="ml-auto text-ink">95g</strong></div>
        <div className={styles.macroItem}><span className="size-[9px] rounded-full bg-brand-sun" />{text.carbs} <strong className="ml-auto text-ink">210g</strong></div>
      </div>
    </>
  );
}

function ProgressArtwork({ text }: { text: WelcomeCopy }) {
  return (
    <>
      <div className={styles.artTop}><span>{text.week}</span><span className={styles.artDots}>•••</span></div>
      <div className={styles.progressHeading}><strong className={styles.progressTitle}>{text.smallSteps}</strong><span className={styles.progressCaption}>{text.daysLogged}</span></div>
      <div className={styles.weekRow}>
        {text.weekDays.map((day, index) => (
          <div key={`${day}-${index}`} className={`${styles.weekDay} ${index < 4 ? styles.dayDone : styles.dayPending}`}>{day}</div>
        ))}
      </div>
      <div className={styles.chartTitle}>{text.rhythm} <span className="text-2xl text-primary">↗</span></div>
      <svg className={styles.chart} viewBox="0 0 320 120" aria-hidden="true">
        <path className="fill-brand-sky/25" d="M5 100 C45 85 54 84 83 89 S134 47 164 56 S224 73 250 41 S292 32 315 18 L315 120 L5 120 Z" />
        <path className="fill-none stroke-primary stroke-[5] [stroke-linecap:round]" d="M5 100 C45 85 54 84 83 89 S134 47 164 56 S224 73 250 41 S292 32 315 18" />
      </svg>
    </>
  );
}

export function WelcomePage() {
  const router = useRouter();
  const language = useLanguage();
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [opening, setOpening] = useState(false);
  const text = copy[language];
  const slide = text.slides[current];

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => router.replace("/login"), reducedMotion ? 0 : 550);
    return () => window.clearTimeout(timer);
  }, [opening, reducedMotion, router]);

  function finish() {
    if (opening) return;
    // ponytail: Intro completion is per browser; move it to user preferences after account setup.
    document.cookie = "nourish_intro_seen=1; Max-Age=31536000; Path=/; SameSite=Lax";
    setOpening(true);
  }

  function next() {
    if (current === text.slides.length - 1) finish();
    else setCurrent(current + 1);
  }

  return (
    <main className={styles.shell}>
      <span className={styles.glow} aria-hidden="true" />
      <header className={`${styles.frame} ${styles.topbar}`}>
        <Brand ariaLabel={text.brandLabel} />
        <div className={styles.topActions}>
          <button className={styles.plainButton} type="button" onClick={finish} disabled={opening}>{text.skip}</button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className={`${styles.frame} ${styles.mainGrid}`}>
        <div className={styles.visual} aria-hidden="true">
          <span className={styles.visualOrbitTop} /><span className={styles.visualOrbitBottom} />
          <span className={styles.orbitOne} /><span className={styles.orbitTwo} />
          <div className={styles.preview}>
            <AnimatePresence mode="wait">
              <motion.div key={current} className="flex h-full flex-col" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
                {current === 0 ? <MealArtwork text={text} /> : current === 1 ? <GoalArtwork text={text} /> : <ProgressArtwork text={text} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={styles.floatingNote}>{text.notes[current]}<span className="text-[1.1rem]">✦</span></div>
        </div>

        <div className={styles.content} aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -12 }} transition={{ duration: reducedMotion ? 0 : 0.22 }}>
              <p className={styles.eyebrow}><span className={styles.eyebrowLine} />{slide.label}</p>
              <h1 className={styles.title}>{slide.title}<br /><span className="text-primary">{slide.accent}</span></h1>
              <p className={styles.description}>{slide.description}</p>
            </motion.div>
          </AnimatePresence>
          <div className={styles.footer}>
            <div className={styles.slideNav} aria-label={text.slidesLabel}>
              {text.slides.map((item, index) => (
                <button key={item.label} className={`${styles.dot} ${index === current ? styles.dotActive : ""}`} type="button" onClick={() => setCurrent(index)} aria-label={text.slideLabel(index)} aria-current={index === current ? "step" : undefined} />
              ))}
              <span className={styles.stepCount}>0{current + 1} / 03</span>
            </div>
            <div className={styles.buttons}>
              {current > 0 && <button className={styles.plainButton} type="button" onClick={() => setCurrent(current - 1)}>{text.back}</button>}
              <button className={styles.next} type="button" onClick={next} disabled={opening}>{current === text.slides.length - 1 ? text.getStarted : text.continue}<span className="ml-4 text-[1.4rem] leading-none font-normal" aria-hidden="true">→</span></button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {opening && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-canvas text-ink" role="status" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
            <div className="flex flex-col items-center gap-5 text-center">
              <motion.span className="grid size-16 place-items-center rounded-2xl bg-brand-blue text-3xl text-brand-sun" aria-hidden="true" animate={reducedMotion ? undefined : { scale: [1, 1.08, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>✦</motion.span>
              <p className="text-sm font-semibold">{text.opening}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
