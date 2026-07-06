import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NutritionAnalysis } from "./nutrition.functions";

// Nutrition entries are stored locally (the FastAPI backend has no nutrition
// table). React Query keeps the same hook contract the UI already relied on.

export type EntrySource = "manual" | "photo" | "voice" | "import" | "other";

export type NutritionEntry = {
  id: string;
  occurred_at: string;
  source: EntrySource;
  calories: number;
  carbs_g: number | null;
  sugar_g: number | null;
  sat_fat_g: number | null;
  sodium_mg: number | null;
  note: string | null;
};

const QK = ["nutrition_entries"] as const;
const STORAGE_KEY = "hp.nutrition_entries.v1";

function readEntries(): NutritionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as NutritionEntry[]) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: NutritionEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNutritionEntries() {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<NutritionEntry[]> =>
      readEntries().sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)),
    staleTime: 30_000,
  });
}

export function useLogAnalyzedNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      source: EntrySource;
      analysis: NutritionAnalysis;
      occurredAt?: string;
      note?: string;
    }) => {
      const t = input.analysis.totals;
      const entry: NutritionEntry = {
        id: newId(),
        source: input.source,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        calories: Math.round(t?.calories ?? 0),
        carbs_g: t?.carbs_g ?? null,
        sugar_g: t?.sugar_g ?? null,
        sat_fat_g: t?.sat_fat_g ?? null,
        sodium_mg: t?.sodium_mg ?? null,
        note: input.note ?? null,
      };
      writeEntries([...readEntries(), entry]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useLogManualCalories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      calories: number;
      occurredAt?: string;
      note?: string;
      source?: EntrySource;
    }) => {
      const entry: NutritionEntry = {
        id: newId(),
        source: input.source ?? "manual",
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        calories: Math.round(input.calories),
        carbs_g: null,
        sugar_g: null,
        sat_fat_g: null,
        sodium_mg: null,
        note: input.note ?? null,
      };
      writeEntries([...readEntries(), entry]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteNutritionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      writeEntries(readEntries().filter((e) => e.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
