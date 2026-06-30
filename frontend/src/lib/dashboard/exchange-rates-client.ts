import type { ExchangeRatesToChf } from "@/lib/exchange-rates";

export async function fetchExchangeRates(): Promise<ExchangeRatesToChf> {
  const res = await fetch("/lookup/exchange-rates");
  if (!res.ok) {
    throw new Error("Wechselkurse konnten nicht geladen werden");
  }
  return res.json() as Promise<ExchangeRatesToChf>;
}
