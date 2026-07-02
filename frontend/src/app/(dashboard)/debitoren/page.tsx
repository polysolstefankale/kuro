"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import type { Debitor, DebitorFormData } from "@/types/debitor";
import {
  createDebitor,
  deleteDebitor,
  fetchDebitoren,
  updateDebitor,
} from "@/lib/api";
import { DebitorDialog } from "@/components/debitor-dialog";
import { DebitorenTable } from "@/components/debitoren-table";
import { ExportExcelButton } from "@/components/export-excel-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StatusFilter = "alle" | "aktiv" | "inaktiv";

const selectClassName =
  "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60";

function matchesSearch(debitor: Debitor, query: string): boolean {
  const q = query.toLowerCase();
  const searchable = [
    debitor.debitorNummer,
    debitor.name,
    debitor.strasse,
    debitor.plz,
    debitor.ort,
    `${debitor.plz} ${debitor.ort}`.trim(),
    debitor.land,
    debitor.status,
    debitor.hauptnummer,
    debitor.waehrung,
    String(debitor.umsatz),
  ];

  return searchable.some((value) => value.toLowerCase().includes(q));
}

export default function DebitorenPage() {
  const searchParams = useSearchParams();
  const [debitoren, setDebitoren] = useState<Debitor[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktiv");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebitor, setEditingDebitor] = useState<Debitor | null>(null);
  const [markedIds, setMarkedIds] = useState<Set<number>>(() => new Set());
  const handledFocusRef = useRef<number | null>(null);

  const focusDebitorId = useMemo(() => {
    const raw = searchParams.get("debitorId");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [searchParams]);

  const loadDebitoren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDebitoren();
      setDebitoren(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Debitoren konnten nicht geladen werden",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebitoren();
  }, [loadDebitoren]);

  useEffect(() => {
    if (!focusDebitorId || loading || debitoren.length === 0) return;
    if (handledFocusRef.current === focusDebitorId) return;

    const target = debitoren.find((d) => d.id === focusDebitorId);
    if (!target) return;

    handledFocusRef.current = focusDebitorId;
    setSearch("");
    setStatusFilter("alle");
  }, [focusDebitorId, loading, debitoren]);

  function openCreate() {
    setEditingDebitor(null);
    setDialogOpen(true);
  }

  function openEdit(debitor: Debitor) {
    setEditingDebitor(debitor);
    setDialogOpen(true);
  }

  async function handleSave(form: DebitorFormData) {
    if (editingDebitor) {
      await updateDebitor(editingDebitor.id, form);
    } else {
      await createDebitor(form);
    }
    await loadDebitoren();
  }

  async function handleDelete(id: number) {
    await deleteDebitor(id);
    await loadDebitoren();
  }

  const filteredDebitoren = useMemo(() => {
    let result = debitoren;

    if (statusFilter === "aktiv") {
      result = result.filter((d) => d.status === "Aktiv");
    } else if (statusFilter === "inaktiv") {
      result = result.filter((d) => d.status === "Inaktiv");
    }

    const query = search.trim();
    if (query) {
      result = result.filter((d) => matchesSearch(d, query));
    }

    return result;
  }, [debitoren, search, statusFilter]);

  const emptyMessage = useMemo(() => {
    const query = search.trim();
    if (query) return `Keine Treffer für "${query}".`;
    if (statusFilter === "aktiv") return "Keine aktiven Debitoren vorhanden.";
    if (statusFilter === "inaktiv") return "Keine inaktiven Debitoren vorhanden.";
    return "Noch keine Debitoren vorhanden.";
  }, [search, statusFilter]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Debitoren
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kundenstamm verwalten — anlegen, bearbeiten und löschen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton
            kind="debitoren"
            allRows={debitoren}
            filteredRows={filteredDebitoren}
            markedIds={markedIds}
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Neu
          </Button>
        </div>
      </div>

      {!loading && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Suche in allen Spalten…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClassName}
            aria-label="Statusfilter"
          >
            <option value="alle">Alle anzeigen</option>
            <option value="aktiv">Nur Aktiv</option>
            <option value="inaktiv">Nur Inaktiv</option>
          </select>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Debitoren werden geladen…</p>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && (
        <DebitorenTable
          debitoren={filteredDebitoren}
          focusDebitorId={focusDebitorId}
          markedIds={markedIds}
          onMarkedIdsChange={setMarkedIds}
          emptyMessage={emptyMessage}
          showEmptyHint={!search.trim() && statusFilter === "alle"}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <DebitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debitor={editingDebitor}
        onSave={handleSave}
      />
    </div>
  );
}
