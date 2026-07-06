import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricChart } from "@/components/MetricChart";
import { boxes, interventions, type Metric } from "@/data/health";
import { DaliByBox } from "@/components/DaliArt";

export const Route = createFileRoute("/_authenticated/box/$boxId")({
  loader: ({ params }) => {
    const box = boxes.find((b) => b.id === params.boxId);
    if (!box) throw notFound();
    return { box };
  },
  notFoundComponent: () => (
    <AppShell>
      <p>Box not found.</p>
      <Link to="/" className="underline">Back to dashboard</Link>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell><p>Couldn't load box: {error.message}</p></AppShell>
  ),
  component: BoxDetail,
});

function BoxDetail() {
  const { box } = Route.useLoaderData();
  const Art = DaliByBox[box.id];
  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs uppercase tracking-[0.2em] underline">← Dashboard</Link>
          <h1 className="mt-2 font-serif text-4xl">{box.title}</h1>
          <p className="mt-1 max-w-2xl">{box.subtitle}</p>
        </div>
        <Art className="w-28 h-20" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
        {box.metrics.map((m: Metric) =>
          m.id === "adh" ? (
            <div
              key={m.id}
              className="cloud-panel p-5 flex flex-col h-full min-h-[320px]"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-80">
                Pharmacovigilance
              </div>
              <h3 className="mt-1 font-serif text-2xl font-black leading-tight">
                Medication Interactions
              </h3>
              <p className="mt-2 text-sm font-semibold leading-snug">
                Live evidence-based screen across every currently active medication —
                severity, mechanism, expected effect, management, and linked sources for
                each interacting pair.
              </p>
              <div className="mt-auto pt-4">
                <Link
                  to="/section/$sectionId"
                  params={{ sectionId: "interactions" }}
                  className="inline-block w-full text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md"
                  style={{
                    background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)",
                    color: "#5a1a2e",
                  }}
                >
                  Open Medication Interactions →
                </Link>
              </div>
            </div>
          ) : (
            <MetricChart key={m.id} metric={m} interventions={interventions} />
          ),
        )}
      </div>
    </AppShell>
  );
}
