import "server-only";

import type { ExchangeRatesToChf } from "@/lib/exchange-rates";

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function fetchExchangeRatesToChf(): Promise<ExchangeRatesToChf> {
  const res = await fetch("https://api.frankfurter.app/latest", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error("Wechselkurse konnten nicht geladen werden");
  }

  const data = (await res.json()) as FrankfurterResponse;
  const factors: Record<string, number> = { CHF: 1 };

  if (data.base === "CHF") {
    for (const [currency, rate] of Object.entries(data.rates)) {
      factors[currency] = 1 / rate;
    }
  } else {
    const chfPerBase = data.rates.CHF;
    if (!chfPerBase) {
      throw new Error("CHF-Kurs fehlt in den Wechselkursdaten");
    }

    factors[data.base] = chfPerBase;
    for (const [currency, rate] of Object.entries(data.rates)) {
      if (currency === "CHF") continue;
      factors[currency] = chfPerBase / rate;
    }
  }

  return {
    date: data.date,
    source: "Frankfurter (EZB-Tageskurse)",
    factors,
  };
}
