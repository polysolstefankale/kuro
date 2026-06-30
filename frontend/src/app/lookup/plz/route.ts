import { NextResponse } from "next/server";
import {
  buildPostalCodeQuery,
  countryCode,
  dedupeLocalities,
  type PlzLocality,
} from "@/lib/plz";

/** @deprecated Use /lookup/locality instead */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const land = searchParams.get("land");
  const postalCode = searchParams.get("postalCode")?.trim();

  if (!land || !postalCode) {
    return NextResponse.json(
      { error: "land und postalCode sind erforderlich" },
      { status: 400 },
    );
  }

  const code = countryCode(land);
  if (!code) {
    return NextResponse.json([]);
  }

  try {
    const url = new URL(`https://openplzapi.org/${code}/Localities`);
    url.searchParams.set("postalCode", buildPostalCodeQuery(land, postalCode));
    url.searchParams.set("pageSize", "50");

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as PlzLocality[];
    return NextResponse.json(dedupeLocalities(data));
  } catch {
    return NextResponse.json([]);
  }
}
