import * as XLSX from "xlsx";
import type { Debitor } from "@/types/debitor";
import type { Kontakt } from "@/types/kontakt";
import {
  buildExportRows,
  DEBITOR_EXPORT_COLUMNS,
  KONTAKT_EXPORT_COLUMNS,
  toKontaktExportRows,
} from "@/lib/export-columns";

function datedFileName(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.xlsx`;
}

function writeSheet(
  rows: Record<string, string | number>[],
  sheetName: string,
  fileName: string,
): void {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

export function exportDebitorenToExcel(
  debitoren: Debitor[],
  selectedColumnIds: string[],
): void {
  const rows = buildExportRows(debitoren, DEBITOR_EXPORT_COLUMNS, selectedColumnIds);
  writeSheet(rows, "Debitoren", datedFileName("kuro-debitoren"));
}

export function exportKontakteToExcel(
  kontakte: Kontakt[],
  debitoren: Debitor[],
  selectedColumnIds: string[],
): void {
  const exportRows = toKontaktExportRows(kontakte, debitoren);
  const rows = buildExportRows(exportRows, KONTAKT_EXPORT_COLUMNS, selectedColumnIds);
  writeSheet(rows, "Kontakte", datedFileName("kuro-kontakte"));
}
