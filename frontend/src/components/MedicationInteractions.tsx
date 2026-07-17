// Evidence-based pairwise interactions among the patient's currently active
// medications. Two sources are shown side by side:
//   1. Curated — hand-verified pairs with citations to guidelines / labels.
//   2. Live — fetched on demand from the FDA Structured Product Label via
//      OpenFDA (open.fda.gov), one label per active drug.
// Both update automatically when the medications list changes.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { fetchLiveInteractions } from "@/lib/drug-interactions.functions";
import { api, type ProfileItem } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";
import { useAsync } from "@/components/backend/ui";

type Severity = "major" | "moderate" | "minor" | "none";

type Interaction = {
  a: string; // drug key (lowercase substring matched against medications)
  b: string;
  severity: Severity;
  mechanism: string;
  effect: string;
  management: string;
  evidence: { label: string; url: string }[];
};

// Pairwise evidence base. Keys match a substring of the medication label.
const INTERACTIONS: Interaction[] = [
  {
    a: "lisinopril",
    b: "aspirin",
    severity: "moderate",
    mechanism:
      "NSAIDs (including aspirin at analgesic doses) blunt prostaglandin-mediated vasodilation in the renal afferent arteriole and reduce ACE-inhibitor antihypertensive effect.",
    effect:
      "Low-dose aspirin 81 mg for cardioprotection has minimal blood-pressure impact; risk of acute kidney injury rises with volume depletion, CKD, or concomitant diuretic ('triple whammy').",
    management:
      "Continue 81 mg for primary prevention. Monitor creatinine/eGFR and potassium 1–2 weeks after any dose change; avoid adding a loop/thiazide diuretic without re-checking renal function.",
    evidence: [
      { label: "ACC/AHA 2017 Hypertension Guideline §9.2", url: "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065" },
      { label: "Lapi F et al., BMJ 2013;346:e8525 (triple whammy & AKI)", url: "https://www.bmj.com/content/346/bmj.e8525" },
    ],
  },
  {
    a: "lisinopril",
    b: "metformin",
    severity: "minor",
    mechanism:
      "ACE inhibition increases insulin sensitivity and, if lisinopril causes acute kidney injury, can raise metformin plasma levels (renally cleared).",
    effect:
      "Small additive glucose-lowering effect; theoretical increase in lactic-acidosis risk only if eGFR falls below 30 mL/min/1.73 m².",
    management:
      "Recheck eGFR with any lisinopril dose change. Hold metformin if eGFR < 30 or during acute illness with volume depletion.",
    evidence: [
      { label: "FDA metformin label — Warnings (Lactic Acidosis)", url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/020357s037s039,021202s021s023lbl.pdf" },
      { label: "Scheen AJ, Diabetes Care 2017 (RAAS & insulin sensitivity)", url: "https://diabetesjournals.org/care/article/40/12/1605/30038" },
    ],
  },
  {
    a: "atorvastatin",
    b: "aspirin",
    severity: "minor",
    mechanism:
      "Both are metabolized hepatically; combined use is the standard of care in atherosclerotic risk reduction with no clinically meaningful pharmacokinetic interaction.",
    effect:
      "Synergistic cardiovascular benefit; no increase in major bleeding attributable to statin co-administration.",
    management:
      "No dose adjustment required. Continue as primary-prevention combination per ACC/AHA risk stratification.",
    evidence: [
      { label: "ACC/AHA 2018 Cholesterol Guideline", url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625" },
    ],
  },
  {
    a: "atorvastatin",
    b: "vitamin d",
    severity: "minor",
    mechanism:
      "Atorvastatin and 25-OH vitamin D share CYP3A4 metabolism; statin therapy modestly raises serum 25-OH D, and adequate vitamin D may reduce statin-associated muscle symptoms.",
    effect:
      "Net favorable: small rise in 25-OH D; possible reduction in myalgia incidence in vitamin-D-replete patients.",
    management:
      "Continue current doses. Recheck 25-OH D every 6–12 months; investigate any new myalgia with CK before attributing to statin.",
    evidence: [
      { label: "Pérez-Castrillón JL et al., Am J Cardiol 2007", url: "https://pubmed.ncbi.nlm.nih.gov/17996517/" },
      { label: "Michalska-Kasiczak M et al., Int J Cardiol 2015 (meta-analysis)", url: "https://pubmed.ncbi.nlm.nih.gov/25827594/" },
    ],
  },
  {
    a: "atorvastatin",
    b: "lisinopril",
    severity: "none",
    mechanism: "No shared metabolic pathway; no pharmacodynamic overlap.",
    effect: "No clinically significant interaction reported.",
    management: "No action required.",
    evidence: [
      { label: "Lexicomp / Micromedex interaction database", url: "https://www.uptodate.com/contents/search?search=atorvastatin+lisinopril" },
    ],
  },
  {
    a: "metformin",
    b: "aspirin",
    severity: "none",
    mechanism: "Independent elimination pathways; no documented pharmacokinetic interaction.",
    effect: "No clinically significant interaction.",
    management: "No action required.",
    evidence: [
      { label: "FDA metformin label — Drug Interactions", url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/020357s037s039,021202s021s023lbl.pdf" },
    ],
  },
];

const SEVERITY_STYLE: Record<Severity, { bg: string; fg: string; label: string }> = {
  major: { bg: "#7a1c2e", fg: "#fff", label: "Major" },
  moderate: { bg: "#ffc2d2", fg: "#5a1a2e", label: "Moderate" },
  minor: { bg: "#ece3ff", fg: "#3a2a55", label: "Minor" },
  none: { bg: "#bcd0a6", fg: "#1a2a18", label: "No interaction" },
};

type Drug = { key: string; label: string; detail: string };

// The patient's active medications come from the backend profile (item_type
// 'medication'); the interaction evidence base above is reference knowledge.
function activeDrugs(profile: Record<string, ProfileItem[]>): Drug[] {
  return (profile.medication ?? []).map((m) => ({
    key: m.name.toLowerCase(),
    label: m.name,
    detail: m.detail ?? "",
  }));
}

function matchPair(drugs: Drug[]) {
  return INTERACTIONS.filter((i) => {
    const hasA = drugs.some((d) => d.key.includes(i.a));
    const hasB = drugs.some((d) => d.key.includes(i.b));
    return hasA && hasB;
  });
}

export function MedicationInteractions() {
  const patientId = usePatientId();
  const profileQ = useAsync(
    () =>
      patientId
        ? api.getProfile(patientId)
        : Promise.resolve({} as Record<string, ProfileItem[]>),
    [patientId],
  );
  const drugs = activeDrugs(profileQ.data ?? {});
  const pairs = matchPair(drugs);
  const ordered = [...pairs].sort((x, y) => {
    const rank: Record<Severity, number> = { major: 0, moderate: 1, minor: 2, none: 3 };
    return rank[x.severity] - rank[y.severity];
  });

  const fetchLive = useServerFn(fetchLiveInteractions);
  const live = useQuery({
    queryKey: ["live-interactions", drugs.map((d) => d.label).sort().join("|")],
    queryFn: () => fetchLive({ data: { drugs: drugs.map((d) => d.label) } }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="flex-1 flex flex-col">
      <p className="max-w-4xl font-semibold">
        Interaction screen across {drugs.length} active medications. The
        <span className="font-black"> curated</span> block is hand-verified against guidelines and
        FDA labels; the <span className="font-black">live FDA label</span> block pulls the
        Drug-Interactions section of each medication's Structured Product Label from OpenFDA in
        real time. Both update automatically as the medication list changes.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {drugs.map((d) => (
          <span
            key={d.label}
            className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] font-extrabold rounded-md cloud-panel"
          >
            {d.label}
          </span>
        ))}
      </div>

      <h2 className="mt-8 font-serif text-2xl font-black border-b border-foreground/40 pb-1">
        Curated pairwise interactions
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        {ordered.map((i) => {
          const sev = SEVERITY_STYLE[i.severity];
          const drugA = drugs.find((d) => d.key.includes(i.a))?.label ?? i.a;
          const drugB = drugs.find((d) => d.key.includes(i.b))?.label ?? i.b;
          return (
            <article key={`${i.a}-${i.b}`} className="cloud-panel p-5 flex flex-col gap-3">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-xl font-black">
                  {drugA} <span className="opacity-50">×</span> {drugB}
                </h3>
                <span
                  className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-extrabold rounded-md"
                  style={{ background: sev.bg, color: sev.fg }}
                >
                  {sev.label}
                </span>
              </header>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">Mechanism</dt>
                  <dd className="mt-1 text-sm font-semibold leading-snug">{i.mechanism}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">Expected effect</dt>
                  <dd className="mt-1 text-sm font-semibold leading-snug">{i.effect}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">Management</dt>
                  <dd className="mt-1 text-sm font-semibold leading-snug">{i.management}</dd>
                </div>
              </dl>
              <footer className="border-t border-foreground/20 pt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">Evidence</span>
                {i.evidence.map((e) => (
                  <a
                    key={e.url}
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold underline decoration-foreground/50 hover:decoration-foreground"
                  >
                    {e.label}
                  </a>
                ))}
              </footer>
            </article>
          );
        })}
      </div>

      <h2 className="mt-10 font-serif text-2xl font-black border-b border-foreground/40 pb-1 flex items-baseline justify-between gap-2">
        <span>Live FDA label evidence</span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold opacity-70">
          OpenFDA · open.fda.gov
        </span>
      </h2>

      {live.isLoading && (
        <p className="mt-4 text-sm font-semibold opacity-70">Fetching current FDA labels…</p>
      )}
      {live.isError && (
        <p className="mt-4 text-sm font-bold text-[#7a1c2e]">
          Could not reach OpenFDA: {(live.error as Error).message}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {live.data?.labels.map((lbl) => (
          <article key={lbl.drug} className="cloud-panel p-5 flex flex-col gap-2">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-xl font-black">
                {lbl.drug}
                {lbl.genericName && (
                  <span className="ml-2 text-xs font-bold uppercase tracking-wider opacity-60">
                    {lbl.genericName}
                  </span>
                )}
              </h3>
              <a
                href={lbl.source}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] uppercase tracking-[0.2em] font-extrabold underline opacity-70 hover:opacity-100"
              >
                FDA label →
              </a>
            </header>
            <p className="text-sm font-medium leading-snug whitespace-pre-line">{lbl.text}</p>
          </article>
        ))}
        {live.data?.errors.map((e) => (
          <div
            key={e.drug}
            className="cloud-panel p-3 text-xs font-bold opacity-70"
          >
            <span className="uppercase tracking-wider">{e.drug}</span> — {e.message}
          </div>
        ))}
      </div>
    </section>
  );
}
