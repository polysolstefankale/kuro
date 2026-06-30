import { NextResponse } from "next/server";
import { fetchExchangeRatesToChf } from "@/lib/exchange-rates-server";

export async function GET() {
  try {
    const rates = await fetchExchangeRatesToChf();
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json(
      { error: "Wechselkurse konnten nicht geladen werden" },
      { status: 502 },
    );
  }
}
