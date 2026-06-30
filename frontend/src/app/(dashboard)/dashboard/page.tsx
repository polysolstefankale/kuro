"use client";

import { useCallback, useEffect, useState } from "react";
import type { Debitor } from "@/types/debitor";
import type { ExchangeRatesToChf } from "@/lib/exchange-rates";
import { fetchDebitoren } from "@/lib/api";
import { fetchExchangeRates } from "@/lib/dashboard/exchange-rates-client";
import { dashboardWidgets } from "@/lib/dashboard/widgets";
import { DashboardWidgetCard } from "@/components/dashboard/dashboard-widget-card";

export default function DashboardPage() {
  const [debitoren, setDebitoren] = useState<Debitor[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesToChf | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [debitorenData, rates] = await Promise.all([
        fetchDebitoren(),
        fetchExchangeRates(),
      ]);
      setDebitoren(debitorenData);
      setExchangeRates(rates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Daten konnten nicht geladen werden",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Übersichten und Auswertungen — erweiterbar um benutzerdefinierte Graphen.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Dashboard wird geladen…</p>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && exchangeRates && (
        <div className="space-y-6">
          {dashboardWidgets.map((widget) => (
            <DashboardWidgetCard
              key={widget.id}
              widget={widget}
              debitoren={debitoren}
              exchangeRates={exchangeRates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
