import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, Empty, useAsync } from "@/components/backend/ui";
import { CategoryHistory, MyAssessments, SubmitAssessment } from "@/components/doctor";
import { api, getCachedUser, type Category } from "@/lib/api";
import { useSelectedPatient } from "@/lib/selectedPatient";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({ meta: [{ title: "Assessments — Zrunva" }] }),
  component: AssessmentsPage,
});

// Doctor-only page shown for the patient currently opened from the search
// page: file a new assessment for them, browse everything filed so far, and
// pull their full history per category.
function AssessmentsPage() {
  const user = getCachedUser();
  const selected = useSelectedPatient();
  const categories = useAsync<Category[]>(() => api.listCategories(), []);

  if (user && user.role !== "doctor") {
    return (
      <AppShell>
        <Panel title="Assessments">
          <Empty>Filing assessments is a doctor feature.</Empty>
        </Panel>
      </AppShell>
    );
  }

  if (!selected) {
    return (
      <AppShell>
        <Panel title="Assessments">
          <Empty>
            Open a patient from the{" "}
            <Link to="/" className="underline font-bold">
              patient search
            </Link>{" "}
            first — assessments are filed per patient.
          </Empty>
        </Panel>
      </AppShell>
    );
  }

  const cats = categories.data ?? [];
  return (
    <AppShell>
      <section className="max-w-5xl w-full">
        <h1 className="font-serif text-3xl font-black">Assessments</h1>
        <p className="mt-1 text-sm font-semibold opacity-70">
          {selected.name} · patient #{selected.id}
        </p>
      </section>

      <div className="max-w-5xl w-full flex flex-col gap-5">
        <SubmitAssessment categories={cats} fixedPatientId={selected.id} />
        <Panel
          title="Full history by category"
          subtitle="Every assessment on file for this patient, per category"
        >
          <CategoryHistory patientId={selected.id} categories={cats} />
        </Panel>
        <MyAssessments />
      </div>
    </AppShell>
  );
}
