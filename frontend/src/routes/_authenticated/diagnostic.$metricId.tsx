import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricChart } from "@/components/MetricChart";
import type { Metric, Intervention } from "@/data/health";
import { api, type CategoryMetric, type Observation, type ProfileItem } from "@/lib/api";
import { qk, STATIC_STALE_TIME } from "@/lib/queries";
import { usePatientId } from "@/lib/usePatient";
import { useAsync, ErrorNote } from "@/components/backend/ui";

export const Route = createFileRoute("/_authenticated/diagnostic/$metricId")({
  component: DiagnosticDetail,
});

function interventionsFromProfile(profile: Record<string, ProfileItem[]>): Intervention[] {
  const kindMap: Record<string, Intervention["kind"]> = {
    medication: "medication",
    surgery: "procedure",
    screening: "procedure",
    chronic_condition: "lifestyle",
  };
  const out: Intervention[] = [];
  for (const items of Object.values(profile)) {
    for (const it of items) {
      if (!it.occurred_on) continue;
      out.push({
        date: it.occurred_on,
        label: it.name,
        kind: kindMap[it.item_type] ?? "lifestyle",
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function DiagnosticDetail() {
  const { metricId } = Route.useParams();
  const patientId = usePatientId();

  const metricsQ = useAsync<CategoryMetric[]>(qk.catalogMetrics, () => api.catalogMetrics(), {
    staleTime: STATIC_STALE_TIME,
  });
  const obsQ = useAsync(qk.observations(patientId, "metric", metricId), () =>
    patientId
      ? api.listObservations(patientId, { metric: metricId })
      : Promise.resolve([] as Observation[]),
  );
  const profileQ = useAsync(qk.profile(patientId), () =>
    patientId ? api.getProfile(patientId) : Promise.resolve({} as Record<string, ProfileItem[]>),
  );

  const cm = metricsQ.data?.find((m) => m.code === metricId);

  const metric: Metric | null = useMemo(() => {
    if (!cm) return null;
    const series = (obsQ.data ?? [])
      .filter((o) => o.value_num != null)
      .map((o) => ({ date: o.observed_at, value: o.value_num as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      id: cm.code,
      name: cm.name,
      unit: cm.unit ?? "",
      reference: cm.reference ?? undefined,
      range:
        cm.range_low != null && cm.range_high != null
          ? ([cm.range_low, cm.range_high] as [number, number])
          : undefined,
      series,
    };
  }, [cm, obsQ.data]);

  const interventions = useMemo(
    () => interventionsFromProfile(profileQ.data ?? {}),
    [profileQ.data],
  );

  if (metricsQ.loading && !metricsQ.data) {
    return (
      <AppShell>
        <p className="opacity-70">Loading…</p>
      </AppShell>
    );
  }
  if (!cm || !metric) {
    return (
      <AppShell>
        <ErrorNote error={metricsQ.error} />
        <p className="font-bold">Diagnostic variable not found.</p>
        <Link to="/section/$sectionId" params={{ sectionId: "dx" }} className="underline font-bold">
          ← Back to Diagnostic Data
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/section/$sectionId"
        params={{ sectionId: "dx" }}
        className="text-xs uppercase tracking-[0.22em] font-extrabold underline"
      >
        ← Diagnostic Data
      </Link>
      <h1 className="mt-2 font-serif text-4xl font-black">{metric.name}</h1>
      <p className="mt-1 text-sm font-bold opacity-80">
        {cm.diagnostic_group ?? cm.box ?? "general"} · {(cm.modality ?? "vital").toUpperCase()} ·
        trend by date with intervention overlays
      </p>
      <ErrorNote error={obsQ.error} />
      <div className="mt-4 flex-1 flex flex-col">
        <MetricChart metric={metric} interventions={interventions} />
      </div>
      <p className="mt-3 max-w-4xl text-sm font-semibold opacity-90">
        Vertical dashed markers indicate medication starts, dose changes, procedures, and lifestyle
        interventions on this patient's timeline — so the response of {metric.name.toLowerCase()} to
        each change is visible at a glance.
      </p>
    </AppShell>
  );
}
