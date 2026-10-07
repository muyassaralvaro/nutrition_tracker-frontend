import Link from "next/link";

export function Brand({ href = "/", ariaLabel = "Nourish home" }: { href?: string; ariaLabel?: string }) {
  return (
    <Link className="inline-flex items-center gap-3 text-[1.45rem] leading-none font-extrabold tracking-[-.075em] text-inherit no-underline" href={href} aria-label={ariaLabel}>
      <span className="grid size-[2.35rem] -rotate-[8deg] place-items-center rounded-[.85rem] bg-brand-blue text-white" aria-hidden="true">
        <svg className="size-[1.8rem] rotate-[8deg]" viewBox="0 0 40 40" fill="none">
          <path d="M11 26c1-9 8-15 18-15-1 10-7 17-17 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 29c4-5 9-8 16-11" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="29" cy="28" r="3" fill="var(--brand-sun)" />
        </svg>
      </span>
      <span>nourish<span className="text-brand-sun">.</span></span>
    </Link>
  );
}
