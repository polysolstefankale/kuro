import type { Debitor } from "@/types/debitor";
import type { Kontakt } from "@/types/kontakt";

export interface ExportColumnDef<T> {
  id: string;
  label: string;
  getValue: (row: T) => string | number;
}

export const DEBITOR_EXPORT_COLUMNS: ExportColumnDef<Debitor>[] = [
  { id: "nummer", label: "Nummer", getValue: (d) => d.debitorNummer },
  { id: "name", label: "Name", getValue: (d) => d.name },
  { id: "strasse", label: "Strasse", getValue: (d) => d.strasse },
  { id: "plz", label: "PLZ", getValue: (d) => d.plz },
  { id: "ort", label: "Ort", getValue: (d) => d.ort },
  { id: "land", label: "Land", getValue: (d) => d.land },
  { id: "umsatz", label: "Umsatz", getValue: (d) => d.umsatz },
  { id: "waehrung", label: "Währung", getValue: (d) => d.waehrung },
  { id: "status", label: "Status", getValue: (d) => d.status },
  { id: "hauptnummer", label: "Hauptnummer", getValue: (d) => d.hauptnummer },
];

export interface KontaktExportRow extends Kontakt {
  debitorNummer: string;
}

export function toKontaktExportRows(
  kontakte: Kontakt[],
  debitoren: Debitor[],
): KontaktExportRow[] {
  const debitorNummerById = new Map(
    debitoren.map((debitor) => [debitor.id, debitor.debitorNummer]),
  );

  return kontakte.map((kontakt) => ({
    ...kontakt,
    debitorNummer: debitorNummerById.get(kontakt.debitorId) ?? "",
  }));
}

export const KONTAKT_EXPORT_COLUMNS: ExportColumnDef<KontaktExportRow>[] = [
  { id: "vorname", label: "Vorname", getValue: (k) => k.vorname },
  { id: "nachname", label: "Nachname", getValue: (k) => k.nachname },
  { id: "email", label: "E-Mail", getValue: (k) => k.email },
  { id: "telefon", label: "Telefon", getValue: (k) => k.telefon },
  { id: "debitor", label: "Debitor", getValue: (k) => k.debitorName ?? "" },
  {
    id: "debitorNummer",
    label: "Debitor-Nummer",
    getValue: (k) => k.debitorNummer,
  },
];

export function defaultSelectedColumnIds<T>(columns: ExportColumnDef<T>[]): string[] {
  return columns.map((column) => column.id);
}

export function buildExportRows<T>(
  rows: T[],
  columns: ExportColumnDef<T>[],
  selectedIds: string[],
): Record<string, string | number>[] {
  const selected = columns.filter((column) => selectedIds.includes(column.id));
  return rows.map((row) =>
    Object.fromEntries(
      selected.map((column) => [column.label, column.getValue(row)]),
    ),
  );
}
