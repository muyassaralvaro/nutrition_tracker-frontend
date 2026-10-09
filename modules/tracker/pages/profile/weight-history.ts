export function formatWeightDate(date: string, language: "en" | "id"): string {
  const [year, month, day] = date.split("-");
  const monthName = new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  return `${day}-${monthName}-${year}`;
}

export function shiftWeightMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
}

export interface WeightDay { date: string; kg: number | null; recorded: boolean }

export function weightMonthSeries(month: string, entries: readonly { date: string; kg: number }[], previous: { kg: number } | null, today: string): WeightDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const elapsedDays = month === today.slice(0, 7) ? Math.min(days, Number(today.slice(8, 10))) : month < today.slice(0, 7) ? days : 0;
  const recordedWeights = new Map(entries.map((entry) => [entry.date, entry.kg]));
  let kg = previous?.kg ?? null;

  return Array.from({ length: elapsedDays }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    const recorded = recordedWeights.has(date);
    if (recorded) kg = recordedWeights.get(date) ?? kg;
    return { date, kg, recorded };
  });
}
