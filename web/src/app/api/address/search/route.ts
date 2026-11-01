import { NextResponse } from "next/server";
import { AddressSearchRequest, AddressSearchResponse } from "@/lib/schemas";
import { searchAddresses } from "@/lib/linz";

export async function POST(request: Request) {
  const body = AddressSearchRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    const found = await searchAddresses(body.data.query);
    const candidates = found.map((c) => ({ ...c, isDemo: false }));
    return NextResponse.json(AddressSearchResponse.parse({
      candidates,
      isDemo: false,
    }));
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "search failed" }, { status: 500 });
  }
}
