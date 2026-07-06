import { useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DaliByBox } from "@/components/DaliArt";
import { boxes, patient } from "@/data/health";
import { getCachedUser, api, type Observation } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";
import { useAsync } from "@/components/backend/ui";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: () => {
    // The passport dashboard is patient-facing; send doctors to their console.
    if (getCachedUser()?.role === "doctor") throw redirect({ to: "/clinic" });
  },
  head: () => ({
    meta: [
      { title: "The Health Passport — Dashboard" },
      { name: "description", content: "Six health domains predictive of longevity and mortality." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const user = getCachedUser();
  const displayName = user?.full_name ?? `Personal Record № ${patient.pid}`;
  const dob = user?.date_of_birth ?? patient.dob;
  const pid = user?.personal_number ?? patient.pid;

  // Real latest measurements from the backend, grouped by health-domain box
  // (the backend's box field is heart/metabolic/fitness/sleep/mind/exposures,
  // matching these cards). Falls back to sample data when a box has no readings.
  const patientId = usePatientId();
  const vitals = useAsync(
    () => (patientId ? api.latestVitals(patientId) : Promise.resolve([] as Observation[])),
    [patientId],
  );
  const latestByBox = useMemo(() => {
    const m: Record<string, Observation> = {};
    for (const o of vitals.data ?? []) {
      const cur = m[o.box];
      if (!cur || o.observed_at > cur.observed_at) m[o.box] = o;
    }
    return m;
  }, [vitals.data]);
  return (
    <AppShell>
      <section className="max-w-5xl">
        <h1 className="[font-family:'EB_Garamond',ui-serif,Georgia,serif] text-3xl md:text-4xl leading-[1.05] font-medium italic text-[#7a1c2e] [font-feature-settings:'liga','dlig','onum']" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7), 1px 2px 0 rgba(180,150,220,0.35), 2px 4px 6px rgba(120,90,180,0.25), 3px 6px 14px rgba(120,90,180,0.18)" }}>
          {displayName}
          <span className="text-foreground/60">.</span>

        </h1>


        <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em]">
          DOB {dob} · Personal Record № {pid}
        </p>
      </section>

      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
        {boxes.map((b, i) => {
          const Art = DaliByBox[b.id];
          const mock = b.metrics[0];
          const live = latestByBox[b.id];
          return (
            <Link
              key={b.id}
              to="/box/$boxId"
              params={{ boxId: b.id }}
              className="cloud-box group block p-6 flex flex-col h-full"
            >
              <div className="flex items-start justify-end gap-3">
                <Art className="w-24 h-16 -mt-1" />
              </div>
              <h2 className="mt-2 [font-family:'EB_Garamond',ui-serif,Georgia,serif] text-[2rem] leading-[1.1] font-medium tracking-[-0.005em] text-[#321512] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]">{b.title}</h2>
              <p className="mt-1 text-base font-semibold">{b.subtitle}</p>
              <div className="mt-auto pt-4 border-t border-foreground/25 flex items-baseline justify-between">
                <span className="text-xs font-bold">{b.metrics.length} metrics tracked</span>
                {live ? (
                  <span className="text-xs font-bold">
                    {live.metric.replace(/_/g, " ")}:{" "}
                    <span className="font-black">
                      {live.value_num ?? live.value_text} {live.unit ?? ""}
                    </span>
                  </span>
                ) : mock ? (
                  <span className="text-xs font-bold opacity-60">
                    {mock.name}:{" "}
                    <span className="font-black">
                      {mock.series.at(-1)?.value} {mock.unit}
                    </span>
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
