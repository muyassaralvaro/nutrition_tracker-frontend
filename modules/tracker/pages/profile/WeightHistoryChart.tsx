"use client";

import { useEffect, useRef } from "react";
import { Chart, CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip } from "chart.js";
import { displayWeight, type UnitSystem } from "../../nutrition";
import type { WeightEntry } from "../../tracker-data";
import { formatWeightDate } from "./weight-history";

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip);

export function WeightHistoryChart({ entries, language, unitSystem, label, goalKg }: { entries: readonly WeightEntry[]; language: "en" | "id"; unitSystem: UnitSystem; label: string; goalKg?: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !entries.length) return;
    const chartCanvas = canvas;

    const unit = unitSystem === "imperial" ? "lb" : "kg";
    const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
    const values = entries.map((entry) => displayWeight(entry.kg, unitSystem));
    const goal = goalKg === null || goalKg === undefined ? null : displayWeight(goalKg, unitSystem);
    const lowest = goal === null ? Math.min(...values) : Math.min(...values, goal);
    const highest = goal === null ? Math.max(...values) : Math.max(...values, goal);
    const padding = Math.max((highest - lowest) * 0.25, unitSystem === "imperial" ? 4 : 2);
    let chart: Chart<"line", number[], string> | null = null;

    function renderChart() {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--color-primary").trim() || "#006199";
      const muted = style.getPropertyValue("--muted").trim() || "#587484";
      const line = style.getPropertyValue("--line").trim() || "#d9e8ef";
      const surface = style.getPropertyValue("--surface").trim() || "#ffffff";
      chart?.destroy();
      chart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: entries.map((entry) => formatWeightDate(entry.date, language)),
          datasets: [
            { data: values, borderColor: primary, backgroundColor: `${primary}24`, fill: "start", borderWidth: 3, tension: 0.25, pointRadius: entries.length === 1 ? 6 : 4, pointHoverRadius: 8, pointHitRadius: 20, pointBackgroundColor: primary, pointBorderColor: surface, pointBorderWidth: 2 },
            ...(goal === null ? [] : [{ data: entries.map(() => goal), borderColor: muted, borderDash: [6, 4], borderWidth: 2, pointRadius: 0, pointHitRadius: 0, fill: false }]),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 400 },
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { displayColors: false, filter: (item) => item.datasetIndex === 0, callbacks: { label: (item) => `${label}: ${item.parsed.y === null ? "—" : number.format(item.parsed.y)} ${unit}` } } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 3, maxRotation: 0 } },
            y: { suggestedMin: Math.max(0, lowest - padding), suggestedMax: highest + padding, border: { display: false }, grid: { color: line }, ticks: { color: muted, maxTicksLimit: 6, callback: (value) => `${number.format(Number(value))} ${unit}` } },
          },
        },
      });
    }

    renderChart();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("nourish-theme-change", renderChart);
    media.addEventListener("change", renderChart);
    return () => { window.removeEventListener("nourish-theme-change", renderChart); media.removeEventListener("change", renderChart); chart?.destroy(); };
  }, [entries, language, unitSystem, label, goalKg]);

  return <div className="relative mt-3 h-56 w-full sm:h-64"><canvas ref={canvasRef} role="img" aria-label={label} /></div>;
}
