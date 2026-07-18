// FastAPI backend client (replaces Supabase).
// The backend lives in My-Health-Compass/backend and is a consent-based EHR:
// patients own their data; doctors request per-category access that the patient
// approves. Auth is a JWT bearer token stored in localStorage.
//
// Base URL comes from VITE_API_URL (see .env); defaults to local dev.

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

import { clearApiQueryCache } from "./queryClient";

const TOKEN_KEY = "hp.token";
const USER_KEY = "hp.user";

// ---------- shared types (mirror app/schemas.py) ----------

export type Role = "patient" | "doctor";

export type User = {
  id: number;
  role: Role;
  email: string;
  full_name: string;
  personal_number: string | null;
  date_of_birth: string | null;
  phone: string | null;
  blood_group: string | null;
  specialty: string | null;
};

export type Category = { id: number; code: string; name: string };

export type CategoryMetric = {
  code: string;
  name: string;
  unit: string | null;
  box: string | null;
  reference: string | null;
  range_low: number | null;
  range_high: number | null;
  modality: string | null;
  diagnostic_group: string | null;
};

export type Box = {
  id: string;
  title: string;
  subtitle: string;
  metrics: CategoryMetric[];
};

export type Section = { id: string; title: string };

export type CalendarKind = "appointment" | "reminder" | "medication";

export type CalendarEvent = {
  id: number;
  kind: CalendarKind;
  title: string;
  event_date: string;
  event_time: string | null;
  detail: string | null;
  created_at: string;
};

export type EpisodeType = "inpatient" | "day_hospital" | "emergency_outpatient" | "outpatient";

export type ImageOut = {
  id: number;
  file_path: string;
  original_name: string | null;
  description: string | null;
  uploaded_at: string;
};

export type Assessment = {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string | null;
  category: Category;
  episode_type: string;
  visit_date: string;
  complaints: string | null;
  preliminary_diagnosis_icd10: string | null;
  clinical_diagnosis_icd10: string | null;
  final_diagnosis_icd10: string | null;
  diagnosis_description: string | null;
  treatment_notes: string | null;
  recommendations: string | null;
  outcome: string | null;
  images: ImageOut[];
};

export type ProfileItemType =
  | "allergy"
  | "chronic_condition"
  | "medication"
  | "immunization"
  | "surgery"
  | "screening"
  | "family_history"
  | "social_history";

export type ProfileItem = {
  id: number;
  item_type: string;
  name: string;
  detail: string | null;
  icd10: string | null;
  occurred_on: string | null;
  created_at: string;
};

export type Observation = {
  id: number;
  patient_id: number;
  recorded_by: number | null;
  category_id: number | null;
  box: string;
  metric: string;
  value_num: number | null;
  value_text: string | null;
  unit: string | null;
  observed_at: string;
  source_kind: string | null;
  source_label: string | null;
  note: string | null;
};

export type PatientDocument = {
  id: number;
  patient_id: number;
  original_name: string | null;
  mime: string | null;
  summary: string | null;
  source_kind: string | null;
  occurred_at: string;
  created_at: string;
};

export type TimelineEvent = {
  date: string;
  event_type: "assessment" | "observation" | "document" | "profile_item";
  id: number;
  title: string;
  detail: string | null;
  category_code: string | null;
};

export type AccessRequest = {
  id: number;
  doctor_id: number;
  doctor_name: string | null;
  patient_id: number;
  patient_name: string | null;
  category: Category;
  reason: string | null;
  status: string;
  requested_at: string;
  decided_at: string | null;
  expires_at: string | null;
};

export type PatientSummary = {
  patient_id: number;
  full_name: string;
  personal_number: string | null;
  date_of_birth: string | null;
  age: number | null;
  blood_group: string | null;
  phone: string | null;
  allergies: ProfileItem[];
  chronic_conditions: ProfileItem[];
  medications: ProfileItem[];
  latest_vitals: Observation[];
  recent_assessments: Assessment[];
  generated_at: string;
};

export type CategorySummary = {
  category: Category;
  assessment_count: number;
  last_visit: string | null;
};

export type PatientDashboard = {
  user: User;
  pending_access_requests: AccessRequest[];
  categories: CategorySummary[];
  latest_vitals: Observation[];
  observation_count: number;
  document_count: number;
};

export type ActiveGrant = {
  request_id: number;
  patient_id: number;
  patient_name: string;
  category: Category;
  expires_at: string | null;
};

export type DoctorDashboard = {
  user: User;
  active_grants: ActiveGrant[];
  pending_requests: AccessRequest[];
  recent_assessments: Assessment[];
  assessment_count: number;
  patient_count: number;
};

export type CategoryHistory = { category: Category; assessments: Assessment[] };

export type MetricStats = {
  metric: string;
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  first_at: string | null;
  last_at: string | null;
  latest: Observation | null;
};

export type IntakeResult = {
  message: string;
  parsed_by: string;
  observations: Observation[];
};

export type WearableSource =
  "apple_health" | "samsung_health" | "whoop" | "fitbit" | "garmin" | "oura" | "other";

export type WearableSample = {
  metric: string;
  value_num?: number | null;
  value_text?: string | null;
  unit?: string | null;
  observed_at: string;
};

export type WearableSyncResult = {
  stored: number;
  skipped_duplicates: number;
};

// ---------- token / current user storage ----------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  // Wipe the React Query cache too — nothing fetched for the previous
  // session may leak into the next one (sign-out, 401, account switch).
  clearApiQueryCache();
}

export function isAuthed(): boolean {
  return !!getToken();
}

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(u: User) {
  if (typeof window !== "undefined") window.localStorage.setItem(USER_KEY, JSON.stringify(u));
}

// ---------- low-level fetch ----------

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type FetchOpts = {
  method?: string;
  body?: unknown; // JSON-serialized
  form?: FormData; // multipart (overrides body)
  auth?: boolean; // attach bearer token (default true)
  query?: Record<string, string | number | null | undefined>;
};

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = "GET", body, form, auth = true, query } = opts;

  let url = `${API_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (!form && body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    // Network error / backend unreachable — surface as a typed error (status 0).
    throw new ApiError(0, `Cannot reach the API at ${API_URL}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data
        ? (data as { detail: unknown }).detail
        : undefined) ?? res.statusText;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, message);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------- auth ----------

export type RegisterInput = {
  role: Role;
  email: string;
  password: string;
  full_name: string;
  personal_number?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  blood_group?: string | null;
  specialty?: string | null;
};

export const auth = {
  async login(email: string, password: string): Promise<User> {
    const { access_token } = await apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(access_token);
    // Force a fresh /me here — this is the one network fetch per login; a
    // stale cached user (e.g. previous account on this browser) must not win.
    const user = await auth.me(true);
    return user;
  },

  async register(input: RegisterInput): Promise<User> {
    const user = await apiFetch<User>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    // auto-login after registration
    await auth.login(input.email, input.password);
    return user;
  },

  /**
   * The signed-in user. Served from localStorage — /auth/me is only fetched
   * when there's no cached user yet (first login, or a session restored from
   * a bare token). Concurrent cache-miss callers share one in-flight request.
   */
  async me(forceRefresh = false): Promise<User> {
    if (!forceRefresh) {
      const cached = getCachedUser();
      if (cached) return cached;
    }
    meInFlight ??= apiFetch<User>("/auth/me")
      .then((user) => {
        cacheUser(user);
        return user;
      })
      .finally(() => {
        meInFlight = null;
      });
    return meInFlight;
  },

  logout() {
    clearToken();
  },
};

let meInFlight: Promise<User> | null = null;

// ---------- categories ----------

export const api = {
  listCategories: () => apiFetch<Category[]>("/categories"),
  categoryMetrics: (code: string) => apiFetch<CategoryMetric[]>(`/categories/${code}/metrics`),

  // ----- catalog (reference data; replaces hardcoded @/data/health) -----
  catalogBoxes: () => apiFetch<Box[]>("/catalog/boxes"),
  catalogSections: () => apiFetch<Section[]>("/catalog/sections"),
  catalogMetrics: () => apiFetch<CategoryMetric[]>("/catalog/metrics"),

  // ----- calendar (appointments / reminders / medication schedule) -----
  calendar: (kind?: CalendarKind) =>
    apiFetch<CalendarEvent[]>("/calendar/mine", { query: { kind } }),
  addCalendarEvent: (input: {
    kind: CalendarKind;
    title: string;
    event_date: string;
    event_time?: string | null;
    detail?: string | null;
  }) => apiFetch<CalendarEvent>("/calendar", { method: "POST", body: input }),
  deleteCalendarEvent: (id: number) => apiFetch<void>(`/calendar/${id}`, { method: "DELETE" }),

  // ----- dashboards -----
  patientDashboard: () => apiFetch<PatientDashboard>("/dashboard/patient"),
  doctorDashboard: () => apiFetch<DoctorDashboard>("/dashboard/doctor"),

  // ----- profile items (anamnesis vitae) -----
  getProfile: (patientId: number) =>
    apiFetch<Record<string, ProfileItem[]>>(`/patients/${patientId}/profile`),
  addProfileItem: (input: {
    item_type: ProfileItemType;
    name: string;
    detail?: string | null;
    icd10?: string | null;
    occurred_on?: string | null;
  }) => apiFetch<ProfileItem>("/profile/items", { method: "POST", body: input }),
  deleteProfileItem: (id: number) => apiFetch<void>(`/profile/items/${id}`, { method: "DELETE" }),

  // ----- observations -----
  listObservations: (
    patientId: number,
    filters: {
      box?: string;
      metric?: string;
      category?: string;
      date_from?: string;
      date_to?: string;
      source_kind?: string;
    } = {},
  ) =>
    apiFetch<Observation[]>(`/patients/${patientId}/observations`, {
      query: filters,
    }),
  addObservation: (
    patientId: number,
    input: {
      box: string;
      metric: string;
      value_num?: number | null;
      value_text?: string | null;
      unit?: string | null;
      observed_at?: string | null;
      source_kind?: string | null;
      source_label?: string | null;
      note?: string | null;
    },
  ) =>
    apiFetch<Observation>(`/patients/${patientId}/observations`, {
      method: "POST",
      body: input,
    }),
  deleteObservation: (id: number) => apiFetch<void>(`/observations/${id}`, { method: "DELETE" }),
  latestVitals: (patientId: number) =>
    apiFetch<Observation[]>(`/patients/${patientId}/vitals/latest`),
  observationStats: (patientId: number, metric: string) =>
    apiFetch<MetricStats>(`/patients/${patientId}/observations/stats`, {
      query: { metric },
    }),

  // ----- wearable / device sync -----
  syncWearable: (source: WearableSource, samples: WearableSample[]) =>
    apiFetch<WearableSyncResult>("/wearables/sync", {
      method: "POST",
      body: { source, samples },
    }),

  // ----- AI intake -----
  intakeMessage: (message: string, observedAt?: string) =>
    apiFetch<IntakeResult>("/intake/message", {
      method: "POST",
      body: { message, observed_at: observedAt ?? null },
    }),

  // ----- documents -----
  listDocuments: (patientId: number) =>
    apiFetch<PatientDocument[]>(`/documents/patient/${patientId}`),
  uploadDocument: (form: FormData) =>
    apiFetch<PatientDocument>("/documents", { method: "POST", form }),
  deleteDocument: (id: number) => apiFetch<void>(`/documents/${id}`, { method: "DELETE" }),
  documentDownloadUrl: (id: number) => `${API_URL}/documents/${id}/download`,
  imageDownloadUrl: (id: number) => `${API_URL}/images/${id}`,

  // ----- timeline -----
  timeline: (patientId: number, setting?: string) =>
    apiFetch<TimelineEvent[]>(`/patients/${patientId}/timeline`, {
      query: { setting },
    }),

  // ----- summary -----
  summary: (patientId: number) => apiFetch<PatientSummary>(`/patients/${patientId}/summary`),

  // ----- history -----
  myHistory: () => apiFetch<CategoryHistory[]>("/patients/me/history"),
  // Grouped-by-category history of any patient the viewer may read (own
  // record, or a patient who granted access) → /patients/{id}/history
  patientHistory: (patientId: number) =>
    apiFetch<CategoryHistory[]>(`/patients/${patientId}/history`),
  myHistoryForCategory: (code: string) => apiFetch<Assessment[]>(`/patients/me/history/${code}`),
  doctorPatientHistory: (patientId: number, code: string) =>
    apiFetch<Assessment[]>(`/doctors/patients/${patientId}/history/${code}`),

  // ----- assessments (doctor) -----
  submitAssessment: (input: {
    patient_id: number;
    category_code: string;
    episode_type?: EpisodeType;
    visit_date?: string | null;
    complaints?: string | null;
    preliminary_diagnosis_icd10?: string | null;
    clinical_diagnosis_icd10?: string | null;
    final_diagnosis_icd10?: string | null;
    diagnosis_description?: string | null;
    treatment_notes?: string | null;
    recommendations?: string | null;
    outcome?: string | null;
  }) => apiFetch<Assessment>("/assessments", { method: "POST", body: input }),
  myAssessments: () => apiFetch<Assessment[]>("/assessments/mine"),
  uploadAssessmentImage: (assessmentId: number, form: FormData) =>
    apiFetch<ImageOut>(`/assessments/${assessmentId}/images`, {
      method: "POST",
      form,
    }),

  // ----- access requests -----
  requestAccess: (input: {
    patient_personal_number?: string | null;
    patient_id?: number | null;
    category_code: string;
    reason?: string | null;
  }) => apiFetch<AccessRequest>("/access-requests", { method: "POST", body: input }),
  incomingRequests: (statusFilter?: string) =>
    apiFetch<AccessRequest[]>("/access-requests/incoming", {
      query: { status_filter: statusFilter },
    }),
  outgoingRequests: () => apiFetch<AccessRequest[]>("/access-requests/outgoing"),
  approveRequest: (id: number) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/approve`, { method: "POST" }),
  denyRequest: (id: number) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/deny`, { method: "POST" }),
  revokeRequest: (id: number) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/revoke`, { method: "POST" }),
};
