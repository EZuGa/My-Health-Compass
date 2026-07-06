import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  "…so sad that nothing could cheer you up?",
  "…nervous?",
  "…restless or fidgety?",
  "…hopeless?",
  "…that everything was an effort?",
  "…worthless?",
];

const OPTIONS = [
  { v: 0, label: "None of the time" },
  { v: 1, label: "A little of the time" },
  { v: 2, label: "Some of the time" },
  { v: 3, label: "Most of the time" },
  { v: 4, label: "All of the time" },
];

function severity(score: number) {
  if (score === 0) return { label: "No distress", color: "#2e8540" };
  if (score <= 4) return { label: "Low/mild distress", color: "#b58a00" };
  if (score <= 12) return { label: "Moderate distress", color: "#c2570b" };
  return { label: "Serious psychological distress", color: "#7a0a14" };
}

export function K6Dialog({ onSubmit }: { onSubmit: (score: number) => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(6).fill(null));

  const answered = answers.filter((a) => a !== null) as number[];
  const liveScore = answered.reduce((s, v) => s + v, 0);
  const complete = answered.length === 6;
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
          Take K-6
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">K-6 Psychological Distress Scale</DialogTitle>
          <DialogDescription>
            During the <b>past 30 days</b>, how often did you feel…
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 mt-2">
          {QUESTIONS.map((q, qi) => (
            <li key={qi} className="border-b border-foreground/15 pb-3">
              <div className="font-semibold text-sm mb-2">
                {qi + 1}. {q}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
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
              Live score ({answered.length}/6 answered)
            </div>
            <div className="text-2xl font-extrabold" style={{ color: sev.color }}>
              {liveScore} <span className="text-sm">/ 24 · {sev.label}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAnswers(Array(6).fill(null))}>
            Reset
          </Button>
          <Button
            disabled={!complete}
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
