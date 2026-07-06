import { useEffect, useState } from "react";
import type { NutritionAnalysis } from "./nutrition.functions";

export type NutritionLogEntry = {
  id: string;
  timestamp: string; // ISO
  source: "voice" | "photo";
  totals: NutritionAnalysis["totals"];
  itemCount: number;
  alertCount: number;
};

const KEY = "mrs-z-nutrition-log-v1";

function read(): NutritionLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: NutritionLogEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function useNutritionLog() {
  const [entries, setEntries] = useState<NutritionLogEntry[]>([]);

  useEffect(() => {
    setEntries(read());
  }, []);

  const append = (source: "voice" | "photo", analysis: NutritionAnalysis) => {
    const entry: NutritionLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source,
      totals: analysis.totals,
      itemCount: analysis.items?.length ?? 0,
      alertCount: analysis.alerts?.length ?? 0,
    };
    const next = [...entries, entry];
    setEntries(next);
    write(next);
  };

  const clear = () => {
    setEntries([]);
    write([]);
  };

  return { entries, append, clear };
}
