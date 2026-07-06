import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ToxCheckSection } from "@/components/ToxCheckSection";

export const Route = createFileRoute("/_authenticated/toxcheck")({
  head: () => ({
    meta: [
      { title: "ToxCheck — The Health Passport" },
      {
        name: "description",
        content:
          "Scan products by photo, barcode, label or description. ToxCheck flags hazardous substances and personalizes risk for your medical record.",
      },
    ],
  }),
  component: ToxCheckPage,
});

function ToxCheckPage() {
  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.22em] font-extrabold underline">
        ← Dashboard
      </Link>
      <h1
        className="mt-2 font-serif text-4xl font-black"
        style={{ color: "#5a0f22" }}
      >
        ToxCheck
      </h1>
      <p className="max-w-4xl mt-2 font-semibold">
        Identify hazardous substances in food, cosmetics, packaging and household
        products. Each finding is graded against IARC, EFSA, FDA, EPA IRIS, ECHA
        REACH/SVHC, California Prop 65 and the Stockholm Convention, then
        personalized to your medications and comorbidities.
      </p>

      <ToxCheckSection />
    </AppShell>
  );
}
