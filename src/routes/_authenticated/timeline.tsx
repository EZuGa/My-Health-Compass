import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricChart } from "@/components/MetricChart";
import { boxes, interventions, type Intervention } from "@/data/health";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "Clinical Timeline — The Health Passport" }] }),
  component: Timeline,
});

type Source = "inpatient" | "outpatient";

// Derive the source of each intervention from its kind.
// In production these tags will be supplied directly by:
//   • Inpatient  → hospital EMR feeds (HL7/FHIR exports, discharge summaries)
//   • Outpatient → wearable APIs (Apple Health, Fitbit, Garmin, Oura, CGM…),
//                  manual entry, voice notes, and uploaded / scanned documents
function sourceOf(i: Intervention): Source {
  if (i.kind === "procedure") return "inpatient";
  return "outpatient";
}

type View = "lifetime" | Source;

const VIEWS: { key: View; title: string; blurb: string; tag: string }[] = [
  {
    key: "inpatient",
    title: "Inpatient",
    tag: "Hospital EMR",
    blurb:
      "Every hospitalization, ED visit, in-hospital procedure and discharge medication — pulled from connected hospital electronic medical records.",
  },
  {
    key: "outpatient",
    title: "Outpatient",
    tag: "Wearables · Manual · Voice · Scans",
    blurb:
      "Vitals and biomarkers from wearable devices and apps, clinician notes, manual entries, voice memos, and any document the patient uploads or scans.",
  },
  {
    key: "lifetime",
    title: "Lifetime",
    tag: "Inpatient + Outpatient",
    blurb:
      "Complete longitudinal record — every variable from every inpatient stay AND every outpatient source combined into one continuous lifetime view.",
  },
];

function Timeline() {
  const [view, setView] = useState<View>("lifetime");

  const tagged = interventions.map((i) => ({ ...i, source: sourceOf(i) }));
  const filtered =
    view === "lifetime" ? tagged : tagged.filter((i) => i.source === view);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const activeView = VIEWS.find((v) => v.key === view)!;

  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.2em] underline">← Dashboard</Link>
      <h1 className="mt-2 font-serif text-4xl">Clinical Timeline</h1>
      <p className="mt-2 max-w-3xl">
        Tap a box to filter the timeline and the per-metric charts below by data source.
        <span className="font-black"> Lifetime</span> aggregates everything the patient has ever
        recorded — both inpatient and outpatient — so domains like Heart &amp; Circulation update
        from the combined summary.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5 auto-rows-fr">
        {VIEWS.map((v) => {
          const count =
            v.key === "lifetime"
              ? tagged.length
              : tagged.filter((i) => i.source === v.key).length;
          const active = view === v.key;
          const tint =
            v.key === "inpatient"
              ? "#d9ccef"          // elegant light violet
              : v.key === "outpatient"
              ? "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)"
              : "linear-gradient(160deg, #bcd0a6 0%, #9caf88 100%)";
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              style={{ background: tint }}
              className={`cloud-box p-5 flex flex-col h-full text-left transition ${
                active ? "ring-4 ring-[#ffc2d2]" : "opacity-90 hover:opacity-100"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-2xl font-black">{v.title}</h2>
                <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">
                  {v.tag}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug">{v.blurb}</p>
              <div className="mt-auto pt-4 border-t border-foreground/25 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {active ? "Viewing" : "Open →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-foreground/40 pb-1">
          <h2 className="font-serif text-2xl font-black">
            {activeView.title} — chronological record
          </h2>
          <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold opacity-70">
            {activeView.tag}
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className="mt-4 text-sm font-semibold opacity-60">
            No entries from this source yet. Connect a data feed above to populate.
          </p>
        ) : (
          <ol className="mt-4 relative border-l-2 border-foreground/60 pl-4 space-y-3">
            {sorted.map((i) => (
              <li key={i.date + i.label} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-foreground" />
                <div className="text-xs opacity-70">
                  {i.date} ·{" "}
                  <span className="uppercase tracking-wider font-extrabold">
                    {i.source}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">{i.label}</span>{" "}
                  <span className="text-xs opacity-70">({i.kind})</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Per-metric charts — markers reflect the active view */}
      {boxes.map((b) => (
        <section key={b.id} className="mt-10">
          <h2 className="font-serif text-2xl border-b border-foreground/40 pb-1">
            {b.title}{" "}
            <span className="text-xs uppercase tracking-wider opacity-70 font-extrabold">
              · {activeView.title}
            </span>
          </h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {b.metrics.map((m) => (
              <MetricChart key={m.id} metric={m} interventions={sorted} />
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
