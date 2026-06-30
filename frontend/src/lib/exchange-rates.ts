export interface ExchangeRatesToChf {
  date: string;
  source: string;
  /** 1 Einheit der Währung = factor CHF */
  factors: Record<string, number>;
}

export function convertAmountToChf(
  amount: number,
  currency: string,
  rates: ExchangeRatesToChf,
): number | null {
  const code = currency || "CHF";
  const factor = rates.factors[code];
  if (factor === undefined) return null;
  return amount * factor;
}
