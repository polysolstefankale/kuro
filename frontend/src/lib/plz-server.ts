import "server-only";

import {
  buildNameQuery,
  buildPostalCodeQuery,
  countryCode,
  dedupeLocalities,
  type PlzLocality,
} from "@/lib/plz";

export async function fetchOpenPlzLocalities(
  land: string,
  params: { postalCode?: string; name?: string },
): Promise<PlzLocality[]> {
  const code = countryCode(land);
  if (!code) return [];

  const url = new URL(`https://openplzapi.org/${code}/Localities`);
  url.searchParams.set("pageSize", "50");

  if (params.postalCode) {
    url.searchParams.set(
      "postalCode",
      buildPostalCodeQuery(land, params.postalCode),
    );
  }
  if (params.name) {
    url.searchParams.set("name", buildNameQuery(params.name));
  }

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];

  const data = (await res.json()) as PlzLocality[];
  return dedupeLocalities(data);
}
