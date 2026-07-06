import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAsync, fmtDate } from "@/components/backend/ui";
import { api, getCachedUser, type ProfileItem } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";

// Anamnesis vitae, served from the backend for the signed-in patient.
// (Previously a hardcoded "Mrs. Z" template — now real data per user.)

function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export function MedicalHistoryDialog() {
  const patientId = usePatientId();
  const articleRef = useRef<HTMLElement | null>(null);

  const profile = useAsync(
    () =>
      patientId
        ? api.getProfile(patientId)
        : Promise.resolve({} as Record<string, ProfileItem[]>),
    [patientId],
  );
  const history = useAsync(
    () => (patientId ? api.myHistory() : Promise.resolve([])),
    [patientId],
  );
  const vitals = useAsync(
    () => (patientId ? api.latestVitals(patientId) : Promise.resolve([])),
    [patientId],
  );

  const user = getCachedUser();
  const grouped = profile.data ?? {};

  const downloadPdf = () => {
    if (!articleRef.current) return;
    const html = articleRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Medical History — ${user?.full_name ?? "Patient"}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: 'Iowan Old Style','Palatino Linotype',Georgia,serif; font-size: 12pt; line-height: 1.55; color: #111; }
  h2 { font-size: 13pt; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #000; padding-bottom: 2pt; margin-top: 18pt; }
  dt { font-weight: 700; } dd { margin: 0 0 4pt 14pt; }
  ul { margin: 4pt 0 4pt 18pt; } li { margin-bottom: 2pt; }
  .title { font-size: 16pt; font-weight: 800; margin-bottom: 4pt; }
  .subtitle { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.18em; color: #444; margin-bottom: 14pt; }
</style></head><body>
<div class="title">Medical Record</div>
<div class="subtitle">Health Passport · ${user?.full_name ?? "Patient"}</div>
${html}
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`);
    win.document.close();
  };

  const loading = profile.loading || history.loading || vitals.loading;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-center text-xs uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel cursor-pointer"
          style={{ background: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)", color: "#3a2a55" }}
        >
          Medical History
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[color:var(--background)] border border-foreground/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-xs uppercase tracking-[0.22em] font-extrabold">
            Medical Record · Anamnesis Vitae (from your health record)
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel"
            style={{ background: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)", color: "#3a2a55" }}
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => {
              profile.reload();
              history.reload();
              vitals.reload();
            }}
            className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel opacity-80"
          >
            Refresh
          </button>
        </div>

        <article
          ref={articleRef as never}
          className="mt-4 font-serif text-[15px] leading-[1.75] font-medium text-foreground space-y-5"
        >
          {loading && (
            <p className="italic opacity-70">Loading your record from the backend…</p>
          )}

          <SectionHeading>Patient Identification</SectionHeading>
          <DefList
            items={[
              ["Full legal name", user?.full_name ?? "—"],
              [
                "Date of birth / Age",
                user?.date_of_birth
                  ? `${fmtDate(user.date_of_birth)}${ageFrom(user.date_of_birth) != null ? ` / ${ageFrom(user.date_of_birth)} years` : ""}`
                  : "—",
              ],
              ["Personal number", user?.personal_number ?? "—"],
              ["Blood group", user?.blood_group ?? "—"],
              ["Phone", user?.phone ?? "—"],
            ]}
          />

          <SectionHeading>Past Medical History (chronic conditions)</SectionHeading>
          <ProfileList items={grouped.chronic_condition} empty="No chronic conditions recorded." />

          <SectionHeading>Past Surgical History</SectionHeading>
          <ProfileList items={grouped.surgery} empty="No surgeries recorded." />

          <SectionHeading>Medications</SectionHeading>
          <ProfileList items={grouped.medication} empty="No medications recorded." />

          <SectionHeading>Allergies &amp; Adverse Reactions</SectionHeading>
          <ProfileList items={grouped.allergy} empty="No known allergies (NKDA)." />

          <SectionHeading>Immunizations</SectionHeading>
          <ProfileList items={grouped.immunization} empty="No immunizations recorded." />

          <SectionHeading>Family History</SectionHeading>
          <ProfileList items={grouped.family_history} empty="No family history recorded." />

          <SectionHeading>Social History</SectionHeading>
          <ProfileList items={grouped.social_history} empty="No social history recorded." />

          <SectionHeading>Screening</SectionHeading>
          <ProfileList items={grouped.screening} empty="No screening recorded." />

          <SectionHeading>Diagnostic Data — latest measurements</SectionHeading>
          {vitals.data && vitals.data.length > 0 ? (
            <ul className="list-none pl-0 space-y-1">
              {vitals.data.map((o) => (
                <li key={o.id}>
                  <strong>{o.metric.replace(/_/g, " ")}:</strong>{" "}
                  {o.value_num ?? o.value_text}
                  {o.unit ? ` ${o.unit}` : ""}{" "}
                  <span className="opacity-60 text-[13px]">
                    ({fmtDate(o.observed_at)} · {o.source_kind ?? "manual"})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No measurements recorded yet.</Empty>
          )}

          <SectionHeading>Clinical Assessments</SectionHeading>
          {history.data && history.data.length > 0 ? (
            <div className="space-y-3">
              {history.data.map((group) => (
                <div key={group.category.id}>
                  <h4 className="font-extrabold uppercase tracking-[0.08em] text-[13px]">
                    {group.category.name}
                  </h4>
                  <ul className="mt-1 list-disc pl-6 space-y-1">
                    {group.assessments.map((a) => (
                      <li key={a.id}>
                        <strong>
                          {a.final_diagnosis_icd10 || a.clinical_diagnosis_icd10 || "Assessment"}
                        </strong>
                        {a.diagnosis_description ? ` — ${a.diagnosis_description}` : ""}
                        {a.recommendations ? ` · Plan: ${a.recommendations}` : ""}{" "}
                        <span className="opacity-60 text-[13px]">
                          ({fmtDate(a.visit_date)}
                          {a.doctor_name ? ` · Dr. ${a.doctor_name}` : ""})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              No clinical assessments yet. They appear here once a doctor you've
              granted access files one.
            </Empty>
          )}

          <p className="pt-4 border-t border-foreground/30 text-xs uppercase tracking-[0.18em] font-extrabold">
            Generated from your Health Passport record. Add or edit items under
            Health Records › Medical History.
          </p>
        </article>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-black tracking-tight uppercase mt-6 pb-1 border-b border-foreground/40">
      {children}
    </h3>
  );
}

function DefList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,14rem)_1fr] gap-x-6 gap-y-1">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-extrabold uppercase tracking-[0.06em] text-[12px] pt-1">
            {k}
          </dt>
          <dd className="pt-1">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileList({
  items,
  empty,
}: {
  items: ProfileItem[] | undefined;
  empty: string;
}) {
  if (!items || items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="list-none pl-0 space-y-1">
      {items.map((it) => (
        <li key={it.id}>
          <strong>{it.name}</strong>
          {it.detail ? ` — ${it.detail}` : ""}
          {it.icd10 ? ` [${it.icd10}]` : ""}
          {it.occurred_on ? (
            <span className="opacity-60 text-[13px]"> ({fmtDate(it.occurred_on)})</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="italic text-foreground/60">{children}</p>;
}
