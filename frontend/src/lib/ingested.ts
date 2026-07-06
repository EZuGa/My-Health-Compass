import { useEffect, useState } from "react";
import type { IngestResult, IngestedObservation } from "@/lib/ingest.functions";

const INGEST_STORE = "hp-ingested-v1";

const SECTION_LABEL: Record<string, string> = {
  "patient-id": "1. Patient ID",
  "chief-complaint": "2. Chief Complaint",
  hpi: "3. HPI",
  pmh: "4. Past Medical Hx",
  psh: "5. Past Surgical Hx",
  meds: "6. Medications",
  allergies: "7. Allergies",
  fhx: "8. Family Hx",
  shx: "9. Social Hx",
  imm: "10. Immunizations",
  ros: "11. Review of Systems",
  pe: "12. Physical Exam",
  dx: "13. Diagnostic Data",
  timeline: "14. Clinical Timeline",
  nutrition: "15. Nutrition",
};

type StoredBatch = IngestResult & { id: string; at: string };

export function getSectionLabel(id: string) {
  return SECTION_LABEL[id] ?? id;
}

export function useIngestedObservations(sectionId?: string) {
  const [obs, setObs] = useState<
    Array<IngestedObservation & { batchId: string; at: string }>
  >([]);
  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(INGEST_STORE);
        if (!raw) return setObs([]);
        const batches = JSON.parse(raw) as StoredBatch[];
        const flat = batches.flatMap((b) =>
          (b.observations ?? []).map((o) => ({
            ...o,
            batchId: b.id,
            at: b.at,
          })),
        );
        setObs(sectionId ? flat.filter((o) => o.section === sectionId) : flat);
      } catch {
        setObs([]);
      }
    }
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === INGEST_STORE) load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("hp-ingest-updated", load);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hp-ingest-updated", load);
    };
  }, [sectionId]);
  return obs;
}
