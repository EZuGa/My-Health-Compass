import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Item = { id: string; label: string; max: number; hint?: string };
type Domain = { domain: string; items: Item[] };

const DOMAINS: Domain[] = [
  {
    domain: "Visuospatial / Executive",
    items: [
      { id: "trail", label: "Trail making (alternating 1–A–2–B…)", max: 1 },
      { id: "cube", label: "Cube copy", max: 1 },
      { id: "clock_contour", label: "Clock — contour", max: 1 },
      { id: "clock_numbers", label: "Clock — numbers", max: 1 },
      { id: "clock_hands", label: "Clock — hands (11:10)", max: 1 },
    ],
  },
  {
    domain: "Naming",
    items: [
      { id: "lion", label: "Lion", max: 1 },
      { id: "rhino", label: "Rhinoceros", max: 1 },
      { id: "camel", label: "Camel", max: 1 },
    ],
  },
  {
    domain: "Attention",
    items: [
      { id: "digit_fwd", label: "Digit span forward (5 digits)", max: 1 },
      { id: "digit_bwd", label: "Digit span backward (3 digits)", max: 1 },
      { id: "tap_a", label: "Letter A tapping (≤1 error)", max: 1 },
      { id: "serial7", label: "Serial 7 subtraction", max: 3, hint: "0 = 0–1 correct, 1 = 2–3, 2 = 4, 3 = 5 correct" },
    ],
  },
  {
    domain: "Language",
    items: [
      { id: "rep1", label: "Sentence repetition #1", max: 1 },
      { id: "rep2", label: "Sentence repetition #2", max: 1 },
      { id: "fluency", label: "Letter F fluency (≥11 words/min)", max: 1 },
    ],
  },
  {
    domain: "Abstraction",
    items: [
      { id: "abs1", label: "Train–bicycle", max: 1 },
      { id: "abs2", label: "Watch–ruler", max: 1 },
    ],
  },
  {
    domain: "Delayed Recall",
    items: [
      { id: "r_face", label: "FACE — recalled", max: 1 },
      { id: "r_velvet", label: "VELVET — recalled", max: 1 },
      { id: "r_church", label: "CHURCH — recalled", max: 1 },
      { id: "r_daisy", label: "DAISY — recalled", max: 1 },
      { id: "r_red", label: "RED — recalled", max: 1 },
    ],
  },
  {
    domain: "Orientation",
    items: [
      { id: "o_date", label: "Date", max: 1 },
      { id: "o_month", label: "Month", max: 1 },
      { id: "o_year", label: "Year", max: 1 },
      { id: "o_day", label: "Day", max: 1 },
      { id: "o_place", label: "Place", max: 1 },
      { id: "o_city", label: "City", max: 1 },
    ],
  },
];

function severity(score: number) {
  if (score >= 26) return { label: "Normal cognition", color: "#2e8540" };
  if (score >= 18) return { label: "Mild impairment", color: "#b58a00" };
  if (score >= 10) return { label: "Moderate impairment", color: "#c2570b" };
  return { label: "Severe impairment", color: "#7a0a14" };
}

export function MoCADialog({ onSubmit }: { onSubmit: (score: number) => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [eduBonus, setEduBonus] = useState(false); // ≤12 years schooling → +1

  const raw = Object.values(answers).reduce((s, v) => s + v, 0);
  const liveScore = Math.min(30, raw + (eduBonus ? 1 : 0));
  const sev = severity(liveScore);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-md transition-transform hover:scale-[1.03] active:scale-95"
          style={{
            background: "linear-gradient(135deg, #d94560 0%, #a8201a 100%)",
            boxShadow: "0 2px 8px rgba(168,32,26,0.35)",
          }}
        >
          Take MoCA
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Montreal Cognitive Assessment (MoCA)</DialogTitle>
          <DialogDescription>
            Score each task as it is performed. Total is out of 30. Add +1 if the person has ≤12 years of formal education.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {DOMAINS.map((d) => (
            <div key={d.domain} className="border-b border-foreground/15 pb-3">
              <div className="font-extrabold text-sm uppercase tracking-wider mb-2 opacity-80">
                {d.domain}
              </div>
              <ul className="space-y-2">
                {d.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold flex-1">
                      {it.label}
                      {it.hint && (
                        <div className="text-[11px] font-normal opacity-60">{it.hint}</div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {Array.from({ length: it.max + 1 }, (_, v) => {
                        const selected = (answers[it.id] ?? -1) === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setAnswers((p) => ({ ...p, [it.id]: v }))}
                            className={`w-8 h-8 rounded-md text-[12px] font-bold border transition-colors ${
                              selected
                                ? "bg-[#a8201a] text-white border-[#a8201a]"
                                : "bg-background border-foreground/25 hover:border-[#d94560] hover:bg-[#fce8ea]"
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={eduBonus}
              onChange={(e) => setEduBonus(e.target.checked)}
              className="h-4 w-4 accent-[#a8201a]"
            />
            ≤12 years of formal education (+1 point)
          </label>
        </div>

        <div
          className="mt-3 p-3 rounded-md flex items-center justify-between"
          style={{ background: "#fce8ea", border: `1px solid ${sev.color}` }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-bold opacity-70">
              Live score
            </div>
            <div className="text-2xl font-extrabold" style={{ color: sev.color }}>
              {liveScore} <span className="text-sm">/ 30 · {sev.label}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setAnswers({}); setEduBonus(false); }}>
            Reset
          </Button>
          <Button
            onClick={() => {
              onSubmit(liveScore);
              setOpen(false);
            }}
            style={{ background: "#a8201a", color: "white" }}
          >
            Save score
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
