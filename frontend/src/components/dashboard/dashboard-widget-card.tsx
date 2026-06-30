"use client";

import type { DashboardWidgetDefinition } from "@/lib/dashboard/widgets";
import type { Debitor } from "@/types/debitor";
import type { ExchangeRatesToChf } from "@/lib/exchange-rates";

interface DashboardWidgetCardProps {
  widget: DashboardWidgetDefinition;
  debitoren: Debitor[];
  exchangeRates: ExchangeRatesToChf;
}

export function DashboardWidgetCard({
  widget,
  debitoren,
  exchangeRates,
}: DashboardWidgetCardProps) {
  const Chart = widget.component;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">{widget.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{widget.description}</p>
        <p className="mt-1 text-xs text-slate-400">
          Kurse vom {exchangeRates.date} ({exchangeRates.source})
        </p>
      </div>
      <Chart debitoren={debitoren} exchangeRates={exchangeRates} />
    </section>
  );
}
