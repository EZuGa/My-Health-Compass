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
  type ProfileItem,
  type ProfileItemType,
} from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";
import { VitalsTab } from "@/components/backend/VitalsTab";
import { HistoryTab } from "@/components/backend/HistoryTab";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({ meta: [{ title: "Health Records — Zrunva" }] }),
  component: RecordsPage,
});

type Tab =
  | "overview"
  | "vitals"
  | "profile"
  | "history"
  | "documents"
  | "timeline"
  | "access";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "vitals", label: "Vitals" },
  { id: "profile", label: "Medical History" },
  { id: "history", label: "Clinical History" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "access", label: "Access Requests" },
];

function RecordsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const patientId = usePatientId();
  const user = getCachedUser();

  if (user && user.role === "doctor") {
    return (
      <AppShell>
        <Panel title="Health Records">
          <Empty>
            You are signed in as a doctor. Head to the{" "}
            <Link to="/clinic" className="underline font-bold">
              Clinician Console
            </Link>{" "}
            to request access and review patients.
          </Empty>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="max-w-5xl w-full">
        <h1 className="font-serif text-3xl font-black">Health Records</h1>
        <p className="mt-1 text-sm font-semibold opacity-70">
          Your consent-controlled electronic health record, served by the
          backend. Doctors only see what you approve.
        </p>

        <nav className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
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
        {patientId == null ? (
          <Panel>
            <Empty>Loading your account…</Empty>
          </Panel>
        ) : tab === "overview" ? (
          <Overview />
        ) : tab === "vitals" ? (
          <VitalsTab patientId={patientId} />
        ) : tab === "profile" ? (
          <ProfileTab patientId={patientId} />
        ) : tab === "history" ? (
          <HistoryTab />
        ) : tab === "documents" ? (
          <DocumentsTab patientId={patientId} />
        ) : tab === "timeline" ? (
          <TimelineTab patientId={patientId} />
        ) : (
          <AccessTab />
        )}
      </div>
    </AppShell>
  );
}

// ---------------- Overview (patient dashboard) ----------------

function Overview() {
  const { data, loading, error } = useAsync(() => api.patientDashboard(), []);
  return (
    <Panel title="Overview" subtitle="Snapshot from /dashboard/patient">
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : data ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile label="Observations" value={data.observation_count} />
            <StatTile label="Documents" value={data.document_count} />
            <StatTile
              label="Categories"
              value={data.categories.length}
            />
            <StatTile
              label="Pending consents"
              value={data.pending_access_requests.length}
            />
          </div>

          <div>
            <h3 className="font-serif text-lg font-black mb-2">Latest vitals</h3>
            {data.latest_vitals.length === 0 ? (
              <Empty>
                No vitals yet. Log some in{" "}
                <Link to="/intake" className="underline font-bold">
                  AI Intake
                </Link>
                .
              </Empty>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {data.latest_vitals.map((v) => (
                  <div
                    key={v.id}
                    className="border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <div className="text-sm font-black">
                      {v.value_num ?? v.value_text}
                      {v.unit ? ` ${v.unit}` : ""}
                    </div>
                    <div className="text-[11px] font-bold opacity-70">
                      {v.metric.replace(/_/g, " ")}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {fmtDate(v.observed_at)} · {v.source_kind ?? "manual"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-black mb-2">
              History by category
            </h3>
            {data.categories.length === 0 ? (
              <Empty>No clinical assessments recorded yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.categories.map((c) => (
                  <li
                    key={c.category.id}
                    className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <span className="font-bold">{c.category.name}</span>
                    <span className="text-[11px] font-semibold opacity-70">
                      {c.assessment_count} visit
                      {c.assessment_count === 1 ? "" : "s"} · last{" "}
                      {fmtDate(c.last_visit)}
                    </span>
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

// ---------------- Profile items (anamnesis vitae) ----------------

const ITEM_TYPES: { id: ProfileItemType; label: string }[] = [
  { id: "allergy", label: "Allergy" },
  { id: "chronic_condition", label: "Chronic condition" },
  { id: "medication", label: "Medication" },
  { id: "immunization", label: "Immunization" },
  { id: "surgery", label: "Surgery" },
  { id: "screening", label: "Screening" },
  { id: "family_history", label: "Family history" },
  { id: "social_history", label: "Social history" },
];

function ProfileTab({ patientId }: { patientId: number }) {
  const { data, loading, error, reload } = useAsync(
    () => api.getProfile(patientId),
    [patientId],
  );
  const [itemType, setItemType] = useState<ProfileItemType>("allergy");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<unknown>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.addProfileItem({
        item_type: itemType,
        name: name.trim(),
        detail: detail.trim() || null,
        occurred_on: occurredOn || null,
      });
      setName("");
      setDetail("");
      setOccurredOn("");
      reload();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await api.deleteProfileItem(id);
    reload();
  };

  const grouped = data ?? {};

  return (
    <>
      <Panel title="Add to medical history" subtitle="Anamnesis vitae → /profile/items">
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as ProfileItemType)}
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          >
            {ITEM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Penicillin)"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Detail (optional)"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold flex-1"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
        <div className="mt-2">
          <ErrorNote error={formError} />
        </div>
      </Panel>

      <Panel title="Medical history">
        <ErrorNote error={error} />
        {loading && !data ? (
          <Empty>Loading…</Empty>
        ) : Object.keys(grouped).length === 0 ? (
          <Empty>Nothing recorded yet. Add allergies, medications, and conditions above.</Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {ITEM_TYPES.filter((t) => grouped[t.id]?.length).map((t) => (
              <div key={t.id}>
                <h3 className="font-serif text-base font-black mb-1">
                  {t.label}
                </h3>
                <ul className="flex flex-col gap-1">
                  {grouped[t.id].map((it: ProfileItem) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
                    >
                      <div>
                        <span className="font-bold">{it.name}</span>
                        {it.detail && (
                          <span className="text-[12px] opacity-70">
                            {" "}
                            — {it.detail}
                          </span>
                        )}
                        {it.occurred_on && (
                          <span className="text-[11px] opacity-50">
                            {" "}
                            ({fmtDate(it.occurred_on)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="text-[11px] font-bold underline opacity-60 hover:opacity-100"
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

// ---------------- Documents ----------------

function DocumentsTab({ patientId }: { patientId: number }) {
  const { data, loading, error, reload } = useAsync(
    () => api.listDocuments(patientId),
    [patientId],
  );
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<unknown>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (summary.trim()) fd.append("summary", summary.trim());
      await api.uploadDocument(fd);
      setFile(null);
      setSummary("");
      reload();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Panel title="Upload document" subtitle="Lab PDF, scan, wearable export → /documents">
        <form onSubmit={upload} className="flex flex-col gap-2">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary (optional)"
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          />
          <div>
            <button
              type="submit"
              disabled={busy || !file}
              className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
          <ErrorNote error={formError} />
        </form>
      </Panel>

      <Panel title="My documents">
        <ErrorNote error={error} />
        {loading && !data ? (
          <Empty>Loading…</Empty>
        ) : !data || data.length === 0 ? (
          <Empty>No documents uploaded yet.</Empty>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
              >
                <div>
                  <a
                    href={api.documentDownloadUrl(d.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline"
                  >
                    {d.original_name ?? "Document"}
                  </a>
                  {d.summary && (
                    <span className="text-[12px] opacity-70"> — {d.summary}</span>
                  )}
                  <div className="text-[10px] opacity-50">
                    {fmtDate(d.occurred_at)} · {d.mime ?? "file"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.deleteDocument(d.id);
                    reload();
                  }}
                  className="text-[11px] font-bold underline opacity-60 hover:opacity-100"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

// ---------------- Timeline ----------------

function TimelineTab({ patientId }: { patientId: number }) {
  const { data, loading, error } = useAsync(
    () => api.timeline(patientId),
    [patientId],
  );
  const toneFor = (t: string) =>
    t === "assessment"
      ? "pink"
      : t === "observation"
        ? "mint"
        : t === "document"
          ? "amber"
          : "gray";
  return (
    <Panel title="Clinical timeline" subtitle="Merged view → /patients/{id}/timeline">
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>No events yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((e) => (
            <li
              key={`${e.event_type}-${e.id}`}
              className="border-l-2 border-foreground/30 pl-3 py-1"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Pill tone={toneFor(e.event_type) as any}>{e.event_type}</Pill>
                <span className="font-bold">{e.title}</span>
                <span className="text-[10px] opacity-50">
                  {fmtDateTime(e.date)}
                </span>
              </div>
              {e.detail && (
                <p className="text-[12px] opacity-70 mt-0.5">{e.detail}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------- Access requests (incoming) ----------------

function AccessTab() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data, loading, error, reload } = useAsync(
    () => api.incomingRequests(statusFilter),
    [statusFilter],
  );

  const act = async (fn: () => Promise<unknown>) => {
    await fn();
    reload();
  };

  return (
    <Panel
      title="Access requests"
      subtitle="Doctors asking to read your record → /access-requests/incoming"
      right={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1 text-[11px] font-bold"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="revoked">Revoked</option>
        </select>
      }
    >
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>No {statusFilter} requests.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((r) => (
            <li
              key={r.id}
              className="border border-foreground/15 bg-card px-3 py-2 rounded-md flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <div className="font-bold">
                  {r.doctor_name ?? `Doctor #${r.doctor_id}`}{" "}
                  <Pill tone="pink">{r.category.name}</Pill>
                </div>
                {r.reason && (
                  <p className="text-[12px] opacity-70">{r.reason}</p>
                )}
                <div className="text-[10px] opacity-50">
                  requested {fmtDateTime(r.requested_at)}
                  {r.expires_at ? ` · expires ${fmtDate(r.expires_at)}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                {r.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => act(() => api.approveRequest(r.id))}
                      className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)]"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act(() => api.denyRequest(r.id))}
                      className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40"
                    >
                      Deny
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => act(() => api.revokeRequest(r.id))}
                    className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold border border-red-700 text-red-700"
                  >
                    Revoke
                  </button>
                )}
                {r.status !== "pending" && r.status !== "approved" && (
                  <Pill tone="gray">{r.status}</Pill>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
