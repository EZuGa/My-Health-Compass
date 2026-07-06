import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, X, FlaskConical } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  saveToxin as saveToxinFn,
  deleteToxin as deleteToxinFn,
  updateToxin as updateToxinFn,
  listToxins as listToxinsFn,
} from "@/lib/patient-data.functions";
import { usePatientId } from "@/lib/usePatient";

export type ToxinCategory =
  | "carcinogen"
  | "endocrine_disruptor"
  | "heavy_metal"
  | "pesticide"
  | "contaminant"
  | "additive"
  | "allergen"
  | "other";

export type SavedToxin = {
  id: string;
  name: string;
  source: string; // product name / where it was identified
  severity: "low" | "moderate" | "high" | "critical";
  category?: ToxinCategory;
  notes: string; // health effects / patient-specific risk
  savedAt: string;
};

const STORAGE_KEY = "exposures:toxins";

// Short human label per category (the "brief description" shown next to each toxin)
export const CATEGORY_LABEL: Record<ToxinCategory, string> = {
  carcinogen: "Carcinogen",
  endocrine_disruptor: "Hormone disruptor",
  heavy_metal: "Heavy metal",
  pesticide: "Pesticide",
  contaminant: "Environmental contaminant",
  additive: "Restricted additive",
  allergen: "Allergen",
  other: "Health hazard",
};

const CATEGORY_COLOR: Record<ToxinCategory, { bg: string; fg: string }> = {
  carcinogen: { bg: "#7a1c2e", fg: "#fff" },
  endocrine_disruptor: { bg: "#6d4aa6", fg: "#fff" },
  heavy_metal: { bg: "#4a5a6a", fg: "#fff" },
  pesticide: { bg: "#7a6a1c", fg: "#fff" },
  contaminant: { bg: "#b8732a", fg: "#fff" },
  additive: { bg: "#ffc2d2", fg: "#5a1a2e" },
  allergen: { bg: "#d9663d", fg: "#fff" },
  other: { bg: "#8a6b6b", fg: "#fff" },
};

// Cloud note round-trip: prefix the category so we can recover it from the
// existing `note` column without a schema change.
const encodeNote = (t: { category?: ToxinCategory; notes: string }) =>
  t.category ? `[${t.category}] ${t.notes ?? ""}` : (t.notes ?? "");

const decodeNote = (note: string | null | undefined): { category?: ToxinCategory; notes: string } => {
  const raw = note ?? "";
  const m = raw.match(/^\[([a-z_]+)\]\s*(.*)$/s);
  if (m && (Object.keys(CATEGORY_LABEL) as string[]).includes(m[1])) {
    return { category: m[1] as ToxinCategory, notes: m[2] };
  }
  return { notes: raw };
};

export function loadToxins(): SavedToxin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedToxin[]) : [];
  } catch {
    return [];
  }
}

export function saveToxins(items: SavedToxin[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("toxins:updated"));
  import("@/lib/crossLinks")
    .then((m) => m.regenerateFromToxins(items))
    .catch(() => {});
}

export function appendToxins(items: Omit<SavedToxin, "id" | "savedAt">[]) {
  const existing = loadToxins();
  const now = new Date().toISOString();
  const next = [
    ...items.map((i) => ({
      ...i,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: now,
    })),
    ...existing,
  ];
  saveToxins(next);
  return next.length - existing.length;
}

const SEV_BG: Record<SavedToxin["severity"], string> = {
  critical: "#7a1c2e",
  high: "#b8243a",
  moderate: "#ffc2d2",
  low: "#ece3ff",
};
const SEV_FG: Record<SavedToxin["severity"], string> = {
  critical: "#fff",
  high: "#fff",
  moderate: "#5a1a2e",
  low: "#3a2a55",
};

export function ToxinsBox() {
  const [items, setItems] = useState<SavedToxin[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<SavedToxin | null>(null);
  const patientId = usePatientId();
  const listCloud = useServerFn(listToxinsFn);
  const saveCloud = useServerFn(saveToxinFn);
  const delCloud = useServerFn(deleteToxinFn);
  const updCloud = useServerFn(updateToxinFn);
  const [cloudIds, setCloudIds] = useState<Record<string, string>>({});

  // newest-first sort helper
  const sortNewestFirst = (xs: SavedToxin[]) =>
    [...xs].sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));

  useEffect(() => {
    setItems(sortNewestFirst(loadToxins()));
    const onUpdate = () => setItems(sortNewestFirst(loadToxins()));
    window.addEventListener("toxins:updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("toxins:updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // Pull cloud rows once patient id is available; cloud is source of truth
  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const rows = await listCloud({ data: { patient_id: patientId } });
        if (!rows?.length) {
          // first-time: push local items up to cloud
          for (const it of loadToxins()) {
            try {
              const saved = await saveCloud({
                data: {
                  patient_id: patientId,
                  name: it.name,
                  severity: it.severity,
                  source: it.source,
                  note: encodeNote(it),
                  identified_at: it.savedAt,
                },
              });
              setCloudIds((m) => ({ ...m, [it.id]: saved.id }));
            } catch {}
          }
          return;
        }
        const mapped: SavedToxin[] = rows.map((r: any) => {
          const dec = decodeNote(r.note);
          return {
            id: r.id,
            name: r.name,
            source: r.source ?? "",
            severity: (r.severity ?? "low") as SavedToxin["severity"],
            category: dec.category,
            notes: dec.notes,
            savedAt: r.identified_at ?? r.created_at,
          };
        });
        setItems(sortNewestFirst(mapped));
        setCloudIds(Object.fromEntries(mapped.map((m) => [m.id, m.id])));
        // keep local cache in sync (still used by crossLinks)
        saveToxins(mapped);
      } catch (e) {
        console.warn("toxins cloud load failed", e);
      }
    })();
  }, [patientId, listCloud, saveCloud]);

  const remove = async (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveToxins(next);
    const remoteId = cloudIds[id] ?? id;
    if (patientId) {
      try { await delCloud({ data: { id: remoteId } }); } catch {}
    }
  };

  const startEdit = (it: SavedToxin) => {
    setEditing(it.id);
    setDraft({ ...it });
  };

  const commitEdit = async () => {
    if (!draft) return;
    const next = sortNewestFirst(items.map((i) => (i.id === draft.id ? draft : i)));
    setItems(next);
    saveToxins(next);
    setEditing(null);
    setDraft(null);
    const remoteId = cloudIds[draft.id] ?? draft.id;
    if (patientId) {
      try {
        await updCloud({
          data: {
            id: remoteId,
            name: draft.name,
            severity: draft.severity,
            source: draft.source,
            note: encodeNote(draft),
          },
        });
      } catch {}
    }
  };

  return (
    <section
      className="mt-6 rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 55%, #d99bb0 100%)",
        color: "#4a0f22",
        border: "1px solid rgba(122,28,46,0.35)",
      }}
    >
      <header className="flex items-center gap-3">
        <FlaskConical className="w-6 h-6" strokeWidth={2.5} style={{ color: "#7a1c2e" }} />
        <div>
          <h2 className="font-serif text-2xl font-black" style={{ color: "#5a0f22" }}>
            Toxins
          </h2>
          <p className="text-xs font-semibold opacity-80">
            Substances flagged by ToxCheck and saved to your exposure record. Edit or delete any
            item below.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="cloud-panel p-4 rounded-lg text-sm font-semibold">
          No toxins saved yet. Run ToxCheck and press <span className="font-extrabold">Save to Exposures</span> to add findings here.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => {
            const isEdit = editing === it.id && draft;
            return (
              <li
                key={it.id}
                className="cloud-panel rounded-lg p-3 flex flex-col gap-2"
                style={{ borderLeft: "4px solid #7a1c2e" }}
              >
                {isEdit && draft ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Substance"
                      className="w-full text-sm font-bold bg-white/70 border border-foreground/15 rounded p-2"
                    />
                    <input
                      value={draft.source}
                      onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                      placeholder="Source / product"
                      className="w-full text-sm font-semibold bg-white/70 border border-foreground/15 rounded p-2"
                    />
                    <select
                      value={draft.category ?? "other"}
                      onChange={(e) =>
                        setDraft({ ...draft, category: e.target.value as ToxinCategory })
                      }
                      className="w-full text-sm font-bold bg-white/70 border border-foreground/15 rounded p-2"
                    >
                      {(Object.keys(CATEGORY_LABEL) as ToxinCategory[]).map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.severity}
                      onChange={(e) =>
                        setDraft({ ...draft, severity: e.target.value as SavedToxin["severity"] })
                      }
                      className="w-full text-sm font-bold bg-white/70 border border-foreground/15 rounded p-2"
                    >
                      <option value="low">low</option>
                      <option value="moderate">moderate</option>
                      <option value="high">high</option>
                      <option value="critical">critical</option>
                    </select>
                    <textarea
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                      placeholder="Notes / health effects"
                      rows={2}
                      className="w-full text-sm font-medium bg-white/70 border border-foreground/15 rounded p-2 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={commitEdit}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md text-white"
                        style={{ background: "#5a0f22" }}
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setDraft(null);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md border"
                        style={{ borderColor: "#7a1c2e", color: "#7a1c2e" }}
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-base font-black">{it.name}</span>
                        {it.category && (
                          <span
                            className="text-[10px] uppercase tracking-[0.16em] font-extrabold px-2 py-0.5 rounded"
                            style={{
                              background: CATEGORY_COLOR[it.category].bg,
                              color: CATEGORY_COLOR[it.category].fg,
                            }}
                          >
                            {CATEGORY_LABEL[it.category]}
                          </span>
                        )}
                        <span
                          className="text-[10px] uppercase tracking-[0.16em] font-extrabold px-2 py-0.5 rounded"
                          style={{ background: SEV_BG[it.severity], color: SEV_FG[it.severity] }}
                        >
                          {it.severity}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(it)}
                          className="p-1.5 rounded-md hover:bg-white/60"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => remove(it.id)}
                          className="p-1.5 rounded-md hover:bg-white/60"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#7a1c2e" }} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
