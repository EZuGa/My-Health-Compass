import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricChart } from "@/components/MetricChart";
import { diagnostics, interventions } from "@/data/health";

export const Route = createFileRoute("/_authenticated/diagnostic/$metricId")({
  loader: ({ params }) => {
    const metric = diagnostics.find((m) => m.id === params.metricId);
    if (!metric) throw notFound();
    return { metric };
  },
  notFoundComponent: () => (
    <AppShell>
      <p className="font-bold">Diagnostic variable not found.</p>
      <Link to="/section/$sectionId" params={{ sectionId: "dx" }} className="underline font-bold">
        ← Back to Diagnostic Data
      </Link>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell><p className="font-bold">{error.message}</p></AppShell>
  ),
  component: DiagnosticDetail,
});

function DiagnosticDetail() {
  const { metric } = Route.useLoaderData();
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
        {metric.category} · {metric.modality.toUpperCase()} · trend by date with intervention overlays
      </p>
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
