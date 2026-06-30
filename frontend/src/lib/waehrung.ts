export interface WaehrungInfo {
  code: string;
  name: string;
}

export const DEFAULT_WAEHRUNG = "CHF";

export function formatUmsatz(umsatz: number, waehrung = DEFAULT_WAEHRUNG): string {
  try {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: waehrung,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(umsatz);
  } catch {
    return `${umsatz.toFixed(2)} ${waehrung}`;
  }
}

export function waehrungLabel(
  code: string,
  waehrungen: WaehrungInfo[],
): string {
  const match = waehrungen.find((w) => w.code === code);
  return match ? `${match.code} — ${match.name}` : code;
}
