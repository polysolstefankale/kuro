export type DebitorStatus = "Aktiv" | "Inaktiv";

export interface Debitor {
  id: number;
  debitorNummer: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  umsatz: number;
  waehrung: string;
  status: DebitorStatus;
  hauptnummer: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DebitorFormData {
  debitorNummer: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  umsatz: number;
  waehrung: string;
  status: DebitorStatus;
  hauptnummer: string;
}

export const emptyDebitorForm = (): DebitorFormData => ({
  debitorNummer: "",
  name: "",
  strasse: "",
  plz: "",
  ort: "",
  land: "Schweiz",
  umsatz: 0,
  waehrung: "CHF",
  status: "Aktiv",
  hauptnummer: "",
});
