export function formatWeightDate(date: string, language: "en" | "id"): string {
  const [year, month, day] = date.split("-");
  const monthName = new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  return `${day}-${monthName}-${year}`;
}
