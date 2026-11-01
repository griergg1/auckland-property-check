import { NextResponse } from "next/server";
import { AddressSearchRequest, AddressSearchResponse } from "@/lib/schemas";

// PoC: demo address fixtures. Real implementation will query LINZ NZ Addresses.
const DEMO_ADDRESSES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    label: "17 Shanaway Rise, Hillcrest, Auckland (DEMO)",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    label: "144 Hobsonville Road, Hobsonville, Auckland (DEMO)",
  },
];

export async function POST(request: Request) {
  const body = AddressSearchRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const q = body.data.query.toLowerCase();
  const matches = DEMO_ADDRESSES.filter((a) =>
    a.label.toLowerCase().includes(q),
  );
  return NextResponse.json(AddressSearchResponse.parse({
    candidates: matches,
    isDemo: true,
  }));
}
