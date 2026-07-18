import type { QueryClient } from "@tanstack/react-query";

// Central query keys — every backend read in the app goes through these, so
// identical requests share one cache entry, and mutations can invalidate by
// prefix (["observations", patientId] matches every filtered variant).
export const qk = {
  categories: ["categories"] as const,
  categoryMetrics: (code: string) => ["categories", code, "metrics"] as const,
  catalogBoxes: ["catalog", "boxes"] as const,
  catalogSections: ["catalog", "sections"] as const,
  catalogMetrics: ["catalog", "metrics"] as const,
  latestVitals: (patientId: number | null) => ["vitals", patientId] as const,
  observations: (patientId: number | null, ...filters: unknown[]) =>
    ["observations", patientId, ...filters] as const,
  profile: (patientId: number | null) => ["profile", patientId] as const,
  timeline: (patientId: number | null) => ["timeline", patientId] as const,
  calendar: ["calendar"] as const,
  patientDashboard: ["dashboard", "patient"] as const,
  doctorDashboard: ["dashboard", "doctor"] as const,
  myHistory: ["history", "me"] as const,
  doctorHistory: (patientId: number, code: string) => ["history", patientId, code] as const,
  summary: (patientId: number) => ["summary", patientId] as const,
  documents: (patientId: number | null) => ["documents", patientId] as const,
  myAssessments: ["assessments", "mine"] as const,
  incomingRequests: (status: string) => ["access", "incoming", status] as const,
  outgoingRequests: ["access", "outgoing"] as const,
};

// Reference/catalog data is seeded on the backend and effectively static.
export const STATIC_STALE_TIME = Number.POSITIVE_INFINITY;

/** Observations feed vitals, charts, the timeline and both dashboards. */
export function invalidateObservations(qc: QueryClient, patientId: number) {
  void qc.invalidateQueries({ queryKey: ["observations", patientId] });
  void qc.invalidateQueries({ queryKey: ["vitals", patientId] });
  void qc.invalidateQueries({ queryKey: ["timeline", patientId] });
  void qc.invalidateQueries({ queryKey: ["summary", patientId] });
  void qc.invalidateQueries({ queryKey: ["dashboard"] });
}

/** Profile items (allergies, meds, ...) also feed the visit summary. */
export function invalidateProfile(qc: QueryClient, patientId: number) {
  void qc.invalidateQueries({ queryKey: ["profile", patientId] });
  void qc.invalidateQueries({ queryKey: ["summary", patientId] });
}

/** Uploaded documents show up on the timeline and in the dashboard counts. */
export function invalidateDocuments(qc: QueryClient, patientId: number) {
  void qc.invalidateQueries({ queryKey: ["documents", patientId] });
  void qc.invalidateQueries({ queryKey: ["timeline", patientId] });
  void qc.invalidateQueries({ queryKey: ["dashboard"] });
}

/** Filed assessments affect history, the timeline, summaries and dashboards. */
export function invalidateAssessments(qc: QueryClient, patientId: number) {
  void qc.invalidateQueries({ queryKey: ["assessments"] });
  void qc.invalidateQueries({ queryKey: ["history"] });
  void qc.invalidateQueries({ queryKey: ["timeline", patientId] });
  void qc.invalidateQueries({ queryKey: ["summary", patientId] });
  void qc.invalidateQueries({ queryKey: ["dashboard"] });
}

/** Access-request decisions change both sides' lists and the dashboards. */
export function invalidateAccess(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ["access"] });
  void qc.invalidateQueries({ queryKey: ["dashboard"] });
}
