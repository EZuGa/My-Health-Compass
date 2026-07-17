import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { api, type TimelineEvent } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";
import { useAsync, ErrorNote, Empty, Pill, fmtDateTime } from "@/components/backend/ui";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "Clinical Timeline — The Health Passport" }] }),
  component: Timeline,
});

type Filter = "all" | "assessment" | "observation" | "document" | "profile_item";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "assessment", label: "Assessments" },
  { key: "observation", label: "Measurements" },
  { key: "document", label: "Documents" },
  { key: "profile_item", label: "History" },
];

function Timeline() {
  const patientId = usePatientId();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, loading, error } = useAsync(
    () => (patientId ? api.timeline(patientId) : Promise.resolve([] as TimelineEvent[])),
    [patientId],
  );

  const events = useMemo(
    () => (data ?? []).filter((e) => filter === "all" || e.event_type === filter),
    [data, filter],
  );

  const tone = (t: string) =>
    t === "assessment" ? "pink" : t === "observation" ? "mint" : t === "document" ? "amber" : "gray";

  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.2em] underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-serif text-4xl">Clinical Timeline</h1>
      <p className="mt-2 max-w-3xl">
        One chronological record — every assessment, measurement, document and
        history item, straight from your backend health record.
      </p>

      <nav className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? data?.length ?? 0
              : (data ?? []).filter((e) => e.event_type === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold rounded-md border border-foreground/30 ${
                filter === f.key ? "bg-[color:var(--mint-deep)]" : "hover:bg-[color:var(--mint-soft)]"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </nav>

      <section className="mt-6 max-w-3xl">
        <ErrorNote error={error} />
        {loading && !data ? (
          <Empty>Loading…</Empty>
        ) : events.length === 0 ? (
          <Empty>No events in this view.</Empty>
        ) : (
          <ol className="relative border-l-2 border-foreground/60 pl-4 space-y-4">
            {events.map((e) => (
              <li key={`${e.event_type}-${e.id}`} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-foreground" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill tone={tone(e.event_type) as never}>{e.event_type.replace("_", " ")}</Pill>
                  <span className="font-bold">{e.title}</span>
                  <span className="text-[10px] opacity-50">{fmtDateTime(e.date)}</span>
                </div>
                {e.detail && <p className="text-[12px] opacity-70 mt-0.5">{e.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}
