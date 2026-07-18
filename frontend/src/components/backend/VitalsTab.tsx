import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Panel, Empty, ErrorNote, useAsync, fmtDateTime } from "./ui";
import {
  api,
  type Category,
  type CategoryMetric,
  type MetricStats,
  type WearableSource,
} from "@/lib/api";
import { invalidateObservations, qk, STATIC_STALE_TIME } from "@/lib/queries";

const WEARABLE_SOURCES: WearableSource[] = [
  "apple_health",
  "samsung_health",
  "whoop",
  "fitbit",
  "garmin",
  "oura",
  "other",
];

export function VitalsTab({ patientId }: { patientId: number }) {
  const queryClient = useQueryClient();
  const categories = useAsync<Category[]>(qk.categories, () => api.listCategories(), {
    staleTime: STATIC_STALE_TIME,
  });
  const latest = useAsync(qk.latestVitals(patientId), () => api.latestVitals(patientId));
  // Reads added through any of these paths update every observation-driven
  // view (vitals, charts, timeline, dashboards), not just this list.
  const refresh = () => invalidateObservations(queryClient, patientId);

  return (
    <>
      <LogReading patientId={patientId} categories={categories.data ?? []} onSaved={refresh} />
      <DeviceSync onSynced={refresh} />
      <LatestVitals
        loading={latest.loading}
        error={latest.error}
        data={latest.data}
        onDeleted={refresh}
      />
      <MetricTrend patientId={patientId} />
    </>
  );
}

// ---- manual observation (category -> metric -> value) ----

function LogReading({
  patientId,
  categories,
  onSaved,
}: {
  patientId: number;
  categories: Category[];
  onSaved: () => void;
}) {
  const [categoryCode, setCategoryCode] = useState("");
  const [metricCode, setMetricCode] = useState("");
  const [value, setValue] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);

  const code = categoryCode || categories[0]?.code || "";

  // Metric catalogs are static reference data — fetched once per category and
  // shared with every other component that needs them.
  const metricsQ = useAsync<CategoryMetric[]>(
    qk.categoryMetrics(code),
    () => api.categoryMetrics(code),
    { staleTime: STATIC_STALE_TIME, enabled: !!code },
  );
  const metrics = metricsQ.data ?? [];

  // No explicit metric picked yet (or the pick isn't in this category) → first.
  const metric = metrics.find((m) => m.code === metricCode) ?? metrics[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metric || value === "") return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api.addObservation(patientId, {
        box: metric.box || "general",
        metric: metric.code,
        value_num: Number(value),
        unit: metric.unit,
        observed_at: observedAt ? new Date(observedAt).toISOString() : null,
        source_kind: "manual",
        source_label: "manual entry",
      });
      setOk(`Logged ${metric.name} = ${value}${metric.unit ? " " + metric.unit : ""}`);
      setValue("");
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Log a reading"
      subtitle="Manual entry → POST /observations (metrics from /categories/{code}/metrics)"
    >
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <select
          value={code}
          onChange={(e) => setCategoryCode(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        >
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={metricCode}
          onChange={(e) => setMetricCode(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold md:col-span-2"
        >
          {metrics.length === 0 && <option value="">No metrics</option>}
          {metrics.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
              {m.unit ? ` (${m.unit})` : ""}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <input
          type="datetime-local"
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <div className="md:col-span-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !metric}
            className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Log reading"}
          </button>
          {ok && <span className="text-[12px] font-bold text-green-800">{ok}</span>}
        </div>
      </form>
      <div className="mt-2">
        <ErrorNote error={error} />
      </div>
    </Panel>
  );
}

// ---- wearable bulk sync ----

function DeviceSync({ onSynced }: { onSynced: () => void }) {
  const [source, setSource] = useState<WearableSource>("apple_health");
  const [metric, setMetric] = useState("resting_heart_rate");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value === "") return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api.syncWearable(source, [
        {
          metric: metric.trim(),
          value_num: Number(value),
          observed_at: new Date().toISOString(),
        },
      ]);
      setOk(`Synced ${res.stored}, skipped ${res.skipped_duplicates} duplicate(s)`);
      setValue("");
      onSynced();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Sync from a device"
      subtitle="Bulk-ingest from a connected platform → POST /wearables/sync"
    >
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as WearableSource)}
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        >
          {WEARABLE_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          placeholder="metric (e.g. steps)"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
        >
          {busy ? "Syncing…" : "Sync sample"}
        </button>
      </form>
      <div className="mt-2 flex items-center gap-3">
        {ok && <span className="text-[12px] font-bold text-green-800">{ok}</span>}
        <ErrorNote error={error} />
      </div>
    </Panel>
  );
}

// ---- latest vitals with delete ----

function LatestVitals({
  loading,
  error,
  data,
  onDeleted,
}: {
  loading: boolean;
  error: unknown;
  data: import("@/lib/api").Observation[] | null;
  onDeleted: () => void;
}) {
  return (
    <Panel
      title="Latest vitals"
      subtitle="Most recent value per metric → /patients/{id}/vitals/latest"
    >
      <ErrorNote error={error} />
      {loading && !data ? (
        <Empty>Loading…</Empty>
      ) : !data || data.length === 0 ? (
        <Empty>No vitals recorded yet.</Empty>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
            >
              <div>
                <span className="font-bold">{o.metric.replace(/_/g, " ")}</span>:{" "}
                {o.value_num ?? o.value_text}
                {o.unit ? ` ${o.unit}` : ""}
                <div className="text-[10px] opacity-50">
                  {fmtDateTime(o.observed_at)} · {o.source_kind ?? "manual"}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await api.deleteObservation(o.id);
                  onDeleted();
                }}
                className="text-[11px] font-bold underline opacity-60 hover:opacity-100"
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---- metric trend stats ----

function MetricTrend({ patientId }: { patientId: number }) {
  const [metric, setMetric] = useState("");
  const [stats, setStats] = useState<MetricStats | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metric.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setStats(await api.observationStats(patientId, metric.trim()));
    } catch (err) {
      setError(err);
      setStats(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Metric trend" subtitle="min / max / avg over time → /observations/stats">
      <form onSubmit={load} className="flex gap-2 mb-2">
        <input
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          placeholder="metric code (e.g. pulse, steps)"
          className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold flex-1"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-[11px] uppercase tracking-wider font-extrabold border border-foreground/40"
        >
          {busy ? "…" : "Get stats"}
        </button>
      </form>
      <ErrorNote error={error} />
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <Stat label="count" value={stats.count} />
          <Stat label="min" value={stats.min ?? "—"} />
          <Stat label="avg" value={stats.avg ?? "—"} />
          <Stat label="max" value={stats.max ?? "—"} />
          <Stat label="latest" value={stats.latest ? (stats.latest.value_num ?? "—") : "—"} />
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-foreground/15 bg-card px-2 py-1 rounded text-center">
      <div className="font-black">{value}</div>
      <div className="text-[9px] uppercase tracking-wider opacity-60">{label}</div>
    </div>
  );
}
