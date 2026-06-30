export const LAND_OPTIONS = [
  { value: "Schweiz", label: "Schweiz" },
  { value: "Deutschland", label: "Deutschland" },
  { value: "Österreich", label: "Österreich" },
  { value: "Liechtenstein", label: "Liechtenstein" },
] as const;

export const KNOWN_LANDS = LAND_OPTIONS.map((o) => o.value);

const COUNTRY_CODES: Record<string, string> = {
  Schweiz: "ch",
  Deutschland: "de",
  Österreich: "at",
  Liechtenstein: "li",
};

const PLZ_LENGTH: Record<string, number> = {
  Schweiz: 4,
  Deutschland: 5,
  Österreich: 4,
  Liechtenstein: 4,
};

export function isKnownLand(land: string): boolean {
  return KNOWN_LANDS.includes(land as (typeof KNOWN_LANDS)[number]);
}

export function countryCode(land: string): string | undefined {
  return COUNTRY_CODES[land];
}

export interface PlzLocality {
  postalCode: string;
  name: string;
  canton?: { shortName: string };
}

export function supportsPlzLookup(land: string): boolean {
  return isKnownLand(land);
}

export function minSearchLength(): number {
  return 2;
}

/** OpenPLZ expects ^prefix for partial PLZ; plain digits match anywhere in the code. */
export function buildPostalCodeQuery(land: string, postalCode: string): string {
  const fullLen = PLZ_LENGTH[land] ?? 4;
  if (postalCode.length >= fullLen) {
    return postalCode;
  }
  return `^${postalCode}`;
}

/** Partial locality name — OpenPLZ matches from the start of the name. */
export function buildNameQuery(name: string): string {
  return `^${name}`;
}

export function dedupeLocalities(localities: PlzLocality[]): PlzLocality[] {
  const seen = new Set<string>();
  const result: PlzLocality[] = [];

  for (const loc of localities) {
    const key = `${loc.postalCode}\0${loc.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(loc);
  }

  return result.sort((a, b) =>
    a.postalCode === b.postalCode
      ? a.name.localeCompare(b.name, "de")
      : a.postalCode.localeCompare(b.postalCode),
  );
}
