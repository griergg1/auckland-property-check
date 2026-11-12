"use client";

type Stamp = { text: string; tone: "on" | "off" | "quiet" };

type Props = {
  address: string | null;
  sourceParcelId: string | null;
  areaM2: number | null;
  geometry: GeoJSON.Geometry | null;
  evidence: GeoJSON.Geometry[];
  capitalValue: number | null;
  landValue: number | null;
  annualRates: number | null;
  floorAreaM2: number | null;
  councilLandAreaM2: number | null;
  valuationAvailable: boolean;
  zone: string | null;
  schools: string[];
  stamps: Stamp[];
  retrievedLabel: string | null;
  sourceUrl: string | null;
  limitations: string | null;
};

const SERIF = "var(--font-newsreader), Newsreader, Georgia, serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function money(n: number | null): string {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("en-NZ");
}

function area(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("en-NZ")} m²`;
}

/** "10 Orion Place, Hillcrest, Auckland" → street + suburb. */
function splitAddress(address: string | null): { street: string; suburb: string | null } {
  if (!address) return { street: "This property", suburb: null };
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0] ?? address;
  const suburb = parts.find((p, i) => i > 0 && !/^auckland$/i.test(p)) ?? null;
  return { street, suburb };
}

type XY = { x: number; y: number };

function walkCoords(geom: GeoJSON.Geometry | null, visit: (c: number[]) => void) {
  if (!geom) return;
  const g = geom as GeoJSON.Geometry;
  if (g.type === "Point") visit(g.coordinates);
  else if (g.type === "MultiPoint" || g.type === "LineString") g.coordinates.forEach(visit);
  else if (g.type === "MultiLineString" || g.type === "Polygon") g.coordinates.forEach((ring) => ring.forEach(visit));
  else if (g.type === "MultiPolygon") g.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(visit)));
  else if (g.type === "GeometryCollection") g.geometries.forEach((child) => walkCoords(child, visit));
}

function pathFor(geom: GeoJSON.Geometry, project: (c: number[]) => XY): string {
  const ring = (coords: number[][]) =>
    coords
      .map((c, i) => {
        const p = project(c);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ");
  if (geom.type === "LineString") return ring(geom.coordinates);
  if (geom.type === "MultiLineString") return geom.coordinates.map(ring).join(" ");
  if (geom.type === "Polygon") return geom.coordinates.map((r) => ring(r) + " Z").join(" ");
  if (geom.type === "MultiPolygon")
    return geom.coordinates.map((poly) => poly.map((r) => ring(r) + " Z").join(" ")).join(" ");
  if (geom.type === "GeometryCollection") return geom.geometries.map((g) => pathFor(g, project)).join(" ");
  return "";
}

function ParcelDrawing({
  geometry,
  evidence,
}: {
  geometry: GeoJSON.Geometry | null;
  evidence: GeoJSON.Geometry[];
}) {
  const pts: number[][] = [];
  walkCoords(geometry, (c) => pts.push(c));
  if (pts.length < 3) {
    return (
      <svg viewBox="0 0 520 460" className="h-auto w-full" role="img" aria-label="Parcel outline unavailable">
        <rect width="520" height="460" fill="#E7F2F0" />
        <text x="36" y="230" fill="#3F5A64" fontFamily={MONO} fontSize="12" letterSpacing="1.2">
          PARCEL OUTLINE UNAVAILABLE
        </text>
      </svg>
    );
  }

  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const xs = pts.map((p) => p[0] * cos);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dataW = maxX - minX || 1;
  const dataH = maxY - minY || 1;
  const pad = 48;
  const availW = 520 - pad * 2;
  const availH = 460 - pad * 2;
  const scale = Math.min(availW / dataW, availH / dataH);
  const drawnW = dataW * scale;
  const drawnH = dataH * scale;
  const ox = pad + (availW - drawnW) / 2;
  const oy = pad + (availH - drawnH) / 2;

  const project = (c: number[]): XY => ({
    x: ox + ((c[0] * cos - minX) / dataW) * drawnW,
    y: oy + drawnH - ((c[1] - minY) / dataH) * drawnH,
  });

  const parcelPath = geometry ? pathFor(geometry, project) : "";
  const evidencePaths = evidence
    .map((g) => pathFor(g, project))
    .filter((d) => d.length > 0);

  return (
    <svg viewBox="0 0 520 460" className="h-auto w-full" role="img" aria-label="Parcel outline, north up">
      <rect width="520" height="460" fill="#E7F2F0" />
      <text x="28" y="32" fill="#163038" fontFamily={MONO} fontSize="13" letterSpacing="1.4">
        N
      </text>
      <line x1="33" y1="38" x2="33" y2="58" stroke="#163038" strokeWidth="1.2" />
      {parcelPath && (
        <path d={parcelPath} fill="#F7FBFA" fillOpacity="0.92" stroke="none" fillRule="evenodd" />
      )}
      {evidencePaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#2A6F8F"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {parcelPath && (
        <path
          d={parcelPath}
          fill="none"
          stroke="#163038"
          strokeWidth="1.75"
          strokeLinejoin="round"
          fillRule="evenodd"
        />
      )}
    </svg>
  );
}

const STAMP_CLS: Record<Stamp["tone"], string> = {
  on: "text-st-detected bg-st-detected-wash border-st-detected-line",
  off: "text-st-clear bg-st-clear-wash border-st-clear-line",
  quiet: "text-st-unavail bg-st-unavail-wash border-st-unavail-line",
};

export function ReportSheet(props: Props) {
  const { street, suburb } = splitAddress(props.address);
  const place = [suburb, props.areaM2 != null ? area(props.areaM2) : null].filter(Boolean).join(" · ");

  return (
    <section className="mt-8 border border-ink bg-surface" aria-label="Property field sheet">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="wash border-b border-ink p-4 md:border-b-0 md:border-r md:p-6">
          <div className="border border-ink bg-[#E7F2F0]">
            <ParcelDrawing geometry={props.geometry} evidence={props.evidence} />
          </div>
          <p className="label mt-3">
            {props.sourceParcelId ? `LINZ parcel ${props.sourceParcelId}` : "LINZ parcel"}
            {props.areaM2 != null ? ` · ${area(props.areaM2)}` : ""}
            {" · north up"}
          </p>
        </div>

        <div className="px-5 py-6 md:px-7 md:py-8">
          <p className="label">{props.sourceParcelId ? `Parcel ${props.sourceParcelId}` : "Property"}</p>
          <h1 className="display mt-3 text-[2rem] leading-[1.05] md:text-[2.35rem]" style={{ fontFamily: SERIF }}>
            {street}
          </h1>
          {place && <p className="label mt-3">{place}</p>}

          <hr className="rule mt-5" />

          <p className="label mt-5">Capital value</p>
          {props.valuationAvailable ? (
            <>
              <p className="display mt-1 text-[2.4rem] md:text-[2.75rem]" style={{ fontFamily: SERIF }}>
                {props.capitalValue != null ? money(props.capitalValue) : "Not stated"}
              </p>
              <dl className="mt-3 space-y-1 text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="label">Land value</dt>
                  <dd>{money(props.landValue)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="label">Rates / yr</dt>
                  <dd>{money(props.annualRates)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="label">Floor</dt>
                  <dd>{props.floorAreaM2 != null ? area(props.floorAreaM2) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="label">Council land</dt>
                  <dd>{props.councilLandAreaM2 != null ? area(props.councilLandAreaM2) : "—"}</dd>
                </div>
              </dl>
              {(props.retrievedLabel || props.sourceUrl) && (
                <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-muted">
                  Council rating valuation, not a market value.
                  {props.retrievedLabel ? ` ${props.retrievedLabel}` : ""}
                  {props.sourceUrl && (
                    <>
                      {" "}
                      <a href={props.sourceUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                        Council source
                      </a>
                    </>
                  )}
                </p>
              )}
              {props.limitations && (
                <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-muted">{props.limitations}</p>
              )}
            </>
          ) : (
            <>
              <p className="display mt-1 text-[1.7rem]" style={{ fontFamily: SERIF }}>
                Not available
              </p>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-muted">
                {props.areaM2 != null
                  ? "The council rating valuation did not come back for this search. The land size above is the LINZ parcel."
                  : "The council rating valuation did not come back for this search, and this report has no LINZ parcel size."}
              </p>
              {props.limitations && (
                <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-muted">{props.limitations}</p>
              )}
            </>
          )}

          {(props.zone || props.schools.length > 0) && <hr className="rule mt-5" />}

          {props.zone && (
            <div className="mt-5">
              <p className="label">Zone</p>
              <p className="display mt-1 text-[1.2rem]" style={{ fontFamily: SERIF }}>
                {props.zone}
              </p>
            </div>
          )}

          {props.schools.length > 0 && (
            <div className="mt-4">
              <p className="label">Enrolment zones</p>
              <ul className="mt-1">
                {props.schools.map((name) => (
                  <li key={name} className="display text-[1.05rem]" style={{ fontFamily: SERIF }}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {props.stamps.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {props.stamps.map((s) => (
                <li key={s.text}>
                  <span className={`stamp ${STAMP_CLS[s.tone]}`}>{s.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export function shortZone(title: string | undefined): string | null {
  if (!title) return null;
  return title
    .replace(/^Zone:\s*/i, "")
    .replace(/ Zone$/i, "")
    .replace(/^Residential - /i, "")
    .replace(/^Business - /i, "")
    .trim() || null;
}

export function schoolNames(explanation: string | undefined): string[] {
  if (!explanation) return [];
  const m = explanation.match(/zone\(s\):\s*(.+?)\.\s*$/);
  const body = m?.[1] ?? "";
  if (!body) return [];
  return body
    .split(";")
    .map((s) => s.replace(/\s*\(.*$/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}
