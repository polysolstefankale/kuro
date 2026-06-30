import type { Debitor } from "@/types/debitor";
import type { ExchangeRatesToChf } from "@/lib/exchange-rates";
import { convertAmountToChf } from "@/lib/exchange-rates";

export interface UmsatzDebitorChartItem {
  id: number;
  name: string;
  debitorNummer: string;
  umsatzChf: number;
  umsatzOriginal: number;
  waehrung: string;
  converted: boolean;
}

export function debitorenToChfChartData(
  debitoren: Debitor[],
  exchangeRates: ExchangeRatesToChf,
): {
  items: UmsatzDebitorChartItem[];
  unconvertible: string[];
} {
  const items: UmsatzDebitorChartItem[] = [];
  const unconvertible: string[] = [];

  const activeDebitoren = debitoren.filter((d) => d.status === "Aktiv");

  for (const debitor of activeDebitoren) {
    const waehrung = debitor.waehrung || "CHF";
    const umsatzChf = convertAmountToChf(
      debitor.umsatz,
      waehrung,
      exchangeRates,
    );

    if (umsatzChf === null) {
      unconvertible.push(`${debitor.name} (${waehrung})`);
      continue;
    }

    items.push({
      id: debitor.id,
      name: debitor.name,
      debitorNummer: debitor.debitorNummer,
      umsatzChf,
      umsatzOriginal: debitor.umsatz,
      waehrung,
      converted: waehrung !== "CHF",
    });
  }

  items.sort((a, b) => b.umsatzChf - a.umsatzChf);

  return { items, unconvertible };
}

export interface PieChartSlice {
  name: string;
  value: number;
  debitorId?: number;
}

const PIE_TOP_N = 7;

export function toPieChartData(items: UmsatzDebitorChartItem[]): PieChartSlice[] {
  if (items.length <= PIE_TOP_N) {
    return items.map((item) => ({
      name: item.name,
      value: item.umsatzChf,
      debitorId: item.id,
    }));
  }

  const top = items.slice(0, PIE_TOP_N);
  const restSum = items
    .slice(PIE_TOP_N)
    .reduce((sum, item) => sum + item.umsatzChf, 0);

  return [
    ...top.map((item) => ({
      name: item.name,
      value: item.umsatzChf,
      debitorId: item.id,
    })),
    { name: "Sonstige", value: restSum },
  ];
}

export interface LineChartPoint {
  id: number;
  rank: number;
  name: string;
  debitorNummer: string;
  umsatzChf: number;
}

export function toLineChartData(items: UmsatzDebitorChartItem[]): LineChartPoint[] {
  return items.map((item, index) => ({
    id: item.id,
    rank: index + 1,
    name: item.name,
    debitorNummer: item.debitorNummer,
    umsatzChf: item.umsatzChf,
  }));
}
