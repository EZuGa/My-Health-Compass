import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  "In most ways my life is close to my ideal",
  "The conditions of my life are excellent",
  "I am satisfied with my life",
  "So far I have gotten the important things I want in life",
  "If I could live my life over, I would change almost nothing",
];

const OPTIONS = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Slightly disagree" },
  { v: 4, label: "Neither" },
  { v: 5, label: "Slightly agree" },
  { v: 6, label: "Agree" },
  { v: 7, label: "Strongly agree" },
];

function severity(score: number) {
  if (score >= 31) return { label: "Extremely satisfied", color: "#2e8540" };
  if (score >= 26) return { label: "Satisfied", color: "#3a9b4a" };
  if (score >= 21) return { label: "Slightly satisfied", color: "#7a9b3a" };
  if (score === 20) return { label: "Neutral", color: "#b58a00" };
  if (score >= 15) return { label: "Slightly dissatisfied", color: "#c2570b" };
  if (score >= 10) return { label: "Dissatisfied", color: "#a8201a" };
  return { label: "Extremely dissatisfied", color: "#7a0a14" };
}

// Map SWLS 5-35 → metric scale 0-10 (one decimal).
export function swlsToMetric(score: number) {
  return +(((score - 5) / 30) * 10).toFixed(1);
}

export function SWLSDialog({ onSubmit }: { onSubmit: (metricValue: number) => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));

  const answered = answers.filter((a) => a !== null) as number[];
  const liveScore = answered.reduce((s, v) => s + v, 0);
  const complete = answered.length === 5;
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
          Take SWLS
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Satisfaction With Life Scale (SWLS)</DialogTitle>
          <DialogDescription>
            Indicate your agreement with each statement using the 1–7 scale below.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 mt-2">
          {QUESTIONS.map((q, qi) => (
            <li key={qi} className="border-b border-foreground/15 pb-3">
              <div className="font-semibold text-sm mb-2">
                {qi + 1}. {q}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                {OPTIONS.map((opt) => {
                  const selected = answers[qi] === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => {
                          const next = [...prev];
                          next[qi] = opt.v;
                          return next;
                        })
                      }
                      className={`rounded-md px-2 py-1.5 text-[11px] font-bold border transition-colors text-left ${
                        selected
                          ? "bg-[#a8201a] text-white border-[#a8201a]"
                          : "bg-background border-foreground/25 hover:border-[#d94560] hover:bg-[#fce8ea]"
                      }`}
                    >
                      <span className="opacity-70 mr-1">{opt.v}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        <div
          className="mt-3 p-3 rounded-md flex items-center justify-between"
          style={{ background: "#fce8ea", border: `1px solid ${sev.color}` }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-bold opacity-70">
              Live score ({answered.length}/5 answered)
            </div>
            <div className="text-2xl font-extrabold" style={{ color: sev.color }}>
              {liveScore} <span className="text-sm">/ 35 · {sev.label}</span>
            </div>
            <div className="text-[11px] font-semibold opacity-70 mt-0.5">
              Chart value: {swlsToMetric(liveScore)} / 10
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAnswers(Array(5).fill(null))}>
            Reset
          </Button>
          <Button
            disabled={!complete}
            onClick={() => {
              onSubmit(swlsToMetric(liveScore));
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
