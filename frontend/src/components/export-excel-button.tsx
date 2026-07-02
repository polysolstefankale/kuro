"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import type { Debitor } from "@/types/debitor";
import type { Kontakt } from "@/types/kontakt";
import {
  DEBITOR_EXPORT_COLUMNS,
  defaultSelectedColumnIds,
  KONTAKT_EXPORT_COLUMNS,
} from "@/lib/export-columns";
import { exportDebitorenToExcel, exportKontakteToExcel } from "@/lib/export-excel";
import {
  DEFAULT_EXPORT_ROW_SCOPE,
  resolveExportRows,
  type ExportRowScope,
} from "@/lib/export-rows";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ExportExcelButtonProps =
  | {
      kind: "debitoren";
      allRows: Debitor[];
      filteredRows: Debitor[];
      markedIds: ReadonlySet<number>;
    }
  | {
      kind: "kontakte";
      allRows: Kontakt[];
      filteredRows: Kontakt[];
      markedIds: ReadonlySet<number>;
      debitoren?: Debitor[];
    };

export function ExportExcelButton(props: ExportExcelButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowScope, setRowScope] = useState<ExportRowScope>(DEFAULT_EXPORT_ROW_SCOPE);

  const columns =
    props.kind === "debitoren" ? DEBITOR_EXPORT_COLUMNS : KONTAKT_EXPORT_COLUMNS;

  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(
    defaultSelectedColumnIds(columns),
  );

  const exportRows = useMemo(
    () =>
      resolveExportRows(
        props.allRows,
        props.filteredRows,
        props.markedIds,
        rowScope,
      ),
    [props.allRows, props.filteredRows, props.markedIds, rowScope],
  );

  const markedCount = props.markedIds.size;
  const filteredCount = props.filteredRows.length;

  useEffect(() => {
    if (dialogOpen) {
      setSelectedColumnIds(defaultSelectedColumnIds(columns));
      setRowScope(DEFAULT_EXPORT_ROW_SCOPE);
      setError(null);
    }
  }, [dialogOpen, columns]);

  const canExport = filteredCount > 0 || markedCount > 0;

  function toggleColumn(id: string) {
    setSelectedColumnIds((current) =>
      current.includes(id)
        ? current.filter((columnId) => columnId !== id)
        : [...current, id],
    );
  }

  function selectAllColumns() {
    setSelectedColumnIds(defaultSelectedColumnIds(columns));
  }

  function selectNoColumns() {
    setSelectedColumnIds([]);
  }

  function handleExport() {
    if (!rowScope.includeFiltered && !rowScope.includeMarked) {
      setError("Bitte mindestens eine Datenquelle auswählen.");
      return;
    }

    if (selectedColumnIds.length === 0) {
      setError("Bitte mindestens eine Spalte auswählen.");
      return;
    }

    if (exportRows.length === 0) {
      setError("Keine Datensätze für den gewählten Exportumfang vorhanden.");
      return;
    }

    setExporting(true);
    setError(null);
    try {
      if (props.kind === "debitoren") {
        exportDebitorenToExcel(exportRows, selectedColumnIds);
      } else {
        exportKontakteToExcel(
          exportRows,
          props.debitoren ?? [],
          selectedColumnIds,
        );
      }
      setDialogOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Excel-Export fehlgeschlagen",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          disabled={!canExport}
          title={
            props.kind === "debitoren"
              ? "Debitoren als Excel-Datei exportieren"
              : "Kontakte als Excel-Datei exportieren"
          }
        >
          <FileSpreadsheet className="h-4 w-4" />
          Excel exportieren
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Excel-Export"
        description="Datensätze und Spalten für den Export festlegen."
        className="max-w-xl"
      >
        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-800">Datensätze</h3>
            <p className="text-xs text-slate-500">
              {filteredCount} gefiltert, {markedCount} markiert — Vorschau:{" "}
              {exportRows.length} Datensätze
            </p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={rowScope.includeFiltered}
                  onChange={(e) =>
                    setRowScope((current) => ({
                      ...current,
                      includeFiltered: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                />
                <span className="text-slate-700">Gefilterte Datensätze</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={rowScope.includeMarked}
                  onChange={(e) =>
                    setRowScope((current) => ({
                      ...current,
                      includeMarked: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                />
                <span className="text-slate-700">Markierte Datensätze</span>
              </label>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-800">Spalten</h3>
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={selectAllColumns}
                className="text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Alle auswählen
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={selectNoColumns}
                className="text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Keine auswählen
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {columns.map((column) => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumnIds.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                  />
                  <span className="text-slate-700">{column.label}</span>
                </label>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={exporting}
            >
              Abbrechen
            </Button>
            <Button type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exportiere…" : "Exportieren"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
