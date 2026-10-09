"use client";

import { useEffect, useRef } from "react";
import { Chart, CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip } from "chart.js";
import { displayWeight, type UnitSystem } from "../../nutrition";
import { formatWeightDate, type WeightDay } from "./weight-history";

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip);

export function WeightHistoryChart({ series, language, unitSystem, label, carriedLabel, goalKg }: { series: readonly WeightDay[]; language: "en" | "id"; unitSystem: UnitSystem; label: string; carriedLabel: string; goalKg?: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !series.some((day) => day.kg !== null)) return;
    const chartCanvas = canvas;

    const unit = unitSystem === "imperial" ? "lb" : "kg";
    const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
    const values = series.flatMap((day) => day.kg === null ? [] : [displayWeight(day.kg, unitSystem)]);
    const goal = goalKg === null || goalKg === undefined ? null : displayWeight(goalKg, unitSystem);
    const lowest = goal === null ? Math.min(...values) : Math.min(...values, goal);
    const highest = goal === null ? Math.max(...values) : Math.max(...values, goal);
    const padding = Math.max((highest - lowest) * 0.25, unitSystem === "imperial" ? 4 : 2);
    let chart: Chart<"line", (number | null)[], string> | null = null;

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
          labels: series.map((day) => formatWeightDate(day.date, language).slice(0, 6)),
          datasets: [
            { data: series.map((day) => day.kg === null ? null : displayWeight(day.kg, unitSystem)), borderColor: primary, backgroundColor: `${primary}24`, fill: "start", borderWidth: 3, tension: 0, pointRadius: (context) => series.length === 1 || series[context.dataIndex]?.recorded ? 4 : 0, pointHoverRadius: 7, pointHitRadius: 16, pointBackgroundColor: primary, pointBorderColor: surface, pointBorderWidth: 2 },
            ...(goal === null ? [] : [{ data: series.map(() => goal), borderColor: muted, borderDash: [6, 4], borderWidth: 2, pointRadius: 0, pointHitRadius: 0, fill: false }]),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 400 },
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { displayColors: false, filter: (item) => item.datasetIndex === 0, callbacks: { title: (items) => items[0] ? formatWeightDate(series[items[0].dataIndex].date, language) : "", label: (item) => `${series[item.dataIndex].recorded ? label : carriedLabel}: ${item.parsed.y === null ? "—" : number.format(item.parsed.y)} ${unit}` } } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5, maxRotation: 0 } },
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
  }, [series, language, unitSystem, label, carriedLabel, goalKg]);

  return <div className="relative mt-3 min-h-56 w-full flex-1 lg:min-h-0"><canvas ref={canvasRef} role="img" aria-label={label} /></div>;
}
