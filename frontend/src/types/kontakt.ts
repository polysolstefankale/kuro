export interface Kontakt {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  debitorId: number;
  debitorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KontaktFormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  debitorId: number;
}

export const emptyKontaktForm = (debitorId: number): KontaktFormData => ({
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  debitorId,
});

export function kontaktDisplayName(kontakt: Kontakt): string {
  return [kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ");
}
