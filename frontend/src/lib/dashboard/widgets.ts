import type { ComponentType } from "react";
import type { Debitor } from "@/types/debitor";
import type { ExchangeRatesToChf } from "@/lib/exchange-rates";
import { UmsatzProDebitorChart } from "@/components/dashboard/umsatz-pro-debitor-chart";

export interface DashboardWidgetProps {
  debitoren: Debitor[];
  exchangeRates: ExchangeRatesToChf;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  description: string;
  component: ComponentType<DashboardWidgetProps>;
}

/** Registry für Dashboard-Widgets — später um benutzerdefinierte Graphen erweiterbar. */
export const dashboardWidgets: DashboardWidgetDefinition[] = [
  {
    id: "umsatz-pro-debitor-chf",
    title: "Umsatz pro Debitor (CHF)",
    description:
      "Balken-, Kuchen- und Liniendiagramm — nur aktive Debitoren, Umsätze in CHF (EZB-Tageskurs).",
    component: UmsatzProDebitorChart,
  },
];
