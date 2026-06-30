export const STANDORT_OPTIONS = [
  { value: "SR", label: "SR" },
  { value: "SS", label: "SS" },
  { value: "SO", label: "SO" },
  { value: "SB", label: "SB" },
] as const;

export type KontaktStandort = (typeof STANDORT_OPTIONS)[number]["value"];

export interface Kontakt {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  standort: KontaktStandort;
  debitorId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KontaktFormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  standort: KontaktStandort;
  debitorId: number;
}

export const emptyKontaktForm = (debitorId: number): KontaktFormData => ({
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  standort: "SR",
  debitorId,
});

export function kontaktDisplayName(kontakt: Kontakt): string {
  return [kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ");
}
