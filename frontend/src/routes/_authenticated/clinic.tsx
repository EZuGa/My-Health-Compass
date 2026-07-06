import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Panel,
  StatTile,
  Pill,
  ErrorNote,
  Empty,
  useAsync,
  fmtDate,
  fmtDateTime,
} from "@/components/backend/ui";
import {
  api,
  getCachedUser,
  type Category,
  type EpisodeType,
  type PatientSummary,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/clinic")({
  head: () => ({ meta: [{ title: "Clinician Console — Zrunva" }] }),
  component: ClinicPage,
});

const EPISODES: EpisodeType[] = [
  "outpatient",
  "inpatient",
  "day_hospital",
  "emergency_outpatient",
];

type ClinicTab = "overview" | "access" | "assessments" | "patients";

const CLINIC_TABS: { id: ClinicTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "access", label: "Access & Consent" },
  { id: "assessments", label: "Assessments" },
  { id: "patients", label: "Patient Lookup" },
];

function ClinicPage() {
  const user = getCachedUser();
  const [tab, setTab] = useState<ClinicTab>("overview");
  const categories = useAsync<Category[]>(() => api.listCategories(), []);

  if (user && user.role !== "doctor") {
    return (
      <AppShell>
        <Panel title="Clinician Console">
          <Empty>
            This console is for doctors. Your{" "}
            <Link to="/records" className="underline font-bold">
              Health Records
            </Link>{" "}
            are over here.
          </Empty>
        </Panel>
      </AppShell>
    );
  }

  const cats = categories.data ?? [];

  return (
    <AppShell>
      <section className="max-w-5xl w-full">
        <h1 className="font-serif text-3xl font-black">Clinician Console</h1>
        <p className="mt-1 text-sm font-semibold opacity-70">
          Request consent, review patients you've been granted, and file
          assessments — all against the backend EHR.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {CLINIC_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold rounded-md border border-foreground/30 ${
                tab === t.id
                  ? "bg-[color:var(--mint-deep)]"
                  : "hover:bg-[color:var(--mint-soft)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="max-w-5xl w-full flex flex-col gap-5">
        {tab === "overview" ? (
          <DoctorDashboard />
        ) : tab === "access" ? (
          <>
            <RequestAccess categories={cats} />
            <OutgoingRequests />
          </>
        ) : tab === "assessments" ? (
          <>
            <SubmitAssessment categories={cats} />
            <MyAssessments />
          </>
        ) : (
          <PatientViewer categories={cats} />
        )}
      </div>
    </AppShell>
  );
}

// ---------------- Doctor dashboard ----------------

function DoctorDashboard() {
  const { data, loading, error } = useAsync(() => api.doctorDashboard(), []);
  return (
    <Panel title="My practice" subtitle="/dashboard/doctor">
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : data ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile label="Patients" value={data.patient_count} />
            <StatTile label="Assessments" value={data.assessment_count} />
            <StatTile label="Active grants" value={data.active_grants.length} />
            <StatTile label="Pending" value={data.pending_requests.length} />
          </div>

          <div>
            <h3 className="font-serif text-lg font-black mb-2">
              Patients you can open now
            </h3>
            {data.active_grants.length === 0 ? (
              <Empty>No active grants. Request access below.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.active_grants.map((g) => (
                  <li
                    key={g.request_id}
                    className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <span className="font-bold">
                      {g.patient_name} · patient #{g.patient_id}{" "}
                      <Pill tone="pink">{g.category.name}</Pill>
                    </span>
                    <span className="text-[10px] opacity-50">
                      expires {fmtDate(g.expires_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-black mb-2">
              Pending requests
            </h3>
            {data.pending_requests.length === 0 ? (
              <Empty>Nothing awaiting patient approval.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.pending_requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <span className="font-bold">
                      {r.patient_name ?? `Patient #${r.patient_id}`}{" "}
                      <Pill tone="amber">{r.category.name}</Pill>
                    </span>
                    <span className="text-[10px] opacity-50">
                      sent {fmtDateTime(r.requested_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-black mb-2">
              Recent assessments
            </h3>
            {data.recent_assessments.length === 0 ? (
              <Empty>You haven't filed any assessments yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.recent_assessments.map((a) => (
                  <li
                    key={a.id}
                    className="border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <div className="font-bold">
                      {a.category.name}{" "}
                      <Pill tone="gray">{a.episode_type.replace(/_/g, " ")}</Pill>
                    </div>
                    <div className="text-[12px] opacity-70">
                      {a.final_diagnosis_icd10 || a.clinical_diagnosis_icd10}{" "}
                      {a.diagnosis_description}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {fmtDate(a.visit_date)} · patient #{a.patient_id}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

// ---------------- Outgoing access requests ----------------

function OutgoingRequests() {
  const { data, loading, error, reload } = useAsync(
    () => api.outgoingRequests(),
    [],
  );
  const tone = (s: string) =>
    s === "approved" ? "mint" : s === "pending" ? "amber" : "gray";
  return (
    <Panel
      title="My access requests"
      subtitle="Every request you've sent and its status → /access-requests/outgoing"
      right={
        <button
          type="button"
          onClick={reload}
          className="px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40"
        >
          Refresh
        </button>
      }
    >
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>You haven't requested access to anyone yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md gap-2 flex-wrap"
            >
              <span className="font-bold">
                {r.patient_name ?? `Patient #${r.patient_id}`}{" "}
                <Pill tone="pink">{r.category.name}</Pill>
              </span>
              <span className="flex items-center gap-2">
                <Pill tone={tone(r.status) as any}>{r.status}</Pill>
                <span className="text-[10px] opacity-50">
                  {r.expires_at ? `expires ${fmtDate(r.expires_at)}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------- My assessments (+ image upload) ----------------

function MyAssessments() {
  const { data, loading, error, reload } = useAsync(
    () => api.myAssessments(),
    [],
  );
  return (
    <Panel
      title="Assessments I've filed"
      subtitle="Attach imaging/reports → /assessments/mine, /assessments/{id}/images"
      right={
        <button
          type="button"
          onClick={reload}
          className="px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40"
        >
          Refresh
        </button>
      }
    >
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>No assessments filed yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((a) => (
            <li
              key={a.id}
              className="border border-foreground/15 bg-card px-3 py-2 rounded-md"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold">
                  #{a.id} · {a.category.name} · patient #{a.patient_id}{" "}
                  <Pill tone="gray">{a.episode_type.replace(/_/g, " ")}</Pill>
                </span>
                <span className="text-[10px] opacity-50">
                  {fmtDate(a.visit_date)}
                </span>
              </div>
              <div className="text-[12px] opacity-70">
                {a.final_diagnosis_icd10 || a.clinical_diagnosis_icd10}{" "}
                {a.diagnosis_description}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {a.images.map((img) => (
                  <a
                    key={img.id}
                    href={api.imageDownloadUrl(img.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold underline"
                  >
                    📎 {img.original_name ?? `image ${img.id}`}
                  </a>
                ))}
                <ImageUploader assessmentId={a.id} onUploaded={reload} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ImageUploader({
  assessmentId,
  onUploaded,
}: {
  assessmentId: number;
  onUploaded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.uploadAssessmentImage(assessmentId, fd);
      onUploaded();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <label className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-1 border border-foreground/40 cursor-pointer">
        {busy ? "Uploading…" : "+ Attach"}
        <input
          type="file"
          accept="image/*,application/pdf,.dcm"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0] ?? null);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {error != null && <ErrorNote error={error} />}
    </span>
  );
}

// ---------------- Request access ----------------

function RequestAccess({ categories }: { categories: Category[] }) {
  const [personalNumber, setPersonalNumber] = useState("");
  const [patientIdRaw, setPatientIdRaw] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = categoryCode || categories[0]?.code;
    if (!code) return;
    if (!personalNumber.trim() && !patientIdRaw.trim()) {
      setError(new Error("Enter the patient's personal number or id"));
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const r = await api.requestAccess({
        patient_personal_number: personalNumber.trim() || null,
        patient_id: patientIdRaw.trim() ? Number(patientIdRaw.trim()) : null,
        category_code: code,
        reason: reason.trim() || null,
      });
      setOk(`Request sent to ${r.patient_name ?? "patient"} — awaiting approval.`);
      setReason("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Request access" subtitle="Ask a patient to share a category → /access-requests">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={personalNumber}
          onChange={(e) => setPersonalNumber(e.target.value)}
          placeholder="Patient personal number"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <input
          value={patientIdRaw}
          onChange={(e) => setPatientIdRaw(e.target.value)}
          placeholder="…or patient id"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <select
          value={categoryCode}
          onChange={(e) => setCategoryCode(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        >
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
          >
            {busy ? "Sending…" : "Request access"}
          </button>
          {ok && (
            <span className="text-[12px] font-bold text-green-800">{ok}</span>
          )}
        </div>
      </form>
      <div className="mt-2">
        <ErrorNote error={error} />
      </div>
    </Panel>
  );
}

// ---------------- Submit assessment ----------------

function SubmitAssessment({ categories }: { categories: Category[] }) {
  const [patientId, setPatientId] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [episode, setEpisode] = useState<EpisodeType>("outpatient");
  const [complaints, setComplaints] = useState("");
  const [icd10, setIcd10] = useState("");
  const [description, setDescription] = useState("");
  const [treatment, setTreatment] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = categoryCode || categories[0]?.code;
    if (!patientId.trim() || !code) {
      setError(new Error("Patient id and category are required"));
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const a = await api.submitAssessment({
        patient_id: Number(patientId.trim()),
        category_code: code,
        episode_type: episode,
        complaints: complaints.trim() || null,
        clinical_diagnosis_icd10: icd10.trim() || null,
        final_diagnosis_icd10: icd10.trim() || null,
        diagnosis_description: description.trim() || null,
        treatment_notes: treatment.trim() || null,
        recommendations: recommendations.trim() || null,
      });
      setOk(`Assessment #${a.id} filed for patient #${a.patient_id}.`);
      setComplaints("");
      setIcd10("");
      setDescription("");
      setTreatment("");
      setRecommendations("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="File assessment"
      subtitle="Requires an approved grant for the category → /assessments"
    >
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Patient id"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
          <select
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          >
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={episode}
            onChange={(e) => setEpisode(e.target.value as EpisodeType)}
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          >
            {EPISODES.map((ep) => (
              <option key={ep} value={ep}>
                {ep.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <input
          value={complaints}
          onChange={(e) => setComplaints(e.target.value)}
          placeholder="Complaints"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={icd10}
            onChange={(e) => setIcd10(e.target.value)}
            placeholder="ICD-10 (e.g. I20.0)"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Diagnosis description"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
        </div>
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="Treatment notes"
          rows={2}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-medium"
        />
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="Recommendations"
          rows={2}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-medium"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
          >
            {busy ? "Filing…" : "File assessment"}
          </button>
          {ok && (
            <span className="text-[12px] font-bold text-green-800">{ok}</span>
          )}
        </div>
        <ErrorNote error={error} />
      </form>
    </Panel>
  );
}

// ---------------- Patient viewer ----------------

function PatientViewer({ categories }: { categories: Category[] }) {
  const [patientIdRaw, setPatientIdRaw] = useState("");
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdRaw.trim()) return;
    const id = Number(patientIdRaw.trim());
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const s = await api.summary(id);
      setSummary(s);
      setLoadedId(id);
    } catch (err) {
      setError(err);
      setLoadedId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Open a patient"
      subtitle="One-call visit summary → /patients/{id}/summary (needs a grant)"
    >
      <form onSubmit={load} className="flex gap-2 mb-3">
        <input
          value={patientIdRaw}
          onChange={(e) => setPatientIdRaw(e.target.value)}
          placeholder="Patient id"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
        >
          {busy ? "Loading…" : "Open"}
        </button>
      </form>
      <ErrorNote error={error} />

      {summary && loadedId != null && (
        <div className="flex flex-col gap-4">
          <div className="border border-foreground/15 bg-card px-3 py-2 rounded-md">
            <div className="font-serif text-lg font-black">
              {summary.full_name}
            </div>
            <div className="text-[12px] opacity-70">
              {summary.age != null ? `${summary.age} yrs · ` : ""}
              {summary.blood_group ? `${summary.blood_group} · ` : ""}
              {summary.personal_number ?? ""}
            </div>
          </div>

          <SummaryList title="Allergies" items={summary.allergies} tone="pink" />
          <SummaryList
            title="Chronic conditions"
            items={summary.chronic_conditions}
            tone="amber"
          />
          <SummaryList
            title="Medications"
            items={summary.medications}
            tone="mint"
          />

          <div>
            <h3 className="font-serif text-base font-black mb-1">
              Latest vitals
            </h3>
            {summary.latest_vitals.length === 0 ? (
              <Empty>None on record.</Empty>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {summary.latest_vitals.map((v) => (
                  <div
                    key={v.id}
                    className="border border-foreground/15 bg-card px-2 py-1 rounded"
                  >
                    <span className="font-bold">
                      {v.metric.replace(/_/g, " ")}
                    </span>
                    : {v.value_num ?? v.value_text}
                    {v.unit ? ` ${v.unit}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-base font-black mb-1">
              Recent assessments
            </h3>
            {summary.recent_assessments.length === 0 ? (
              <Empty>None visible with your current grants.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {summary.recent_assessments.map((a) => (
                  <li
                    key={a.id}
                    className="border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <div className="font-bold">
                      {a.category.name}{" "}
                      <span className="text-[12px] opacity-70">
                        {a.final_diagnosis_icd10 || a.clinical_diagnosis_icd10}
                      </span>
                    </div>
                    <div className="text-[10px] opacity-50">
                      {fmtDate(a.visit_date)} · Dr. {a.doctor_name ?? a.doctor_id}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <CategoryHistory patientId={loadedId} categories={categories} />
        </div>
      )}
    </Panel>
  );
}

function SummaryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: PatientSummary["allergies"];
  tone: "pink" | "amber" | "mint";
}) {
  return (
    <div>
      <h3 className="font-serif text-base font-black mb-1">{title}</h3>
      {items.length === 0 ? (
        <Empty>None recorded.</Empty>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <Pill key={it.id} tone={tone}>
              {it.name}
              {it.detail ? ` · ${it.detail}` : ""}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryHistory({
  patientId,
  categories,
}: {
  patientId: number;
  categories: Category[];
}) {
  const [code, setCode] = useState("");
  const { data, loading, error, reload } = useAsync(
    () =>
      code
        ? api.doctorPatientHistory(patientId, code)
        : Promise.resolve(null),
    [patientId, code],
  );

  return (
    <div>
      <h3 className="font-serif text-base font-black mb-1">
        Full history by category
      </h3>
      <div className="flex gap-2 mb-2">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        >
          <option value="">Pick a category…</option>
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={reload}
          className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40"
        >
          Refresh
        </button>
      </div>
      <ErrorNote error={error} />
      {!code ? (
        <Empty>Select a category to load its full history.</Empty>
      ) : loading ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>No assessments in this category (or no grant for it).</Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.map((a) => (
            <li
              key={a.id}
              className="border border-foreground/15 bg-card px-3 py-2 rounded-md"
            >
              <div className="font-bold">
                {a.final_diagnosis_icd10 || a.clinical_diagnosis_icd10}{" "}
                {a.diagnosis_description}
              </div>
              {a.treatment_notes && (
                <div className="text-[12px] opacity-70">
                  Tx: {a.treatment_notes}
                </div>
              )}
              <div className="text-[10px] opacity-50">
                {fmtDate(a.visit_date)} · {a.episode_type.replace(/_/g, " ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
