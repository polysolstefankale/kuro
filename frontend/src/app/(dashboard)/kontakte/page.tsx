"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Debitor } from "@/types/debitor";
import type { Kontakt, KontaktFormData } from "@/types/kontakt";
import { kontaktDisplayName } from "@/types/kontakt";
import {
  createKontakt,
  deleteKontakt,
  fetchDebitoren,
  fetchKontakteMitDebitor,
  updateKontakt,
} from "@/lib/api";
import { KontaktDialog } from "@/components/kontakt-dialog";
import { DebitorFilterSelect } from "@/components/debitor-filter-select";
import { ExportExcelButton } from "@/components/export-excel-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortColumn = "name" | "debitor" | "email" | "telefon";
type SortDirection = "asc" | "desc";

function matchesSearch(kontakt: Kontakt, query: string): boolean {
  const q = query.toLowerCase();
  const searchable = [
    kontaktDisplayName(kontakt),
    kontakt.vorname,
    kontakt.nachname,
    kontakt.debitorName ?? "",
    kontakt.email,
    kontakt.telefon,
  ];
  return searchable.some((value) => value.toLowerCase().includes(q));
}

function compareKontakte(a: Kontakt, b: Kontakt, column: SortColumn): number {
  switch (column) {
    case "name":
      return kontaktDisplayName(a).localeCompare(kontaktDisplayName(b), "de");
    case "debitor":
      return (a.debitorName ?? "").localeCompare(b.debitorName ?? "", "de");
    case "email":
      return (a.email ?? "").localeCompare(b.email ?? "", "de");
    case "telefon":
      return (a.telefon ?? "").localeCompare(b.telefon ?? "", "de", { numeric: true });
  }
}

function SortableHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
}: {
  column: SortColumn;
  label: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sortColumn === column;

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 rounded px-1 -mx-1 hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
        aria-sort={
          active
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        {label}
        {active ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
    </th>
  );
}

export default function KontaktePage() {
  const [kontakte, setKontakte] = useState<Kontakt[]>([]);
  const [debitoren, setDebitoren] = useState<Debitor[]>([]);
  const [search, setSearch] = useState("");
  const [debitorFilter, setDebitorFilter] = useState<number | "alle">("alle");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKontakt, setEditingKontakt] = useState<Kontakt | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [markedIds, setMarkedIds] = useState<Set<number>>(() => new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kontakteData, debitorenData] = await Promise.all([
        fetchKontakteMitDebitor(),
        fetchDebitoren(),
      ]);
      setKontakte(kontakteData);
      setDebitoren(debitorenData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kontakte konnten nicht geladen werden",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditingKontakt(null);
    setDialogOpen(true);
  }

  function openEdit(kontakt: Kontakt) {
    setEditingKontakt(kontakt);
    setDialogOpen(true);
  }

  async function handleSave(form: KontaktFormData) {
    if (editingKontakt) {
      await updateKontakt(editingKontakt.id, form);
    } else {
      await createKontakt(form);
    }
    await loadData();
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteKontakt(id);
      setConfirmId(null);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const filteredKontakte = useMemo(() => {
    let result = kontakte;
    if (debitorFilter !== "alle") {
      result = result.filter((k) => k.debitorId === debitorFilter);
    }
    const query = search.trim();
    if (query) {
      result = result.filter((k) => matchesSearch(k, query));
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      const cmp = compareKontakte(a, b, sortColumn);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [kontakte, debitorFilter, search, sortColumn, sortDirection]);

  const debitorOptions = useMemo(
    () =>
      debitoren
        .map((debitor) => ({ id: debitor.id, name: debitor.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "de")),
    [debitoren],
  );

  const emptyMessage = useMemo(() => {
    const query = search.trim();
    if (query) return `Keine Treffer für "${query}".`;
    if (debitorFilter !== "alle") {
      const debitorName =
        debitorOptions.find((d) => d.id === debitorFilter)?.name ?? "diesem Debitor";
      return `Keine Kontakte für ${debitorName} vorhanden.`;
    }
    return "Noch keine Kontakte vorhanden.";
  }, [search, debitorFilter, debitorOptions]);

  const dialogDebitorId = editingKontakt?.debitorId ?? debitorOptions[0]?.id ?? 0;

  const visibleIds = useMemo(
    () => filteredKontakte.map((kontakt) => kontakt.id),
    [filteredKontakte],
  );

  const allVisibleMarked =
    visibleIds.length > 0 && visibleIds.every((id) => markedIds.has(id));
  const someVisibleMarked =
    visibleIds.some((id) => markedIds.has(id)) && !allVisibleMarked;

  function toggleRowMarked(id: number) {
    const next = new Set(markedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMarkedIds(next);
  }

  function toggleAllVisibleMarked() {
    const next = new Set(markedIds);
    if (allVisibleMarked) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setMarkedIds(next);
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kontakte</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kontakte zentral verwalten — suchen, filtern, bearbeiten und löschen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton
            kind="kontakte"
            allRows={kontakte}
            filteredRows={filteredKontakte}
            markedIds={markedIds}
            debitoren={debitoren}
          />
          <Button onClick={openCreate} disabled={debitorOptions.length === 0}>
            <Plus className="h-4 w-4" />
            Neu
          </Button>
        </div>
      </div>

      {!loading && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-md min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Suche in allen Spalten…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DebitorFilterSelect
            value={debitorFilter}
            onChange={setDebitorFilter}
            options={debitorOptions}
          />
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Kontakte werden geladen…</p>}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && filteredKontakte.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      )}

      {!loading && filteredKontakte.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleMarked}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleMarked;
                    }}
                    onChange={toggleAllVisibleMarked}
                    aria-label="Alle sichtbaren Kontakte markieren"
                    className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                  />
                </th>
                <SortableHeader
                  column="name"
                  label="Name"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="px-4 py-3 font-medium text-slate-600"
                />
                <SortableHeader
                  column="debitor"
                  label="Debitor"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="px-4 py-3 font-medium text-slate-600"
                />
                <SortableHeader
                  column="email"
                  label="E-Mail"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="px-4 py-3 font-medium text-slate-600"
                />
                <SortableHeader
                  column="telefon"
                  label="Telefon"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="px-4 py-3 font-medium text-slate-600"
                />
                <th className="px-4 py-3 text-right font-medium text-slate-600">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKontakte.map((kontakt) => (
                <tr key={kontakt.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={markedIds.has(kontakt.id)}
                      onChange={() => toggleRowMarked(kontakt.id)}
                      aria-label={`${kontaktDisplayName(kontakt)} markieren`}
                      className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {kontaktDisplayName(kontakt) || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{kontakt.debitorName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{kontakt.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{kontakt.telefon || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(kontakt)}
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {confirmId === kontakt.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Löschen?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === kontakt.id}
                            onClick={() => handleDelete(kontakt.id)}
                          >
                            Ja
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                            Nein
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setConfirmId(kontakt.id)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <KontaktDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debitorId={dialogDebitorId}
        debitorOptions={debitorOptions}
        kontakt={editingKontakt}
        onSave={handleSave}
      />
    </div>
  );
}
