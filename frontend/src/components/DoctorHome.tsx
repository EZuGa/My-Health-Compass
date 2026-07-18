import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Panel, ErrorNote, Empty, useAsync } from "@/components/backend/ui";
import { DoctorDashboard, OutgoingRequests, RequestAccess } from "@/components/doctor";
import { api, type Category, type PatientSummary } from "@/lib/api";
import { qk, STATIC_STALE_TIME } from "@/lib/queries";
import { setSelectedPatient } from "@/lib/selectedPatient";

// Doctor landing page: find a patient (same lookup logic the old Clinical
// Console used — load the visit summary, which requires an approved grant),
// plus the practice overview and access & consent panels. Opening a patient
// stores the selection and sends the doctor into the shared app pages.

export function DoctorHome() {
  const navigate = useNavigate();
  const categories = useAsync<Category[]>(qk.categories, () => api.listCategories(), {
    staleTime: STATIC_STALE_TIME,
  });

  const open = (p: { id: number; name: string }) => {
    setSelectedPatient(p);
    navigate({ to: "/" });
  };

  return (
    <>
      <section className="max-w-5xl w-full">
        <h1 className="font-serif text-3xl font-black">Find a patient</h1>
        <p className="mt-1 text-sm font-semibold opacity-70">
          Search a patient you treat to open their full record — clinical record, history,
          documents, calendar. No grant yet? Request access below.
        </p>
      </section>

      <div className="max-w-5xl w-full flex flex-col gap-6">
        <PatientSearch onOpen={open} />

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl font-black border-b border-foreground/20 pb-1">
            Overview
          </h2>
          <DoctorDashboard onOpenPatient={open} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl font-black border-b border-foreground/20 pb-1">
            Access &amp; consent
          </h2>
          <RequestAccess categories={categories.data ?? []} />
          <OutgoingRequests />
        </section>
      </div>
    </>
  );
}

function PatientSearch({ onOpen }: { onOpen: (p: { id: number; name: string }) => void }) {
  const [patientIdRaw, setPatientIdRaw] = useState("");
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
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
      title="Patient search"
      subtitle="Open the visit summary → /patients/{id}/summary (needs a grant)"
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
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      <ErrorNote error={error} />

      {summary && loadedId != null && (
        <div className="border border-foreground/15 bg-card px-3 py-3 rounded-md flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-serif text-lg font-black">{summary.full_name}</div>
            <div className="text-[12px] opacity-70">
              {summary.age != null ? `${summary.age} yrs · ` : ""}
              {summary.blood_group ? `${summary.blood_group} · ` : ""}
              {summary.personal_number ?? ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpen({ id: loadedId, name: summary.full_name })}
            className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)]"
          >
            Open record
          </button>
        </div>
      )}
      {!summary && !error && !busy && (
        <Empty>
          Enter a patient id — the ids of patients who granted you access are listed under Overview
          below.
        </Empty>
      )}
    </Panel>
  );
}
