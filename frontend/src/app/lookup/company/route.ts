import { NextResponse } from "next/server";
import { COMPANY_SEARCH_MIN_LENGTH } from "@/lib/company-search";
import { searchCompanyAddresses } from "@/lib/company-search-server";
import { countryCode } from "@/lib/plz";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const land = searchParams.get("land")?.trim();

  if (!name || !land) {
    return NextResponse.json(
      { error: "name und land sind erforderlich" },
      { status: 400 },
    );
  }

  if (!countryCode(land)) {
    return NextResponse.json([]);
  }

  if (name.length < COMPANY_SEARCH_MIN_LENGTH) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchCompanyAddresses(name, land);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
