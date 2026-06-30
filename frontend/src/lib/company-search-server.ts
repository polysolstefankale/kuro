import "server-only";

import { countryCode } from "@/lib/plz";
import type { CompanyAddressResult } from "@/lib/company-search";

const ZEFIX_BASE = "https://www.zefix.admin.ch/ZefixPublicREST/api/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_HEADERS = {
  "User-Agent": "Kuro-Debitor-App/1.0 (address lookup)",
};

interface ZefixCompanyShort {
  name: string;
  uid?: string;
  status?: string;
}

interface ZefixAddress {
  street?: string;
  houseNumber?: string;
  poBox?: string;
  city?: string;
  swissZipCode?: string;
}

interface ZefixCompanyFull {
  name: string;
  status?: string;
  address?: ZefixAddress;
}

interface NominatimResult {
  class?: string;
  type?: string;
  importance?: number;
  display_name?: string;
  extratags?: Record<string, string>;
  address?: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

function zefixAuthHeader(): string | null {
  const user = process.env.ZEFIX_USER?.trim();
  const password = process.env.ZEFIX_PASSWORD?.trim();
  if (!user || !password) return null;
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

function normalizeUid(uid: string): string {
  return uid.replace(/[.\-]/g, "");
}

function formatZefixStreet(address: ZefixAddress): string {
  const street = [address.street, address.houseNumber].filter(Boolean).join(" ");
  if (street) return street;
  if (address.poBox) return `Postfach ${address.poBox}`;
  return "";
}

function extractPhone(extratags?: Record<string, string>): string {
  if (!extratags) return "";

  return (
    extratags.phone ??
    extratags["contact:phone"] ??
    extratags["contact:mobile"] ??
    extratags["contact:telephone"] ??
    ""
  ).trim();
}

async function fetchPhoneFromNominatim(
  name: string,
  strasse: string,
  plz: string,
  ort: string,
  land: string,
): Promise<string> {
  const code = countryCode(land);
  if (!code) return "";

  const queries = [
    () => {
      const url = new URL(NOMINATIM_BASE);
      url.searchParams.set("format", "json");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("limit", "5");
      url.searchParams.set("countrycodes", code);
      if (strasse) url.searchParams.set("street", strasse);
      if (plz) url.searchParams.set("postalcode", plz);
      if (ort) url.searchParams.set("city", ort);
      url.searchParams.set("q", name);
      return url;
    },
    () => {
      const url = new URL(NOMINATIM_BASE);
      url.searchParams.set("q", [name, strasse, plz, ort].filter(Boolean).join(", "));
      url.searchParams.set("format", "json");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("limit", "5");
      url.searchParams.set("countrycodes", code);
      return url;
    },
  ];

  for (const buildUrl of queries) {
    const res = await fetch(buildUrl(), {
      headers: NOMINATIM_HEADERS,
      next: { revalidate: 0 },
    });

    if (!res.ok) continue;

    const data = (await res.json()) as NominatimResult[];
    for (const item of data) {
      const phone = extractPhone(item.extratags);
      if (phone) return phone;
    }
  }

  return "";
}

async function enrichWithPhone(
  result: CompanyAddressResult,
): Promise<CompanyAddressResult> {
  if (result.hauptnummer) return result;

  const hauptnummer = await fetchPhoneFromNominatim(
    result.name,
    result.strasse,
    result.plz,
    result.ort,
    result.land,
  );

  return hauptnummer ? { ...result, hauptnummer } : result;
}

async function enrichResultsWithPhone(
  results: CompanyAddressResult[],
): Promise<CompanyAddressResult[]> {
  const enriched: CompanyAddressResult[] = [];

  for (const result of results) {
    enriched.push(await enrichWithPhone(result));
  }

  return enriched;
}

function toZefixResult(company: ZefixCompanyFull, land: string): CompanyAddressResult | null {
  const address = company.address;
  if (!address?.swissZipCode || !address.city) return null;

  return {
    name: company.name,
    strasse: formatZefixStreet(address),
    plz: address.swissZipCode,
    ort: address.city,
    land,
  };
}

async function searchZefix(
  name: string,
  land: string,
): Promise<CompanyAddressResult[]> {
  const auth = zefixAuthHeader();
  if (!auth || land !== "Schweiz") return [];

  const searchRes = await fetch(`${ZEFIX_BASE}/company/search`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ name, activeOnly: true }),
    next: { revalidate: 0 },
  });

  if (!searchRes.ok) return [];

  const companies = (await searchRes.json()) as ZefixCompanyShort[];
  const active = companies.filter((c) => c.status === "ACTIVE" && c.uid).slice(0, 8);

  const results: CompanyAddressResult[] = [];
  const seen = new Set<string>();

  for (const company of active) {
    const uid = normalizeUid(company.uid!);
    const detailRes = await fetch(`${ZEFIX_BASE}/company/uid/${uid}`, {
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!detailRes.ok) continue;

    const details = (await detailRes.json()) as ZefixCompanyFull[];
    const full = details.find((d) => d.status === "ACTIVE") ?? details[0];
    if (!full) continue;

    const mapped = toZefixResult(full, land);
    if (!mapped) continue;

    const key = `${mapped.name}\0${mapped.strasse}\0${mapped.plz}\0${mapped.ort}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(mapped);
  }

  return enrichResultsWithPhone(results);
}

function nominatimOrt(address: NonNullable<NominatimResult["address"]>): string {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    ""
  );
}

function isCompanyLike(result: NominatimResult): boolean {
  const cls = result.class ?? "";
  const type = result.type ?? "";
  return (
    cls === "office" ||
    cls === "building" ||
    type === "company" ||
    type === "commercial" ||
    type === "industrial"
  );
}

async function searchNominatim(
  name: string,
  land: string,
): Promise<CompanyAddressResult[]> {
  const code = countryCode(land);
  if (!code) return [];

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("q", name);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "15");
  url.searchParams.set("countrycodes", code);

  const res = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as NominatimResult[];
  const ranked = [...data].sort((a, b) => {
    const aScore = (isCompanyLike(a) ? 10 : 0) + (a.importance ?? 0);
    const bScore = (isCompanyLike(b) ? 10 : 0) + (b.importance ?? 0);
    return bScore - aScore;
  });

  const results: CompanyAddressResult[] = [];
  const seen = new Set<string>();

  for (const item of ranked) {
    const address = item.address;
    if (!address?.postcode || !nominatimOrt(address)) continue;

    const strasse = [address.road, address.house_number].filter(Boolean).join(" ");
    const hauptnummer = extractPhone(item.extratags);
    const mapped: CompanyAddressResult = {
      name,
      strasse,
      plz: address.postcode,
      ort: nominatimOrt(address),
      land,
      ...(hauptnummer ? { hauptnummer } : {}),
    };

    const key = `${mapped.strasse}\0${mapped.plz}\0${mapped.ort}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(mapped);
    if (results.length >= 8) break;
  }

  return enrichResultsWithPhone(results);
}

export async function searchCompanyAddresses(
  name: string,
  land: string,
): Promise<CompanyAddressResult[]> {
  const query = name.trim();
  if (query.length < 3) return [];

  if (land === "Schweiz") {
    const zefixResults = await searchZefix(query, land);
    if (zefixResults.length > 0) return zefixResults;
  }

  return searchNominatim(query, land);
}
