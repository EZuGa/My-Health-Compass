import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FORM_CATEGORIES, formsByCategory } from "@/data/medical-forms";

export const Route = createFileRoute("/_authenticated/forms")({
  head: () => ({
    meta: [
      { title: "Medical Forms — The Health Passport" },
      { name: "description", content: "Auto-fill standardized U.S. medical forms with your record and export as PDF." },
    ],
  }),
  component: FormsIndex,
});

function FormsIndex() {
  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.22em] font-extrabold underline">← Dashboard</Link>
      <h1 className="mt-2 font-serif text-4xl font-black">Standardized Medical Forms</h1>
      <p className="max-w-4xl mt-2 font-semibold">
        Every form below is pre-filled from your Health Passport record. Open one to review,
        edit any field, and export a print-ready PDF that mirrors the issuing agency's
        required content. Sources: DOL · SSA · CMS · VA · DoD · OSHA · DOT/FMCSA · FAA · OPM · HHS · USCIS · CDC/ACIP · National POLST.
      </p>

      <div className="mt-6 flex-1 flex flex-col gap-6">
        {FORM_CATEGORIES.map((cat) => {
          const forms = formsByCategory(cat.id);
          if (!forms.length) return null;
          return (
            <section key={cat.id} className="flex flex-col">
              <h2 className="font-serif text-xl font-black border-b border-foreground/40 pb-1">
                {cat.title}
              </h2>
              <p className="text-xs font-bold opacity-75 mt-1">{cat.blurb}</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr">
                {forms.map((f) => (
                  <Link
                    key={f.id}
                    to="/forms/$formId"
                    params={{ formId: f.id }}
                    className="cloud-box p-4 flex flex-col group h-full"
                    style={{ background: "linear-gradient(160deg, #d5ecd5 0%, #a8d5a8 100%)", color: "#163019" }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-80">
                      {f.number}
                    </div>
                    <div className="mt-1 font-serif text-base font-black leading-tight">{f.name}</div>
                    <div className="mt-1 text-[11px] font-semibold opacity-80">{f.issuer}</div>
                    <div className="mt-2 text-xs font-semibold leading-snug">{f.purpose}</div>
                    <div className="mt-auto pt-2 text-[10px] uppercase tracking-[0.15em] font-extrabold underline">
                      Open document →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
