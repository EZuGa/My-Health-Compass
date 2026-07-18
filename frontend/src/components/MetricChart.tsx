import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, CartesianGrid,
} from "recharts";

type Bucket = "hour" | "day" | "month" | "year";

function bucketKey(iso: string, b: Bucket): string {
  // iso may be "YYYY-MM-DD" or full ISO; normalize.
  const d = iso.length <= 10 ? new Date(iso + "T00:00:00Z") : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  if (b === "year") return `${y}`;
  if (b === "month") return `${y}-${m}`;
  if (b === "day") return `${y}-${m}-${day}`;
  return `${y}-${m}-${day} ${h}:00`;
}

function aggregate<T extends { date: string; value: number }>(series: T[], b: Bucket) {
  const groups = new Map<string, number[]>();
  for (const p of series) {
    const k = bucketKey(p.date, b);
    const arr = groups.get(k) ?? [];
    arr.push(p.value);
    groups.set(k, arr);
  }
  return Array.from(groups.entries())
    .sort(([a], [c]) => a.localeCompare(c))
    .map(([key, vs]) => ({
      date: key,
      value: +(vs.reduce((s, v) => s + v, 0) / vs.length).toFixed(2),
    }));
}
import type { Metric, Intervention } from "@/data/health";
import { PHQ9Dialog } from "./PHQ9Dialog";
import { K6Dialog } from "./K6Dialog";
import { SWLSDialog } from "./SWLSDialog";
import { MoCADialog } from "./MoCADialog";

export function MetricChart({
  metric,
  interventions = [],
}: {
  metric: Metric;
  interventions?: Intervention[];
}) {
  const storageKey = `metric-override-${metric.id}`;
  const [override, setOverride] = useState<number | null>(null);
  const [bucket, setBucket] = useState<Bucket>("day");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(storageKey);
    if (v != null) setOverride(Number(v));
  }, [storageKey]);

  // effectiveSeries MUST be referentially stable: a new array on every render
  // flows into `data`, recharts treats it as a data change and restarts the
  // line animation on each hover/state update.
  const effectiveSeries = useMemo(() => {
    const todayPoint =
      override != null ? [{ date: new Date().toISOString().slice(0, 10), value: override }] : [];
    return [...metric.series, ...todayPoint];
  }, [metric.series, override]);
  const data = useMemo(() => {
    const agg = aggregate(effectiveSeries, bucket);
    // Show short label on axis; full key kept for tooltip via "date" field.
    return agg.map((p) => ({
      date: bucket === "year" ? p.date : bucket === "month" ? p.date : p.date.slice(5),
      fullDate: p.date,
      value: p.value,
    }));
  }, [effectiveSeries, bucket]);
  const relevant = useMemo(
    () => interventions.filter((i) => metric.series.some((p) => p.date >= i.date.slice(0, 10))),
    [interventions, metric.series],
  );

  // Compute y-domain that always includes the reference range
  const yDomain = useMemo<[number, number]>(() => {
    const values = effectiveSeries.map((p) => p.value);
    const [rMin, rMax] = metric.range ?? [Math.min(...values), Math.max(...values)];
    const lo = Math.min(rMin, ...values);
    const hi = Math.max(rMax, ...values);
    const pad = (hi - lo) * 0.12 || 1;
    return [+(lo - pad).toFixed(2), +(hi + pad).toFixed(2)];
  }, [effectiveSeries, metric.range]);

  const latest = effectiveSeries.at(-1)?.value;
  const outOfRange =
    latest !== undefined && metric.range && (latest < metric.range[0] || latest > metric.range[1]);
  const [hovered, setHovered] = useState(false);
  // Draw the line with its animation once on mount, then switch animation off
  // so later re-renders (hover markers, background refetches) can't replay it.
  // (recharts' default animation duration is 1500 ms.)
  const [animateLine, setAnimateLine] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAnimateLine(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Map each chart point (MM-DD) to the interventions that occurred on/just before it.
  const interventionsByDate = useMemo(() => {
    const map = new Map<string, Intervention[]>();
    relevant.forEach((i) => {
      const matched = data.find((d) => `2026-${d.date}` >= i.date)?.date;
      if (!matched) return;
      const arr = map.get(matched) ?? [];
      arr.push(i);
      map.set(matched, arr);
    });
    return map;
  }, [relevant, data]);

  return (
    <div
      className="cloud-panel p-4 flex flex-col h-full min-h-[320px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {(metric.id === "phq" || metric.id === "k6" || metric.id === "wb" || metric.id === "moca") && (
        <div className="mb-2 flex items-center gap-2">
          {metric.id === "phq" ? (
            <PHQ9Dialog
              onSubmit={(score) => {
                setOverride(score);
                if (typeof window !== "undefined")
                  window.localStorage.setItem(storageKey, String(score));
              }}
            />
          ) : metric.id === "k6" ? (
            <K6Dialog
              onSubmit={(score) => {
                setOverride(score);
                if (typeof window !== "undefined")
                  window.localStorage.setItem(storageKey, String(score));
              }}
            />
          ) : metric.id === "wb" ? (
            <SWLSDialog
              onSubmit={(score) => {
                setOverride(score);
                if (typeof window !== "undefined")
                  window.localStorage.setItem(storageKey, String(score));
              }}
            />
          ) : (
            <MoCADialog
              onSubmit={(score) => {
                setOverride(score);
                if (typeof window !== "undefined")
                  window.localStorage.setItem(storageKey, String(score));
              }}
            />
          )}
          {override != null && (
            <button
              className="text-[10px] font-bold uppercase tracking-wider underline opacity-70 hover:opacity-100"
              onClick={() => {
                setOverride(null);
                if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
              }}
            >
              clear
            </button>
          )}
        </div>
      )}
      <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
        <div>
          <h3 className="font-serif text-lg font-extrabold">{metric.name}</h3>
          <div className="text-[12px] font-semibold opacity-90">
            {metric.unit}{metric.reference ? ` · reference ${metric.reference}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-foreground/30 rounded overflow-hidden">
            {(["hour", "day", "month", "year"] as Bucket[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBucket(b)}
                className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold ${
                  bucket === b ? "bg-foreground text-background" : "bg-transparent"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className={`text-base font-extrabold ${outOfRange ? "text-[#a00]" : ""}`}>
            {latest} {metric.unit}
          </div>
        </div>
      </div>
      {/* relative + absolutely-positioned chart: the SVG must NOT contribute
          to the card's intrinsic height. The grid row height (auto-rows-fr in
          a min-h flex column) derives from content max-content, while recharts'
          ResponsiveContainer re-measures whenever the row changes — an in-flow
          chart feeds its own rendered height back into the row and the SVG
          keeps growing forever. */}
      <div className="relative flex-1 min-h-[180px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#0003" strokeDasharray="2 4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#000", fontWeight: 700 }} />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 11, fill: "#000", fontWeight: 700 }}
                width={42}
              />
              {/* Normal range — soft shaded band */}
              {metric.range && (
                <ReferenceArea
                  y1={metric.range[0]}
                  y2={metric.range[1]}
                  fill="#2ec4b6"
                  fillOpacity={0.14}
                  stroke="#2ec4b6"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip
                cursor={{ stroke: "#000", strokeOpacity: 0.4, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const dateKey = String(label);
                  const ints = interventionsByDate.get(dateKey) ?? [];
                  return (
                    <div
                      style={{
                        background: "var(--popover)",
                        border: "1px solid #000",
                        borderRadius: 6,
                        fontFamily: "serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#000",
                        padding: "6px 8px",
                        maxWidth: 240,
                      }}
                    >
                      <div className="font-extrabold">{dateKey}</div>
                      <div>
                        {metric.name}: {payload[0].value} {metric.unit}
                      </div>
                      {ints.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-black/40">
                          <div className="text-[11px] uppercase tracking-wide opacity-70">
                            Interventions
                          </div>
                          <ul className="mt-0.5 space-y-0.5">
                            {ints.map((i) => (
                              <li key={i.date + i.label} className="text-[11px]">
                                <span className="font-extrabold">{i.date}</span> · {i.label}{" "}
                                <span className="opacity-70">({i.kind})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {hovered &&
                relevant.map((i) => {
                  const matchedDate = data.find((d) => `2026-${d.date}` >= i.date)?.date;
                  if (!matchedDate) return null;
                  return (
                    <ReferenceLine
                      key={i.date + i.label}
                      x={matchedDate}
                      stroke="#000"
                      strokeOpacity={0.55}
                      strokeDasharray="3 3"
                    />
                  );
                })}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#000"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#000" }}
                activeDot={{ r: 4 }}
                isAnimationActive={animateLine}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {metric.range && (
        <div className="mt-1 text-[11px] font-bold opacity-80">
          Shaded band = normal range ({metric.range[0]}–{metric.range[1]} {metric.unit})
        </div>
      )}
      {relevant.length > 0 && (
        <ul className="mt-2 text-[12px] font-semibold space-y-0.5 border-t border-foreground/40 pt-2">
          {relevant.map((i) => (
            <li key={i.date + i.label}>
              <span className="font-extrabold">{i.date}</span> · {i.label}{" "}
              <span className="opacity-70">({i.kind})</span>
            </li>
          ))}
        </ul>
      )}
      {/* The table opens as an overlay dropdown, NOT in flow: if it grew the
          card, the auto-rows-fr grid row would grow with it and every chart
          in the row would change height. */}
      <details className="relative mt-3 text-[12px]">
        <summary className="cursor-pointer font-bold">Numeric values by date</summary>
        <div className="cloud-panel absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto p-3">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground/50">
                <th className="py-1 font-extrabold">Date</th>
                <th className="font-extrabold">Value ({metric.unit})</th>
              </tr>
            </thead>
            <tbody>
              {[...effectiveSeries].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
                const out =
                  metric.range && (p.value < metric.range[0] || p.value > metric.range[1]);
                return (
                  <tr key={p.date} className="border-b border-foreground/15">
                    <td className="py-1 font-semibold">{p.date}</td>
                    <td className={`font-semibold ${out ? "text-[#a00] font-extrabold" : ""}`}>
                      {p.value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
