export interface CompanyAddressResult {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  hauptnummer?: string;
}

export const COMPANY_SEARCH_MIN_LENGTH = 3;
