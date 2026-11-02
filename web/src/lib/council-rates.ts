import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Auckland Council public rate-assessment API.
// Source: https://experience.aucklandcouncil.govt.nz/nextapi/property
// Auth: public browser bearer token extracted from the council's own rates-search page.
// No user credentials, no API key, no login. This is the same API the council's
// own public "Find your property rates or valuation" page calls.
//
// We cache the rate-assessment per ACRateAccountKey for 7 days (valuations change
// triennially, rates annually). We cache the public bearer token until its JWT
// exp (minus a 5-minute margin), falling back to 30 minutes if undecodable.

const SEARCH_PAGE =
  "https://www.aucklandcouncil.govt.nz/en/property-rates-valuations/find-property-rates-valuation.html";
const PROPERTY_API =
  "https://experience.aucklandcouncil.govt.nz/nextapi/property";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

const CACHE_TTL_DAYS = 7;
const TOKEN_FALLBACK_TTL_MS = 30 * 60 * 1000;
const TOKEN_MARGIN_MS = 5 * 60 * 1000;

export type RatingValuation = {
  acRateAccountKey: string;
  address: string;
  capitalValue: number | null;
  landValue: number | null;
  improvementValue: number | null;
  annualRates: number | null;
  valuationNumber: string | null;
  landAreaM2: number | null;
  totalFloorAreaM2: number | null;
  buildingSiteCoverageM2: number | null;
  landUseDescription: string | null;
  localBoard: string | null;
  propertyCategory: string | null;
  legalDescription: string | null;
  fetchedAt: string;
};

function parseMoney(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!isFinite(n)) return null;
  return Math.round(n);
}

function parseAreaInt(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  if (!isFinite(n)) return null;
  return Math.round(n);
}

function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as any;
    if (typeof payload?.exp === "number") return payload.exp * 1000;
    return null;
  } catch {
    return null;
  }
}

async function getCachedToken(
  sb: SupabaseClient,
): Promise<string | null> {
  const { data } = await sb
    .from("council_api_token")
    .select("token, expires_at")
    .eq("id", 1)
    .maybeSingle();
  if (data?.token && data.expires_at) {
    const exp = new Date(data.expires_at).getTime();
    if (exp > Date.now() + 60_000) return data.token as string;
  }
  return null;
}

async function fetchFreshToken(): Promise<string> {
  const res = await fetch(SEARCH_PAGE, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`council search page ${res.status}`);
  const html = await res.text();
  const m = html.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (!m) throw new Error("council public bearer token not found on search page");
  return m[0];
}

async function storeToken(sb: SupabaseClient, token: string): Promise<void> {
  const expMs = decodeJwtExp(token);
  const expiresAt = expMs
    ? new Date(expMs - TOKEN_MARGIN_MS).toISOString()
    : new Date(Date.now() + TOKEN_FALLBACK_TTL_MS).toISOString();
  await sb.from("council_api_token").upsert({
    id: 1,
    token,
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
}

async function getToken(sb: SupabaseClient): Promise<string> {
  const cached = await getCachedToken(sb);
  if (cached) return cached;
  const fresh = await fetchFreshToken();
  await storeToken(sb, fresh);
  return fresh;
}

function apiHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    Origin: "https://www.aucklandcouncil.govt.nz",
    Referer: SEARCH_PAGE,
    "User-Agent": UA,
  };
}

export function normalizeAddress(a: string): string {
  return a
    .toLowerCase()
    .replace(/,?\s*auckland\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

type AddressSearchItem = {
  id?: string;
  acRateAccountKey?: string;
  ACRateAccountKey?: string;
  address?: string;
  suggestion?: string;
};

async function resolvePropertyId(
  sb: SupabaseClient,
  token: string,
  addressLabel: string,
): Promise<{ acRateAccountKey: string; matchedAddress: string } | null> {
  const norm = normalizeAddress(addressLabel);
  const url = `${PROPERTY_API}?query=${encodeURIComponent(norm)}&pageSize=20`;
  const res = await fetch(url, { headers: apiHeaders(token) });
  if (!res.ok) throw new Error(`council address search ${res.status}`);
  const data = (await res.json()) as AddressSearchItem[] | { items?: AddressSearchItem[] } | null;
  const items: AddressSearchItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.items)
      ? (data as any).items
      : [];
  if (items.length === 0) return null;
  // Prefer an exact-ish match on the normalized address; else take the first.
  const target = norm;
  const exact = items.find((it) => {
    const cand = normalizeAddress(it.address ?? it.suggestion ?? "");
    return cand === target || cand.startsWith(target) || target.startsWith(cand);
  });
  const pick = exact ?? items[0];
  const key = pick.acRateAccountKey ?? pick.ACRateAccountKey ?? pick.id;
  if (!key) return null;
  return { acRateAccountKey: String(key), matchedAddress: pick.address ?? pick.suggestion ?? addressLabel };
}

type RateAssessmentResponse = {
  capitalValue?: string | number;
  landValue?: string | number;
  valueOfImprovements?: string | number;
  totalRates?: string | number;
  valuationNumber?: string;
  rateAccountKey?: string;
  area?: string | number;
  totalFloorArea?: string | number;
  buildingSiteCoverage?: string | number;
  landUseDescription?: string;
  localBoard?: string;
  propertyCategory?: string;
  legalDescription?: string;
};

async function fetchRateAssessment(
  token: string,
  acRateAccountKey: string,
): Promise<RateAssessmentResponse> {
  const url = `${PROPERTY_API}/${acRateAccountKey}/rate-assessment`;
  const res = await fetch(url, { headers: apiHeaders(token) });
  if (!res.ok) throw new Error(`council rate-assessment ${res.status}`);
  return (await res.json()) as RateAssessmentResponse;
}

function rowFromApi(
  key: string,
  matchedAddress: string,
  raw: RateAssessmentResponse,
): Record<string, unknown> {
  return {
    ac_rate_account_key: key,
    address: matchedAddress,
    capital_value: parseMoney(raw.capitalValue),
    land_value: parseMoney(raw.landValue),
    improvement_value: parseMoney(raw.valueOfImprovements),
    annual_rates: parseMoney(raw.totalRates),
    valuation_number: raw.valuationNumber ?? null,
    land_area_m2: parseAreaInt(raw.area as any),
    total_floor_area_m2: parseAreaInt(raw.totalFloorArea as any),
    building_site_coverage_m2: parseAreaInt(raw.buildingSiteCoverage as any),
    land_use_description: raw.landUseDescription ?? null,
    local_board: raw.localBoard ?? null,
    property_category: raw.propertyCategory ?? null,
    legal_description: raw.legalDescription ?? null,
    raw: raw as any,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function valuationFromRow(r: any): RatingValuation {
  return {
    acRateAccountKey: r.ac_rate_account_key,
    address: r.address,
    capitalValue: r.capital_value,
    landValue: r.land_value,
    improvementValue: r.improvement_value,
    annualRates: r.annual_rates,
    valuationNumber: r.valuation_number,
    landAreaM2: r.land_area_m2,
    totalFloorAreaM2: r.total_floor_area_m2,
    buildingSiteCoverageM2: r.building_site_coverage_m2,
    landUseDescription: r.land_use_description,
    localBoard: r.local_board,
    propertyCategory: r.property_category,
    legalDescription: r.legal_description,
    fetchedAt: r.fetched_at,
  };
}

export async function getRatingValuation(
  sb: SupabaseClient,
  addressLabel: string,
): Promise<RatingValuation | null> {
  const norm = normalizeAddress(addressLabel);

  // 1. Cache lookup by address (covers the common re-run case without an ID round-trip).
  const { data: cachedByAddr } = await sb
    .from("rating_valuation_cache")
    .select("*")
    .ilike("address", `%${norm}%`)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (cachedByAddr) return valuationFromRow(cachedByAddr);

  // 2. Resolve address → ACRateAccountKey, then check cache by key.
  const token = await getToken(sb);
  const resolved = await resolvePropertyId(sb, token, addressLabel);
  if (!resolved) return null;

  const { data: cachedByKey } = await sb
    .from("rating_valuation_cache")
    .select("*")
    .eq("ac_rate_account_key", resolved.acRateAccountKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (cachedByKey) return valuationFromRow(cachedByKey);

  // 3. Fetch fresh and cache.
  const raw = await fetchRateAssessment(token, resolved.acRateAccountKey);
  const row = rowFromApi(resolved.acRateAccountKey, resolved.matchedAddress, raw);
  const { error } = await sb.from("rating_valuation_cache").upsert(row, { onConflict: "ac_rate_account_key" });
  if (error) {
    // Cache write failure is non-fatal — we still return the value we fetched.
    console.warn("rating_valuation_cache upsert failed:", error.message);
  }
  return valuationFromRow(row);
}

export function propertyPageUrl(acRateAccountKey: string): string {
  return `https://www.aucklandcouncil.govt.nz/en/property-rates-valuations/find-property-rates-valuation/${acRateAccountKey}.html`;
}
