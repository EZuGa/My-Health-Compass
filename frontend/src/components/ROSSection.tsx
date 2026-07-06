import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Status = "pos" | "neg" | "unk";

type System = {
  key: string;
  label: string;
  ref: string;
  symptoms: string[];
};

// CMS 14-system ROS; symptom lists drawn from the literature review supplied.
const SYSTEMS: System[] = [
  { key: "constitutional", label: "Constitutional", ref: "CMS 1995/97",
    symptoms: ["Fever", "Weight change", "Fatigue", "Night sweats", "Anorexia"] },
  { key: "eyes", label: "Eyes", ref: "CMS",
    symptoms: ["Vision change", "Eye pain", "Discharge", "Diplopia", "Photophobia"] },
  { key: "ent", label: "ENT / Mouth", ref: "CMS",
    symptoms: ["Hearing loss", "Sore throat", "Congestion", "Epistaxis", "Hoarseness"] },
  { key: "cv", label: "Cardiovascular", ref: "Garibaldi & Russell, NEJM 2025",
    symptoms: ["Chest pain", "Palpitations", "Edema", "Orthopnea", "PND", "Syncope"] },
  { key: "resp", label: "Respiratory", ref: "Bohadana, NEJM 2014",
    symptoms: ["Dyspnea", "Cough", "Wheezing", "Hemoptysis", "Sputum"] },
  { key: "gi", label: "Gastrointestinal", ref: "Brown, J Clin Gastro 2003",
    symptoms: ["Nausea", "Abdominal pain", "Diarrhea", "Constipation", "Hematochezia", "Reflux"] },
  { key: "gu", label: "Genitourinary", ref: "CMS",
    symptoms: ["Dysuria", "Frequency", "Hematuria", "Urgency", "Incontinence"] },
  { key: "msk", label: "Musculoskeletal", ref: "Daniels, NEJM 2026",
    symptoms: ["Joint pain", "Stiffness", "Swelling", "Back pain", "Myalgia"] },
  { key: "skin", label: "Integumentary", ref: "CMS",
    symptoms: ["Rash", "Lesions", "Pruritus", "Bruising", "Hair loss"] },
  { key: "neuro", label: "Neurological", ref: "Shah, JAMA 2026",
    symptoms: ["Headache", "Dizziness", "Weakness", "Numbness", "Seizure", "Memory change"] },
  { key: "psych", label: "Psychiatric", ref: "CMS",
    symptoms: ["Depression", "Anxiety", "Insomnia", "Suicidal ideation"] },
  { key: "endo", label: "Endocrine", ref: "Hanley, JAMA Peds 2016",
    symptoms: ["Heat intolerance", "Cold intolerance", "Polydipsia", "Polyuria", "Galactorrhea"] },
  { key: "heme", label: "Hematologic / Lymphatic", ref: "CMS",
    symptoms: ["Easy bruising", "Lymphadenopathy", "Bleeding", "Pallor"] },
  { key: "allergy", label: "Allergic / Immunologic", ref: "CMS",
    symptoms: ["Environmental allergies", "Recurrent infections", "Urticaria"] },
];

const STORAGE_KEY = "ros-answers-v1";
const CUSTOM_KEY = "ros-custom-v1";

function useAnswers() {
  const [answers, setAnswers] = useState<Record<string, Status>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch {}
  }, [answers]);
  return [answers, setAnswers] as const;
}

function useCustom() {
  const [custom, setCustom] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch {}
  }, [custom]);
  return [custom, setCustom] as const;
}

function cycle(s: Status | undefined): Status {
  if (s === "pos") return "neg";
  if (s === "neg") return "unk";
  return "pos";
}

function statusLabel(s: Status | undefined): string {
  if (s === "pos") return "Positive";
  if (s === "neg") return "Denies";
  return "Unasked";
}

export function ROSSection() {
  const [answers, setAnswers] = useAnswers();
  const [custom, setCustom] = useCustom();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const activeSystem = useMemo(
    () => SYSTEMS.find((s) => s.key === openKey) ?? null,
    [openKey],
  );

  const summary = useMemo(() => {
    return SYSTEMS.map((sys) => {
      const all = [...sys.symptoms, ...(custom[sys.key] ?? [])];
      const pos: string[] = [];
      const neg: string[] = [];
      all.forEach((sym) => {
        const k = `${sys.key}:${sym}`;
        if (answers[k] === "pos") pos.push(sym);
        else if (answers[k] === "neg") neg.push(sym);
      });
      return { sys, pos, neg };
    });
  }, [answers, custom]);

  const set = (k: string, v: Status) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
        {summary.map(({ sys, pos, neg }) => (
          <section key={sys.key} className="cloud-panel p-4 flex flex-col h-full">
            <header className="flex items-center justify-between gap-2 border-b border-foreground/30 pb-1">
              <h2 className="font-serif text-base font-black leading-tight">{sys.label}</h2>
              <button
                type="button"
                onClick={() => setOpenKey(sys.key)}
                className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#ffc2d2] text-foreground"
              >
                Select symptoms
              </button>
            </header>

            <div className="mt-3 text-[13px] font-bold leading-snug flex-1">
              {pos.length === 0 && neg.length === 0 ? (
                <span className="opacity-60 font-semibold">No symptoms recorded.</span>
              ) : (
                <>
                  {pos.length > 0 && (
                    <div>
                      <span className="font-black uppercase tracking-wider text-[10px]" style={{ color: "#d97a92" }}>
                        Positives:
                      </span>{" "}
                      {pos.join(", ")}.
                    </div>
                  )}
                  {neg.length > 0 && (
                    <div className="mt-1">
                      <span className="font-black uppercase tracking-wider text-[10px]">
                        Denies:
                      </span>{" "}
                      {neg.join(", ")}.
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!activeSystem} onOpenChange={(o) => !o && setOpenKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif font-black">
              {activeSystem?.label}
            </DialogTitle>
            <DialogDescription className="font-semibold">
              Tap a symptom to cycle: positive → denies → unasked.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-1.5 py-2">
            {activeSystem &&
              (() => {
                const std = activeSystem.symptoms;
                const extra = custom[activeSystem.key] ?? [];
                const rows = [...std, ...extra];
                return rows.map((sym) => {
                  const k = `${activeSystem.key}:${sym}`;
                  const s = answers[k];
                  const isCustom = !std.includes(sym);
                  const cls =
                    s === "pos"
                      ? "bg-[#ffc2d2] text-foreground"
                      : s === "neg"
                      ? "bg-foreground text-background"
                      : "bg-transparent hover:bg-foreground/5";
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => set(k, cycle(s))}
                      className={`text-left px-3 py-2 text-[13px] font-bold flex items-center gap-2 ${cls}`}
                    >
                      <span className="font-black w-4">
                        {s === "pos" ? "+" : s === "neg" ? "−" : "○"}
                      </span>
                      <span>{sym}</span>
                      <span className="ml-auto text-[9px] uppercase tracking-wider opacity-70">
                        {isCustom ? "custom · " : ""}
                        {statusLabel(s)}
                      </span>
                    </button>
                  );
                });
              })()}
          </div>

          {activeSystem && (
            <CustomSymptomInput
              onAdd={(value) => {
                const v = value.trim();
                if (!v || !activeSystem) return;
                setCustom((c) => {
                  const cur = c[activeSystem.key] ?? [];
                  if (cur.includes(v) || activeSystem.symptoms.includes(v)) return c;
                  return { ...c, [activeSystem.key]: [...cur, v] };
                });
                setAnswers((a) => ({ ...a, [`${activeSystem.key}:${v}`]: "pos" }));
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

function CustomSymptomInput({ onAdd }: { onAdd: (value: string) => void }) {
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
        placeholder="Add custom symptom…"
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
