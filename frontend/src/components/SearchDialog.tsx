import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { nejmSections, auxiliarySections, boxes, diagnostics } from "@/data/health";
import { askSearch } from "@/lib/search.functions";
import { buildPatientContext } from "@/lib/patientContext";

type Hit = {
  label: string;
  sublabel?: string;
  to: string;
  params?: Record<string, string>;
};

const auxRoute: Record<string, string> = {
  interactions: "/section/interactions",
};

function buildIndex(): Hit[] {
  const hits: Hit[] = [];
  for (const s of nejmSections) {
    const to = s.id === "timeline" ? "/timeline" : `/section/${s.id}`;
    hits.push({ label: s.title, sublabel: "Section", to });
  }
  for (const s of auxiliarySections) {
    hits.push({ label: s.title, sublabel: "Section", to: auxRoute[s.id] ?? `/section/${s.id}` });
  }
  for (const b of boxes) {
    hits.push({ label: b.title, sublabel: `Domain · ${b.subtitle}`, to: `/box/${b.id}` });
  }
  for (const d of diagnostics) {
    hits.push({ label: d.name, sublabel: `Diagnostic · ${d.category}`, to: `/diagnostic/${d.id}` });
  }
  const extra: Array<[string, string]> = [
    ["Calendar", "/calendar"],
    ["Data Connections", "/connections"],
    ["Medical Forms", "/forms"],
    ["ToxCheck", "/toxcheck"],
  ];
  for (const [label, to] of extra) hits.push({ label, sublabel: "Tab", to });
  return hits;
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const ask = useServerFn(askSearch);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => buildIndex(), []);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return index
      .filter((h) => h.label.toLowerCase().includes(term) || (h.sublabel ?? "").toLowerCase().includes(term))
      .slice(0, 12);
  }, [q, index]);

  useEffect(() => {
    if (open) {
      setQ("");
      setAnswer(null);
      setErr(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isQuestion = q.trim().length > 0 && (q.includes("?") || q.trim().split(/\s+/).length >= 4);

  const handleAsk = async () => {
    if (!q.trim()) return;
    setAsking(true);
    setErr(null);
    setAnswer(null);
    try {
      const patientContext = buildPatientContext();
      const res = await ask({ data: { question: q.trim(), patientContext } });
      setAnswer(res.answer || "No response.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setAsking(false);
    }
  };

  const go = (h: Hit) => {
    onClose();
    navigate({ to: h.to });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-background rounded-xl shadow-2xl border border-foreground/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/15">
          <Search className="w-4 h-4 opacity-60" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAnswer(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (results.length > 0 && !isQuestion) go(results[0]);
                else handleAsk();
              }
            }}
            placeholder="Search sections, labs, or ask a question…"
            className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:opacity-50"
          />
          <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim() && (
            <button
              type="button"
              onClick={handleAsk}
              disabled={asking}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-bold border-b border-foreground/10 hover:bg-[color:var(--mint-soft)] disabled:opacity-60"
            >
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Answer from patient data: <span className="font-normal italic opacity-80">"{q.trim()}"</span>
            </button>
          )}

          {answer && (
            <div className="px-4 py-3 border-b border-foreground/10 text-sm whitespace-pre-wrap bg-[color:var(--mint-soft)]">
              {answer}
              <div className="mt-2 text-[10px] uppercase tracking-wider opacity-60 font-extrabold">
                Answered from this patient's record only.
              </div>
            </div>
          )}
          {err && <div className="px-4 py-3 text-sm text-red-700 border-b border-foreground/10">{err}</div>}

          {results.length > 0 ? (
            <ul>
              {results.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => go(h)}
                    className="w-full flex items-baseline justify-between gap-3 px-4 py-2.5 text-left hover:bg-[color:var(--mint-soft)]"
                  >
                    <span className="text-sm font-bold">{h.label}</span>
                    {h.sublabel && <span className="text-[10px] uppercase tracking-wider opacity-60 font-extrabold">{h.sublabel}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !q.trim() && (
              <div className="px-4 py-6 text-xs uppercase tracking-wider opacity-60 font-extrabold">
                Search sections, labs, meds — or ask a question about this patient's record. Enter opens the top match.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
