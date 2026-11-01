import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";

// Demo fixture coordinates (NZTM2000, metres). Mirrors the Supabase seed.
const PARCEL = [
  [1762000, 5924500],
  [1762030, 5924500],
  [1762030, 5924540],
  [1762000, 5924540],
  [1762000, 5924500],
];
const HAZARD = [
  [1762000, 5924525],
  [1762030, 5924525],
  [1762030, 5924540],
  [1762000, 5924540],
  [1762000, 5924525],
];
// Address point sits at the front of the section (south edge), outside the hazard.
const ADDRESS_POINT = [1762015, 5924505];

function toFeature(coords: number[][], coords2D = true) {
  return turf.polygon([coords]);
}

describe("demo fixture: rear-of-section hazard", () => {
  it("address point is NOT inside the hazard", () => {
    const hazard = toFeature(HAZARD);
    const pt = turf.point(ADDRESS_POINT);
    expect(turf.booleanPointInPolygon(pt, hazard)).toBe(false);
  });

  it("parcel INTERSECTS the hazard (rear overlap)", () => {
    const parcel = toFeature(PARCEL);
    const hazard = toFeature(HAZARD);
    expect(turf.booleanOverlap(parcel, hazard) || turf.booleanContains(parcel, hazard)).toBe(true);
  });

  it("intersection is non-empty", () => {
    const parcel = toFeature(PARCEL);
    const hazard = toFeature(HAZARD);
    const inter = turf.intersect(turf.featureCollection([parcel, hazard]));
    expect(inter).toBeTruthy();
    expect((inter as any)?.geometry?.type).toBe("Polygon");
  });
});
