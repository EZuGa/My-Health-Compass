import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NutritionAnalysis } from "./nutrition.functions";

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

export function useNutritionEntries() {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<NutritionEntry[]> => {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .select(
          "id, occurred_at, source, calories, carbs_g, sugar_g, sat_fat_g, sodium_mg, note",
        )
        .order("occurred_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NutritionEntry[];
    },
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
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const t = input.analysis.totals;
      const { error } = await supabase.from("nutrition_entries").insert({
        user_id: auth.user.id,
        source: input.source,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        calories: Math.round(t?.calories ?? 0),
        carbs_g: t?.carbs_g ?? null,
        sugar_g: t?.sugar_g ?? null,
        sat_fat_g: t?.sat_fat_g ?? null,
        sodium_mg: t?.sodium_mg ?? null,
        items: input.analysis.items ?? null,
        totals: t ?? null,
        note: input.note ?? null,
      });
      if (error) throw error;
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
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("nutrition_entries").insert({
        user_id: auth.user.id,
        source: input.source ?? "manual",
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        calories: Math.round(input.calories),
        note: input.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteNutritionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nutrition_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
