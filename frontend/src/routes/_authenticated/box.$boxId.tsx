import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricChart } from "@/components/MetricChart";
import { DaliByBox } from "@/components/DaliArt";
import type { Metric, Intervention } from "@/data/health";
import { api, type Box, type Observation, type ProfileItem } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";
import { useAsync, ErrorNote } from "@/components/backend/ui";

export const Route = createFileRoute("/_authenticated/box/$boxId")({
  component: BoxDetail,
});

// Build the interventions overlay (medication starts, procedures) from the
// patient's dated profile items — real events, not a hardcoded list.
function interventionsFromProfile(profile: Record<string, ProfileItem[]>): Intervention[] {
  const out: Intervention[] = [];
  const kindMap: Record<string, Intervention["kind"]> = {
    medication: "medication",
    surgery: "procedure",
    screening: "procedure",
    chronic_condition: "lifestyle",
  };
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

function BoxDetail() {
  const { boxId } = Route.useParams();
  const patientId = usePatientId();

  const boxesQ = useAsync<Box[]>(() => api.catalogBoxes(), []);
  const obsQ = useAsync(
    () =>
      patientId
        ? api.listObservations(patientId, { box: boxId })
        : Promise.resolve([] as Observation[]),
    [patientId, boxId],
  );
  const profileQ = useAsync(
    () =>
      patientId
        ? api.getProfile(patientId)
        : Promise.resolve({} as Record<string, ProfileItem[]>),
    [patientId],
  );

  const box = boxesQ.data?.find((b) => b.id === boxId);

  const metrics: Metric[] = useMemo(() => {
    if (!box) return [];
    const byMetric: Record<string, { date: string; value: number }[]> = {};
    for (const o of obsQ.data ?? []) {
      if (o.value_num == null) continue;
      (byMetric[o.metric] ??= []).push({ date: o.observed_at, value: o.value_num });
    }
    for (const k of Object.keys(byMetric)) {
      byMetric[k].sort((a, b) => a.date.localeCompare(b.date));
    }
    return box.metrics.map((cm) => ({
      id: cm.code,
      name: cm.name,
      unit: cm.unit ?? "",
      reference: cm.reference ?? undefined,
      range:
        cm.range_low != null && cm.range_high != null
          ? ([cm.range_low, cm.range_high] as [number, number])
          : undefined,
      series: byMetric[cm.code] ?? [],
    }));
  }, [box, obsQ.data]);

  const interventions = useMemo(
    () => interventionsFromProfile(profileQ.data ?? {}),
    [profileQ.data],
  );

  if (boxesQ.loading && !boxesQ.data) {
    return (
      <AppShell>
        <p className="opacity-70">Loading…</p>
      </AppShell>
    );
  }
  if (!box) {
    return (
      <AppShell>
        <ErrorNote error={boxesQ.error} />
        <p>Box not found.</p>
        <Link to="/" className="underline">
          Back to dashboard
        </Link>
      </AppShell>
    );
  }

  const Art = DaliByBox[box.id];
  // Metrics with at least one reading are charted; empty ones still list.
  const withData = metrics.filter((m) => m.series.length > 0);
  const empty = metrics.filter((m) => m.series.length === 0);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs uppercase tracking-[0.2em] underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-serif text-4xl">{box.title}</h1>
          <p className="mt-1 max-w-2xl">{box.subtitle}</p>
        </div>
        {Art && <Art className="w-28 h-20" />}
      </div>

      <ErrorNote error={obsQ.error} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
        {withData.map((m) => (
          <MetricChart key={m.id} metric={m} interventions={interventions} />
        ))}
      </div>

      {empty.length > 0 && (
        <div className="cloud-panel p-4">
          <div className="text-[11px] uppercase tracking-wider font-extrabold opacity-70 mb-2">
            No readings yet — log these under Health Records › Vitals
          </div>
          <div className="flex flex-wrap gap-2">
            {empty.map((m) => (
              <span
                key={m.id}
                className="text-[11px] font-bold px-2 py-1 border border-foreground/25 rounded"
              >
                {m.name}
                {m.reference ? ` (ref ${m.reference})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
