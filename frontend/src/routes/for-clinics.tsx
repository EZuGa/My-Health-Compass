import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/LogoMark";

export const Route = createFileRoute("/for-clinics")({
  head: () => ({
    meta: [
      { title: "For Clinics — The Health Passport" },
      {
        name: "description",
        content:
          "A clinician-shaped longitudinal chart on patient-owned data. Built for concierge, longevity, and functional-medicine practices.",
      },
      { property: "og:title", content: "For Clinics — The Health Passport" },
      {
        property: "og:description",
        content:
          "A clinician-shaped longitudinal chart on patient-owned data. Built for concierge, longevity, and functional-medicine practices.",
      },
    ],
  }),
  component: ForClinicsPage,
});

function ForClinicsPage() {
  return (
    <div className="min-h-screen bg-[#fbf7ef] text-[#1a2236]" style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}>
      <header className="border-b border-[#1a2236]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <LogoMark className="h-10" />
            <span className="text-lg tracking-wide" style={{ fontFamily: '"EB Garamond", serif' }}>
              The Health Passport
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/waitlist" className="text-[#1a2236]/70 hover:text-[#1a2236]">
              For patients
            </Link>
            <a
              href="#demo"
              className="rounded-sm bg-[#6b1626] px-4 py-2 text-[#fbf7ef] transition hover:bg-[#5a1220]"
            >
              Book a demo
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <p
          className="mb-6 text-xs uppercase tracking-[0.3em] text-[#6b1626]"
          style={{ fontFamily: '"EB Garamond", serif' }}
        >
          For Concierge & Longevity Practices
        </p>
        <h1
          className="max-w-3xl text-5xl leading-[1.05] md:text-6xl"
          style={{ fontFamily: '"EB Garamond", serif', fontWeight: 500 }}
        >
          A clinician-shaped chart, built on the data your patients already own.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#1a2236]/80">
          Stop chasing PDFs across portals. The Health Passport ingests outside
          labs, imaging, wearables, and patient-reported instruments — and
          structures them into HPI, ROS, PE, and subspecialty sections you can
          actually read before a visit.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#demo"
            className="rounded-sm bg-[#6b1626] px-6 py-3 text-[#fbf7ef] transition hover:bg-[#5a1220]"
          >
            Book a 20-minute demo
          </a>
          <a
            href="#how"
            className="rounded-sm border border-[#1a2236]/30 px-6 py-3 text-[#1a2236] transition hover:bg-[#1a2236]/5"
          >
            See how it works
          </a>
        </div>
      </section>

      <section id="how" className="border-y border-[#1a2236]/15 bg-[#f3ecdc]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-3">
          {[
            {
              n: "I.",
              h: "Ingest anything",
              p: "Drop a PDF, photograph a paper lab, sync Apple Health or Dexcom. The model routes each artifact into the right clinical section with citations back to the source.",
            },
            {
              n: "II.",
              h: "Structured by section",
              p: "Chief Complaint, HPI, ROS, PE, subspecialty notes, validated instruments (PHQ-9, MoCA, SWLS, K6), medication interactions, nutrition trends — all on one chart.",
            },
            {
              n: "III.",
              h: "Read in 90 seconds",
              p: "Walk into the room knowing what changed. Patients arrive prepared. Notes write themselves from the structured data already in the chart.",
            },
          ].map((c) => (
            <div key={c.n}>
              <div
                className="mb-3 text-3xl text-[#6b1626]"
                style={{ fontFamily: '"EB Garamond", serif' }}
              >
                {c.n}
              </div>
              <h3
                className="mb-3 text-2xl"
                style={{ fontFamily: '"EB Garamond", serif', fontWeight: 500 }}
              >
                {c.h}
              </h3>
              <p className="text-[#1a2236]/75 leading-relaxed">{c.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <blockquote
          className="text-3xl leading-snug text-[#1a2236] md:text-4xl"
          style={{ fontFamily: '"EB Garamond", serif', fontStyle: "italic", fontWeight: 400 }}
        >
          “Built in the NEJM tradition: rigorous, longitudinal, patient-owned —
          the chart you wish you had between visits.”
        </blockquote>
      </section>

      <section id="demo" className="border-t border-[#1a2236]/15 bg-[#1a2236] text-[#fbf7ef]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2
            className="text-4xl md:text-5xl"
            style={{ fontFamily: '"EB Garamond", serif', fontWeight: 500 }}
          >
            See it on one of your patients.
          </h2>
          <p className="mt-4 text-[#fbf7ef]/75">
            Bring a redacted chart. We'll ingest it live and show you the
            structured Passport in under 20 minutes.
          </p>
          <a
            href="mailto:demo@healthpassport.app?subject=Clinic%20demo%20request"
            className="mt-8 inline-block rounded-sm bg-[#fbf7ef] px-8 py-3 text-[#1a2236] transition hover:bg-white"
          >
            Request a demo
          </a>
        </div>
      </section>

      <footer className="border-t border-[#1a2236]/15 py-8 text-center text-xs text-[#1a2236]/60">
        © {new Date().getFullYear()} The Health Passport · Not a medical device.
      </footer>
    </div>
  );
}
