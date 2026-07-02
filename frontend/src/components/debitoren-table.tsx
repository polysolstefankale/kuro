"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Debitor } from "@/types/debitor";
import { CountryFlag } from "@/components/country-flag";
import { KontaktePanel } from "@/components/kontakte-panel";
import { formatUmsatz } from "@/lib/waehrung";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SortColumn = "debitorNummer" | "name" | "land" | "ort" | "umsatz" | "status";
type SortDirection = "asc" | "desc";

interface DebitorenTableProps {
  debitoren: Debitor[];
  focusDebitorId?: number | null;
  markedIds: ReadonlySet<number>;
  onMarkedIdsChange: (ids: Set<number>) => void;
  emptyMessage?: string;
  showEmptyHint?: boolean;
  onEdit: (debitor: Debitor) => void;
  onDelete: (id: number) => Promise<void>;
}

function compareDebitoren(
  a: Debitor,
  b: Debitor,
  column: SortColumn,
): number {
  switch (column) {
    case "debitorNummer":
      return a.debitorNummer.localeCompare(b.debitorNummer, "de", {
        numeric: true,
      });
    case "name":
      return a.name.localeCompare(b.name, "de");
    case "land":
      return a.land.localeCompare(b.land, "de");
    case "ort": {
      const ortA = [a.plz, a.ort].filter(Boolean).join(" ");
      const ortB = [b.plz, b.ort].filter(Boolean).join(" ");
      return ortA.localeCompare(ortB, "de", { numeric: true });
    }
    case "umsatz":
      return a.umsatz - b.umsatz;
    case "status":
      return a.status.localeCompare(b.status, "de");
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

export function DebitorenTable({
  debitoren,
  focusDebitorId = null,
  markedIds,
  onMarkedIdsChange,
  emptyMessage = "Noch keine Debitoren vorhanden.",
  showEmptyHint = true,
  onEdit,
  onDelete,
}: DebitorenTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("debitorNummer");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedDebitorId, setExpandedDebitorId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const lastFocusedId = useRef<number | null>(null);

  function toggleKontakte(debitorId: number) {
    setExpandedDebitorId((current) => (current === debitorId ? null : debitorId));
  }

  useEffect(() => {
    if (!focusDebitorId) return;
    if (!debitoren.some((d) => d.id === focusDebitorId)) return;
    if (lastFocusedId.current === focusDebitorId) return;

    lastFocusedId.current = focusDebitorId;
    setExpandedDebitorId(focusDebitorId);
    setHighlightedId(focusDebitorId);

    requestAnimationFrame(() => {
      rowRefs.current
        .get(focusDebitorId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const timer = window.setTimeout(() => setHighlightedId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [focusDebitorId, debitoren]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sortedDebitoren = useMemo(() => {
    const copy = [...debitoren];
    copy.sort((a, b) => {
      const cmp = compareDebitoren(a, b, sortColumn);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [debitoren, sortColumn, sortDirection]);

  const visibleIds = useMemo(
    () => sortedDebitoren.map((debitor) => debitor.id),
    [sortedDebitoren],
  );

  const allVisibleMarked =
    visibleIds.length > 0 && visibleIds.every((id) => markedIds.has(id));
  const someVisibleMarked =
    visibleIds.some((id) => markedIds.has(id)) && !allVisibleMarked;

  function toggleRowMarked(id: number) {
    const next = new Set(markedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onMarkedIdsChange(next);
  }

  function toggleAllVisibleMarked() {
    const next = new Set(markedIds);
    if (allVisibleMarked) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    onMarkedIdsChange(next);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (debitoren.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
        {showEmptyHint && (
          <p className="mt-1 text-sm text-slate-400">
            Legen Sie den ersten Debitor über den Button Neu an.
          </p>
        )}
      </div>
    );
  }

  return (
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
                aria-label="Alle sichtbaren Debitoren markieren"
                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
              />
            </th>
            <SortableHeader
              column="debitorNummer"
              label="Nummer"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="px-4 py-3 font-medium text-slate-600"
            />
            <SortableHeader
              column="name"
              label="Name"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="px-4 py-3 font-medium text-slate-600"
            />
            <SortableHeader
              column="land"
              label="Land"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="w-14 px-4 py-3 font-medium text-slate-600"
            />
            <SortableHeader
              column="ort"
              label="Ort"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="px-4 py-3 font-medium text-slate-600"
            />
            <SortableHeader
              column="umsatz"
              label="Umsatz"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="px-4 py-3 text-right font-medium text-slate-600 [&>button]:ml-auto"
            />
            <SortableHeader
              column="status"
              label="Status"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="px-4 py-3 font-medium text-slate-600"
            />
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedDebitoren.map((debitor) => (
            <Fragment key={debitor.id}>
              <tr
                ref={(el) => {
                  if (el) rowRefs.current.set(debitor.id, el);
                  else rowRefs.current.delete(debitor.id);
                }}
                className={cn(
                  "hover:bg-slate-50",
                  highlightedId === debitor.id &&
                    "bg-blue-50 ring-2 ring-inset ring-blue-400",
                )}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={markedIds.has(debitor.id)}
                    onChange={() => toggleRowMarked(debitor.id)}
                    aria-label={`${debitor.name} markieren`}
                    className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {debitor.debitorNummer}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {debitor.name}
                </td>
                <td className="px-4 py-3">
                  {debitor.land ? (
                    <CountryFlag land={debitor.land} />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {[debitor.plz, debitor.ort].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                  {formatUmsatz(debitor.umsatz, debitor.waehrung || "CHF")}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      debitor.status === "Aktiv" ? "aktiv" : "inaktiv"
                    }
                  >
                    {debitor.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKontakte(debitor.id)}
                      title="Kontakte anzeigen"
                      aria-expanded={expandedDebitorId === debitor.id}
                    >
                      {expandedDebitorId === debitor.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(debitor)}
                      title="Bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {confirmId === debitor.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">Löschen?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === debitor.id}
                          onClick={() => handleDelete(debitor.id)}
                        >
                          Ja
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Nein
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setConfirmId(debitor.id)}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
              {expandedDebitorId === debitor.id && (
                <tr>
                  <td colSpan={8} className="bg-slate-50 px-4 py-4">
                    <KontaktePanel debitorId={debitor.id} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
