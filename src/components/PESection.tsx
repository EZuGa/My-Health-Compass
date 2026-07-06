import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type System = {
  key: string;
  label: string;
  findings: string[];
};

// Physical-exam findings per CMS body system, synthesized from the literature
// review supplied (Garibaldi & Russell NEJM 2025; Gowda Acad Med 2014; CMS
// 1995/97 documentation guidelines).
const SYSTEMS: System[] = [
  {
    key: "constitutional",
    label: "Constitutional / Vitals",
    findings: [
      "Well-appearing, no acute distress",
      "Ill-appearing",
      "Cachectic",
      "Obese habitus",
      "BP normal",
      "Hypertensive",
      "Hypotensive",
      "Tachycardic",
      "Bradycardic",
      "Tachypneic",
      "Febrile",
      "Afebrile",
      "SpO₂ ≥ 95 % on RA",
      "Hypoxemic on RA",
      "BMI elevated",
    ],
  },
  {
    key: "head",
    label: "Head",
    findings: [
      "Normocephalic, atraumatic",
      "Scalp lesion",
      "Temporal artery tenderness",
      "Facial asymmetry",
    ],
  },
  {
    key: "eyes",
    label: "Eyes",
    findings: [
      "PERRLA",
      "Anisocoria",
      "EOM intact",
      "Conjunctival pallor",
      "Scleral icterus",
      "Conjunctival injection",
      "Visual fields full to confrontation",
      "Fundi: sharp discs, no hemorrhage",
      "Papilledema",
    ],
  },
  {
    key: "ent",
    label: "ENT / Mouth",
    findings: [
      "TMs clear bilaterally",
      "External canal erythema",
      "Nasal mucosa pink, no discharge",
      "Septal deviation",
      "Oropharynx clear",
      "Tonsillar exudate",
      "Dentition intact",
      "Hearing grossly intact",
    ],
  },
  {
    key: "neck",
    label: "Neck",
    findings: [
      "Supple, full ROM",
      "Thyroid non-enlarged",
      "Thyroid nodule palpable",
      "No cervical lymphadenopathy",
      "Cervical lymphadenopathy",
      "JVP not elevated",
      "JVP elevated > 8 cm",
      "Carotid upstrokes 2+ symmetric",
      "Carotid bruit",
      "Trachea midline",
    ],
  },
  {
    key: "cv",
    label: "Cardiovascular",
    findings: [
      "RRR, S1/S2 normal",
      "Irregularly irregular rhythm",
      "No murmurs, rubs, or gallops",
      "Systolic murmur",
      "Diastolic murmur",
      "S3 gallop",
      "S4 gallop",
      "PMI non-displaced",
      "PMI laterally displaced",
      "Pulses 2+ throughout",
      "Diminished distal pulses",
      "No peripheral edema",
      "Lower-extremity edema",
    ],
  },
  {
    key: "resp",
    label: "Respiratory",
    findings: [
      "Clear to auscultation bilaterally",
      "Crackles",
      "Wheezing",
      "Rhonchi",
      "Decreased breath sounds",
      "Dullness to percussion",
      "Hyperresonance",
      "Egophony",
      "Accessory-muscle use",
      "Symmetric chest expansion",
    ],
  },
  {
    key: "breast",
    label: "Breast",
    findings: [
      "Symmetric, no skin changes",
      "Palpable mass",
      "Nipple discharge",
      "Axillary lymphadenopathy",
    ],
  },
  {
    key: "abd",
    label: "Gastrointestinal / Abdomen",
    findings: [
      "Soft, non-tender, non-distended",
      "Tender to palpation",
      "Guarding",
      "Rebound tenderness",
      "Bowel sounds normoactive",
      "Hypoactive bowel sounds",
      "Hepatomegaly",
      "Splenomegaly",
      "No organomegaly",
      "Murphy sign positive",
      "McBurney point tenderness",
      "Shifting dullness",
    ],
  },
  {
    key: "gu",
    label: "Genitourinary",
    findings: [
      "CVA non-tender",
      "CVA tenderness",
      "External genitalia normal",
      "Inguinal hernia",
      "Prostate smooth, non-tender",
      "Prostate nodular",
    ],
  },
  {
    key: "msk",
    label: "Musculoskeletal",
    findings: [
      "Full ROM all joints",
      "Joint swelling",
      "Joint tenderness",
      "Joint effusion",
      "Strength 5/5 throughout",
      "Focal weakness",
      "Spinal tenderness",
      "Straight-leg raise positive",
      "Antalgic gait",
    ],
  },
  {
    key: "skin",
    label: "Skin / Integumentary",
    findings: [
      "Warm, dry, intact",
      "Rash",
      "Ulceration",
      "Pallor",
      "Jaundice",
      "Cyanosis",
      "Diaphoresis",
      "Nail clubbing",
      "Splinter hemorrhages",
      "Poor turgor",
    ],
  },
  {
    key: "lymph",
    label: "Lymphatic",
    findings: [
      "No palpable lymphadenopathy",
      "Cervical adenopathy",
      "Supraclavicular adenopathy",
      "Axillary adenopathy",
      "Inguinal adenopathy",
    ],
  },
  {
    key: "neuro",
    label: "Neurological",
    findings: [
      "Alert and oriented ×3",
      "Cranial nerves II–XII intact",
      "Focal cranial-nerve deficit",
      "Motor 5/5 in all extremities",
      "Focal motor deficit",
      "Sensation intact to light touch",
      "Sensory deficit",
      "DTRs 2+ symmetric",
      "Hyperreflexia",
      "Babinski negative",
      "Babinski positive",
      "Finger-to-nose intact",
      "Romberg negative",
      "Gait steady",
    ],
  },
  {
    key: "psych",
    label: "Psychiatric",
    findings: [
      "Mood and affect appropriate",
      "Depressed affect",
      "Anxious affect",
      "Flat affect",
      "Speech fluent, normal rate",
      "Thought process linear",
      "Disorganized thought",
      "Judgment and insight intact",
      "Denies suicidal ideation",
    ],
  },
];

const STORAGE_KEY = "pe-findings-v1";

function useFindings() {
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch {}
  }, [picks]);
  return [picks, setPicks] as const;
}

export function PESection() {
  const [picks, setPicks] = useFindings();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const activeSystem = useMemo(
    () => SYSTEMS.find((s) => s.key === openKey) ?? null,
    [openKey],
  );

  const toggle = (sysKey: string, finding: string) =>
    setPicks((p) => {
      const cur = p[sysKey] ?? [];
      const next = cur.includes(finding)
        ? cur.filter((x) => x !== finding)
        : [...cur, finding];
      return { ...p, [sysKey]: next };
    });

  return (
    <div className="flex-1 flex flex-col gap-5">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
        {SYSTEMS.map((sys) => {
          const sel = picks[sys.key] ?? [];
          return (
            <section
              key={sys.key}
              className="cloud-panel p-4 flex flex-col h-full"
            >
              <header className="flex items-center justify-between gap-2 border-b border-foreground/30 pb-1">
                <h2 className="font-serif text-base font-black leading-tight">
                  {sys.label}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpenKey(sys.key)}
                  className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#ffc2d2] text-foreground"
                >
                  Select findings
                </button>
              </header>

              <ul className="mt-3 flex flex-col gap-1 text-[13px] font-bold leading-snug flex-1">
                {sel.length === 0 ? (
                  <li className="opacity-60 font-semibold">
                    No findings recorded.
                  </li>
                ) : (
                  sel.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden>•</span>
                      <span>{f}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={!!activeSystem} onOpenChange={(o) => !o && setOpenKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif font-black">
              {activeSystem?.label}
            </DialogTitle>
            <DialogDescription className="font-semibold">
              Tap any finding to add or remove it from the exam note.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-1.5 py-2">
            {activeSystem &&
              (() => {
                const sel = picks[activeSystem.key] ?? [];
                const std = activeSystem.findings;
                const custom = sel.filter((f) => !std.includes(f));
                const rows = [...std, ...custom];
                return rows.map((f) => {
                  const checked = sel.includes(f);
                  const isCustom = !std.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggle(activeSystem.key, f)}
                      className={`text-left px-3 py-2 text-[13px] font-bold flex items-center gap-2 ${
                        checked
                          ? "bg-[#ffc2d2] text-foreground"
                          : "bg-transparent hover:bg-foreground/5"
                      }`}
                    >
                      <span className="font-black w-4">{checked ? "✓" : "○"}</span>
                      <span>{f}</span>
                      {isCustom && (
                        <span className="ml-auto text-[9px] uppercase tracking-wider opacity-60">
                          custom
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
          </div>

          {activeSystem && (
            <CustomFindingInput
              onAdd={(value) => {
                const v = value.trim();
                if (!v) return;
                setPicks((p) => {
                  const cur = p[activeSystem.key] ?? [];
                  if (cur.includes(v)) return p;
                  return { ...p, [activeSystem.key]: [...cur, v] };
                });
              }}
            />
          )}


          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-foreground text-background"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomFindingInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  };
  return (
    <div className="flex gap-2 pt-2 border-t border-foreground/20">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 200))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Add custom finding…"
        className="flex-1 px-3 py-2 text-[13px] font-bold bg-transparent border border-foreground/40 focus:outline-none focus:border-foreground"
      />
      <button
        type="button"
        onClick={submit}
        className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-[#ffc2d2] text-foreground"
      >
        Add
      </button>
    </div>
  );
}
