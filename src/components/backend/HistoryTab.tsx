import { useState } from "react";
import { Panel, Empty, ErrorNote, Pill, useAsync, fmtDate } from "./ui";
import { api, type Assessment } from "@/lib/api";

// Patient's own clinical history — assessments doctors have filed, grouped by
// category. Fronts /patients/me/history, /patients/me/history/{code}, and the
// image download endpoint /images/{id}.

export function HistoryTab() {
  const { data, loading, error } = useAsync(() => api.myHistory(), []);

  return (
    <Panel title="Clinical history" subtitle="Assessments filed by your doctors → /patients/me/history">
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>
          No clinical assessments yet. When a doctor you've granted access files
          one, it shows here.
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((group) => (
            <div key={group.category.id}>
              <h3 className="font-serif text-lg font-black mb-1">
                {group.category.name}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.assessments.map((a) => (
                  <AssessmentCard key={a.id} a={a} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AssessmentCard({ a }: { a: Assessment }) {
  const [open, setOpen] = useState(false);
  const dx =
    a.final_diagnosis_icd10 ||
    a.clinical_diagnosis_icd10 ||
    a.preliminary_diagnosis_icd10;
  return (
    <li className="border border-foreground/15 bg-card px-3 py-2 rounded-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold">
            {dx ?? "Assessment"}{" "}
            <Pill tone="gray">{a.episode_type.replace(/_/g, " ")}</Pill>
          </span>
          <span className="text-[10px] opacity-50">
            {fmtDate(a.visit_date)} · Dr. {a.doctor_name ?? a.doctor_id}
          </span>
        </div>
        {a.diagnosis_description && (
          <p className="text-[12px] opacity-70">{a.diagnosis_description}</p>
        )}
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-foreground/15 text-[12px] flex flex-col gap-1">
          {a.complaints && (
            <div>
              <span className="font-bold">Complaints:</span> {a.complaints}
            </div>
          )}
          {a.treatment_notes && (
            <div>
              <span className="font-bold">Treatment:</span> {a.treatment_notes}
            </div>
          )}
          {a.recommendations && (
            <div>
              <span className="font-bold">Recommendations:</span>{" "}
              {a.recommendations}
            </div>
          )}
          {a.outcome && (
            <div>
              <span className="font-bold">Outcome:</span> {a.outcome}
            </div>
          )}
          {a.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
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
            </div>
          )}
        </div>
      )}
    </li>
  );
}
