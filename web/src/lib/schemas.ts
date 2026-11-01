import { z } from "zod";

export const FindingStatus = z.enum([
  "detected",
  "not_detected",
  "unavailable",
  "needs_review",
]);
export type FindingStatus = z.infer<typeof FindingStatus>;

export const BuyerIntention = z.enum([
  "live",
  "renovate",
  "extend",
  "add_dwelling",
  "vacant_build",
]);
export type BuyerIntention = z.infer<typeof BuyerIntention>;

export const AddressSearchRequest = z.object({
  query: z.string().min(2).max(200),
});

export const AddressCandidate = z.object({
  id: z.string(),
  label: z.string(),
  isDemo: z.boolean().default(true),
});

export const AddressSearchResponse = z.object({
  candidates: z.array(AddressCandidate),
  isDemo: z.boolean().default(true),
});

export const ParcelCandidate = z.object({
  id: z.string(),
  sourceParcelId: z.string().nullable(),
  intent: z.string().nullable(),
  areaM2: z.number().nullable(),
  // GeoJSON Polygon in EPSG:4326 for MapLibre
  geometry: z.any(),
  isDemo: z.boolean().default(true),
});

export const ParcelCandidatesRequest = z.object({
  addressId: z.string().uuid(),
});

export const ParcelCandidatesResponse = z.object({
  candidates: z.array(ParcelCandidate),
  isDemo: z.boolean().default(true),
});

export const AssessmentRunRequest = z.object({
  parcelIds: z
    .array(z.string().uuid())
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "parcelIds must be unique",
    }),
  intention: BuyerIntention.default("live"),
});

export const FollowUpQuestion = z.object({
  question: z.string(),
  audience: z.string(),
});

export const Finding = z.object({
  id: z.string(),
  checkId: z.string(),
  ruleVersion: z.string(),
  status: FindingStatus,
  title: z.string(),
  explanation: z.string().optional(),
  limitations: z.string().optional(),
  followUpQuestions: z.array(FollowUpQuestion).default([]),
  sourceUrl: z.string().optional(),
  datasetVersionId: z.string().nullable(),
  featureIds: z.array(z.string()).default([]),
  evidenceGeometry: z.any().nullable(),
  retrievalDate: z.string(),
  intentions: z.array(z.string()).default(["live"]),
});

export const AssessmentRunResponse = z.object({
  runId: z.string().uuid(),
  intention: BuyerIntention,
  ruleVersion: z.string(),
  datasetVersionIds: z.array(z.string()),
  findings: z.array(Finding),
  isDemo: z.boolean().default(true),
});

export type Finding = z.infer<typeof Finding>;
export type AssessmentRunResponse = z.infer<typeof AssessmentRunResponse>;
