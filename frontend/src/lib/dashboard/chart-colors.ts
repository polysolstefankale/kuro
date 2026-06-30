/** Kräftige, gut unterscheidbare Diagrammfarben */
export const CHART_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#e11d48",
  "#4f46e5",
  "#059669",
  "#c026d3",
  "#0284c7",
  "#ea580c",
  "#7c3aed",
  "#0d9488",
  "#be123c",
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
