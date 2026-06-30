import { NextResponse } from "next/server";
import { countryCode, minSearchLength } from "@/lib/plz";
import { fetchOpenPlzLocalities } from "@/lib/plz-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const land = searchParams.get("land");
  const postalCode = searchParams.get("postalCode")?.trim();
  const name = searchParams.get("name")?.trim();

  if (!land || (!postalCode && !name)) {
    return NextResponse.json(
      { error: "land und postalCode oder name sind erforderlich" },
      { status: 400 },
    );
  }

  if (!countryCode(land)) {
    return NextResponse.json([]);
  }

  if (
    (postalCode && postalCode.length < minSearchLength()) ||
    (name && name.length < minSearchLength())
  ) {
    return NextResponse.json([]);
  }

  try {
    const data = await fetchOpenPlzLocalities(land, { postalCode, name });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
