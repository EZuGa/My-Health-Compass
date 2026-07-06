import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Join the waitlist — The Health Passport" },
      {
        name: "description",
        content:
          "Your labs, wearables, imaging, and notes — in one longitudinal chart you actually own. Join the early-access waitlist.",
      },
      { property: "og:title", content: "Join the waitlist — The Health Passport" },
      {
        property: "og:description",
        content:
          "Your labs, wearables, imaging, and notes — in one longitudinal chart you actually own.",
      },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
            <Link to="/for-clinics" className="text-[#1a2236]/70 hover:text-[#1a2236]">
              For clinics
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 pt-20 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p
            className="mb-6 text-xs uppercase tracking-[0.3em] text-[#6b1626]"
            style={{ fontFamily: '"EB Garamond", serif' }}
          >
            Early access · Spring cohort
          </p>
          <h1
            className="text-5xl leading-[1.05] md:text-6xl"
            style={{ fontFamily: '"EB Garamond", serif', fontWeight: 500 }}
          >
            Your health, finally on one page.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#1a2236]/80">
            Every lab, every scan, every wearable reading, every doctor's
            note — pulled together, structured by an AI trained on clinical
            charting, and owned by you. Not your hospital. Not your insurer.
            You.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-sm border border-[#1a2236]/30 bg-white px-4 py-3 text-[#1a2236] placeholder:text-[#1a2236]/40 focus:border-[#6b1626] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-sm bg-[#6b1626] px-6 py-3 text-[#fbf7ef] transition hover:bg-[#5a1220]"
            >
              Request access
            </button>
          </form>
          {submitted && (
            <p className="mt-4 text-sm text-[#6b1626]" style={{ fontStyle: "italic" }}>
              You're on the list. We'll be in touch when your cohort opens.
            </p>
          )}

          <p className="mt-6 text-xs text-[#1a2236]/55">
            No spam. We will never sell your data — the whole point of the
            Passport is that you own it.
          </p>
        </div>

        <aside className="rounded-sm border border-[#1a2236]/15 bg-[#f3ecdc] p-8">
          <p
            className="mb-4 text-xs uppercase tracking-[0.25em] text-[#6b1626]"
            style={{ fontFamily: '"EB Garamond", serif' }}
          >
            What goes in
          </p>
          <ul className="space-y-3 text-[#1a2236]/85">
            {[
              "Outside labs (Quest, LabCorp, Function, at-home)",
              "Imaging reports & DICOM links",
              "Apple Health, Oura, Dexcom, Whoop",
              "Validated instruments — PHQ-9, MoCA, SWLS, K6",
              "Nutrition trends & medication interactions",
              "Any PDF or photo of paper records",
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <span className="text-[#6b1626]">§</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-t border-[#1a2236]/15 bg-[#1a2236] text-[#fbf7ef]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <blockquote
            className="text-3xl leading-snug md:text-4xl"
            style={{ fontFamily: '"EB Garamond", serif', fontStyle: "italic", fontWeight: 400 }}
          >
            “The chart your doctor wishes you walked in with.”
          </blockquote>
        </div>
      </section>

      <footer className="border-t border-[#1a2236]/15 py-8 text-center text-xs text-[#1a2236]/60">
        © {new Date().getFullYear()} The Health Passport · Not a medical device.
      </footer>
    </div>
  );
}
