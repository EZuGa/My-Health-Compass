import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ObservationInput = z.object({
  section: z.string().min(1),
  box: z.string().min(1),
  metric: z.string().min(1),
  value_text: z.string().optional().nullable(),
  value_num: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  observed_at: z.string().optional().nullable(),
  source_kind: z.string().optional().nullable(),
  source_label: z.string().optional().nullable(),
  setting: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  batch_id: z.string().optional().nullable(),
});

export const getOrCreatePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        pid: z.string().min(1),
        display_name: z.string().optional().nullable(),
        dob: z.string().optional().nullable(),
        sex: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("patients")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("pid", data.pid)
      .maybeSingle();
    if (existing) return existing;
    const { data: created, error } = await supabase
      .from("patients")
      .insert({
        owner_user_id: userId,
        pid: data.pid,
        display_name: data.display_name ?? null,
        dob: data.dob ?? null,
        sex: data.sex ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const saveIngestBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        patient_id: z.string().uuid(),
        batch_id: z.string(),
        source_kind: z.string().optional().nullable(),
        source_label: z.string().optional().nullable(),
        summary: z.string().optional().nullable(),
        occurred_at: z.string().optional().nullable(),
        observations: z.array(ObservationInput).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const doc = await supabase
      .from("patient_documents")
      .insert({
        patient_id: data.patient_id,
        source_kind: data.source_kind ?? null,
        source_label: data.source_label ?? null,
        summary: data.summary ?? null,
        observation_count: data.observations.length,
        occurred_at: data.occurred_at ?? new Date().toISOString(),
      })
      .select("id")
      .single();
    if (doc.error) throw new Error(doc.error.message);

    if (data.observations.length) {
      const rows = data.observations.map((o) => ({
        patient_id: data.patient_id,
        section: o.section,
        box: o.box,
        metric: o.metric,
        value_text: o.value_text ?? null,
        value_num: o.value_num ?? null,
        unit: o.unit ?? null,
        observed_at: o.observed_at ?? new Date().toISOString(),
        source_kind: o.source_kind ?? data.source_kind ?? null,
        source_label: o.source_label ?? data.source_label ?? null,
        setting: o.setting ?? null,
        note: o.note ?? null,
        batch_id: data.batch_id,
      }));
      const obs = await supabase.from("patient_observations").insert(rows);
      if (obs.error) throw new Error(obs.error.message);
    }
    return { document_id: doc.data.id, count: data.observations.length };
  });

export const listObservations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        patient_id: z.string().uuid(),
        section: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("patient_observations")
      .select("*")
      .eq("patient_id", data.patient_id)
      .order("observed_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.section) q = q.eq("section", data.section);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ patient_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("patient_documents")
      .select("*")
      .eq("patient_id", data.patient_id)
      .order("occurred_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveToxin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        patient_id: z.string().uuid(),
        name: z.string().min(1),
        severity: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        identified_at: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("patient_toxins")
      .insert({
        patient_id: data.patient_id,
        name: data.name,
        severity: data.severity ?? null,
        source: data.source ?? null,
        note: data.note ?? null,
        identified_at: data.identified_at ?? new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listToxins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ patient_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("patient_toxins")
      .select("*")
      .eq("patient_id", data.patient_id)
      .order("identified_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteToxin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("patient_toxins")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateToxin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        severity: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase
      .from("patient_toxins")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
