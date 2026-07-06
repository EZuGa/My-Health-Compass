import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { nejmSections, auxiliarySections, diagnostics, patient, type DiagnosticMetric } from "@/data/health";
import { HPISection } from "@/components/HPISection";
import { NutritionSection } from "@/components/NutritionSection";
import { ROSSection } from "@/components/ROSSection";
import { PESection } from "@/components/PESection";
import { ChiefComplaintSection } from "@/components/ChiefComplaintSection";
import { IngestedSectionPanel } from "@/components/IngestedSectionPanel";
import { MedicationInteractions } from "@/components/MedicationInteractions";
import { EditableText } from "@/components/EditableText";
import { ToxinsBox } from "@/components/ToxinsBox";
import { DiscussionItemsBox } from "@/components/DiscussionItemsBox";

export const Route = createFileRoute("/_authenticated/section/$sectionId")({
  loader: ({ params }) => {
    const section = [...nejmSections, ...auxiliarySections].find((s) => s.id === params.sectionId);
    if (!section) throw notFound();
    return { section };
  },
  notFoundComponent: () => (
    <AppShell><p className="font-bold">Section not found. <Link to="/" className="underline">Home</Link></p></AppShell>
  ),
  errorComponent: ({ error }) => <AppShell><p className="font-bold">{error.message}</p></AppShell>,
  component: SectionPage,
});

function SectionPage() {
  const { section } = Route.useLoaderData();
  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.22em] font-extrabold underline">← Dashboard</Link>
      <h1 className="mt-2 font-serif text-4xl font-black">{section.title}</h1>

      {section.id === "hpi" ? (
        <HPISection />
      ) : section.id === "chief-complaint" ? (
        <ChiefComplaintSection />
      ) : section.id === "nutrition" ? (
        <NutritionSection />
      ) : section.id === "ros" ? (
        <ROSSection />
      ) : section.id === "pe" ? (
        <PESection />
      ) : section.id === "interactions" ? (
        <MedicationInteractions />
      ) : section.id === "dx" ? (
        <DiagnosticGrid />
      ) : section.id === "timeline" ? (
        <div className="mt-6">
          <Link
            to="/timeline"
            className="inline-block px-6 py-3 text-sm uppercase tracking-[0.18em] font-extrabold rounded-md cloud-panel"
          >
            Open Clinical Timeline →
          </Link>
        </div>
      ) : section.id === "imm" ? (
        <>
          <StaticSection id={section.id} />
          <RecommendationsTimeline />
        </>
      ) : section.id === "exposures" ? (
        <>
          <StaticSection id={section.id} />
          <ToxinsBox />
          <DiscussionItemsBox />
        </>
      ) : (
        <StaticSection id={section.id} />
      )}
      <IngestedSectionPanel sectionId={section.id} />
    </AppShell>
  );
}

function DiagnosticGrid() {
  const groups = diagnostics.reduce<Record<string, DiagnosticMetric[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});
  return (
    <div className="flex-1 flex flex-col">
      <p className="max-w-4xl font-semibold">
        Each diagnostic variable below is a separate entity. Tap any tile to open its trend by
        date — every chart can overlay medication starts, dose changes, procedures, and lifestyle
        interventions on the same timeline, so you can see, for example, how lisinopril initiation
        changed systolic blood pressure, or how a statin shifted the LDL trajectory.
      </p>
      <div className="mt-5 flex-1 flex flex-col gap-6">
        {Object.entries(groups).map(([cat, items]) => (
          <section key={cat} className="flex flex-col">
            <h2 className="font-serif text-xl font-black border-b border-foreground/40 pb-1">{cat}</h2>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr">
              {items.map((m) => {
                const latest = m.series.at(-1);
                const out = latest && m.range && (latest.value < m.range[0] || latest.value > m.range[1]);
                return (
                  <Link
                    key={m.id}
                    to="/diagnostic/$metricId"
                    params={{ metricId: m.id }}
                    className="cloud-box p-4 flex flex-col group h-full"
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-80">
                      {m.modality}
                    </div>
                    <div className="mt-1 font-serif text-base font-black leading-tight">{m.name}</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className={`text-2xl font-black ${out ? "text-[#a00]" : ""}`}>
                        {latest?.value}
                      </span>
                      <span className="text-[11px] font-bold opacity-80">{m.unit}</span>
                    </div>
                    {m.reference && (
                      <div className="mt-1 text-[10px] font-bold opacity-70">ref {m.reference}</div>
                    )}
                    <div className="mt-auto pt-2 text-[10px] uppercase tracking-[0.15em] font-extrabold underline opacity-80 group-hover:opacity-100">
                      Open trend →
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StaticSection({ id }: { id: string }) {
  const content = SECTION_CONTENT[id] ?? FALLBACK;
  return (
    <article className="flex-1 flex flex-col">
      {content.intro && (
        <EditableText
          as="p"
          storageKey={`section:${id}:intro`}
          defaultValue={content.intro}
          multiline
          className="leading-relaxed font-semibold max-w-4xl block"
        />
      )}
      <div className="mt-5 flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
        {content.fields.map((f) =>
          f.label === "__interactions__" ? (
            <div
              key="interactions"
              className="p-4 flex flex-col h-full rounded-md"
              style={{ background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)", color: "#5a1a2e" }}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
                Medication Interactions
              </div>
              <div className="mt-1 text-sm font-bold leading-snug">
                Live evidence-based screen across every active medication — severity,
                mechanism, expected effect, management, and linked sources for each
                interacting pair.
              </div>
              <div className="mt-auto pt-3">
                <Link
                  to="/section/$sectionId"
                  params={{ sectionId: "interactions" }}
                  className="inline-block w-full text-center text-[11px] uppercase tracking-[0.18em] font-extrabold py-2 rounded-md border border-[#5a1a2e]/30 bg-white/40 hover:bg-white/70 transition"
                >
                  Open detailed interactions →
                </Link>
              </div>
            </div>
          ) : (
            <div key={f.label} className="cloud-panel p-4 flex flex-col h-full">
              <EditableText
                storageKey={`section:${id}:label:${f.label}`}
                defaultValue={f.label}
                className="text-[11px] uppercase tracking-[0.18em] font-extrabold block"
              />
              <EditableText
                as="div"
                storageKey={`section:${id}:value:${f.label}`}
                defaultValue={f.value}
                multiline
                className="mt-1 text-base font-bold leading-snug whitespace-pre-line block"
              />
            </div>
          ),
        )}
      </div>
    </article>
  );
}

type RecItem = {
  category: "Immunization" | "Screening";
  name: string;
  basis: string;
  last: string;
  due: string;
  status: "Overdue" | "Due soon" | "Up to date";
};

const RECOMMENDATIONS: RecItem[] = [
  // Patient: Mrs. Z — 47F, dyslipidemia, HTN, ASCVD risk, vit D insufficiency, family Hx premature CVD.
  { category: "Immunization", name: "Influenza (annual)", basis: "ACIP — all adults ≥6 mo, annually", last: "2025-10", due: "2026-10", status: "Due soon" },
  { category: "Immunization", name: "COVID-19 (2025–26 formulation)", basis: "ACIP — annual update for adults ≥18 y", last: "2025-11", due: "2026-10", status: "Due soon" },
  { category: "Immunization", name: "Tdap / Td booster", basis: "ACIP — every 10 y after primary Tdap", last: "2022", due: "2032", status: "Up to date" },
  { category: "Immunization", name: "HPV catch-up", basis: "ACIP — shared decision-making age 27–45", last: "Not given", due: "Discuss next visit", status: "Due soon" },
  { category: "Immunization", name: "Zoster (RZV, Shingrix)", basis: "ACIP — routine at age 50 (2 doses)", last: "Not given", due: "2028-06 (age 50)", status: "Up to date" },
  { category: "Immunization", name: "Hepatitis B (3-dose)", basis: "ACIP — universal adults 19–59 y", last: "Unknown", due: "Verify titer; vaccinate if non-immune", status: "Overdue" },
  { category: "Immunization", name: "MMR / Varicella", basis: "ACIP — immunity required for adults", last: "Childhood", due: "Confirm immunity (titer)", status: "Up to date" },
  { category: "Screening", name: "Mammography", basis: "USPSTF 2024 — biennial, ages 40–74", last: "2025-04", due: "2027-04", status: "Up to date" },
  { category: "Screening", name: "Cervical cytology + HPV co-test", basis: "USPSTF — every 5 y, ages 30–65", last: "2024", due: "2029", status: "Up to date" },
  { category: "Screening", name: "Colorectal cancer (FIT or colonoscopy)", basis: "USPSTF — begin at age 45", last: "Not done", due: "Now (overdue from age 45)", status: "Overdue" },
  { category: "Screening", name: "Lipid panel / ASCVD risk", basis: "ACC/AHA — every 4–6 y; annual on therapy", last: "2026-02", due: "2027-02", status: "Up to date" },
  { category: "Screening", name: "HbA1c / fasting glucose", basis: "USPSTF — every 3 y, ages 35–70 (overweight)", last: "2025-06", due: "2028-06", status: "Up to date" },
  { category: "Screening", name: "Blood pressure (in-clinic)", basis: "USPSTF — annually for adults with HTN", last: "2026-05", due: "2027-05", status: "Up to date" },
  { category: "Screening", name: "Bone density (DXA)", basis: "USPSTF — baseline at menopause if risk factors", last: "Not done", due: "Age 50 (2028)", status: "Up to date" },
  { category: "Screening", name: "Vitamin D 25-OH (re-check)", basis: "Endocrine Society — re-test 3 mo after repletion", last: "2025-06 (25.5 ng/mL — low)", due: "2026-09", status: "Due soon" },
  { category: "Screening", name: "PHQ-9 / depression screen", basis: "USPSTF — at least annually", last: "2026-03", due: "2027-03", status: "Up to date" },
  { category: "Screening", name: "Skin examination", basis: "USPSTF — clinical exam for high-risk adults", last: "Not done", due: "2026-12", status: "Due soon" },
  { category: "Screening", name: "Dental cleaning", basis: "ADA — every 6 mo", last: "2026-01", due: "2026-07", status: "Due soon" },
  { category: "Screening", name: "Ophthalmology (comprehensive)", basis: "AAO — every 2 y, ages 40–54", last: "2024-09", due: "2026-09", status: "Due soon" },
];

function RecommendationsTimeline() {
  const items = [...RECOMMENDATIONS].sort((a, b) => {
    const order = { Overdue: 0, "Due soon": 1, "Up to date": 2 } as const;
    return order[a.status] - order[b.status];
  });
  const palette = (s: RecItem["status"]) =>
    s === "Overdue"
      ? { dot: "#ffc2d2", bg: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 100%)", fg: "#5a1a2e" }
      : s === "Due soon"
        ? { dot: "#c9b8ee", bg: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)", fg: "#3a2a55" }
        : { dot: "#9caf88", bg: "linear-gradient(160deg, #bcd0a6 0%, #9caf88 100%)", fg: "#1a2a18" };
  return (
    <section className="mt-8 cloud-panel p-5">
      <div className="text-[11px] uppercase tracking-[0.22em] font-extrabold opacity-80">
        Guideline-recommended preventive care
      </div>
      <h2 className="font-serif text-2xl font-black mt-1">
        Evidence-based timeline — due dates
      </h2>
      <p className="mt-2 max-w-4xl text-sm font-semibold opacity-85">
        Personalized to a 47-year-old woman with dyslipidemia, hypertension, and elevated ASCVD
        risk. Sources: USPSTF, ACIP/CDC, ACC/AHA, Endocrine Society, AAO, ADA.
      </p>
      <ol className="mt-5 relative border-l-2 border-foreground/30 pl-5 flex flex-col gap-4">
        {items.map((r) => {
          const p = palette(r.status);
          return (
          <li key={r.name} className="relative">
            <span
              className="absolute -left-[27px] top-1 w-3 h-3 rounded-full"
              style={{ background: p.dot }}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">
                {r.category}
              </span>
              <span className="font-serif text-base font-black">{r.name}</span>
              <span
                className="text-[10px] uppercase tracking-[0.18em] font-extrabold px-2 py-0.5 rounded"
                style={{ background: p.bg, color: p.fg }}
              >
                {r.status}
              </span>
            </div>
            <div className="mt-1 text-sm font-bold">
              Due: <span className="font-black">{r.due}</span>
              <span className="opacity-70 font-semibold"> · Last: {r.last}</span>
            </div>
            <div className="text-xs font-semibold opacity-80">{r.basis}</div>
          </li>
          );
        })}
      </ol>
    </section>
  );
}


type Section = { intro?: string; fields: { label: string; value: string }[] };
const FALLBACK: Section = {
  intro: "This section will be populated as data is captured.",
  fields: [{ label: "Status", value: "Awaiting entry." }],
};

const SECTION_CONTENT: Record<string, Section> = {
  "patient-id": {
    intro:
      "A 47-year-old right-handed woman with dyslipidemia, mild hyperprolactinemia, vitamin D insufficiency, and a family history of premature cardiovascular disease, presenting for cardiometabolic follow-up and routine surveillance.",
    fields: [
      { label: "Name", value: "Mrs. Z" },
      { label: "Date of Birth", value: "06/14/1978 (age 47)" },
      { label: "Sex", value: "Female" },
      { label: "Personal Record №", value: patient.pid },
      { label: "Handedness", value: "Right" },
      { label: "Biometrics", value: "Height: 165 cm\nWeight: 71.9 kg\nWaist circumference: 89 cm\nBMI: 26.4 kg/m²\nWaist-to-height ratio: 0.54 (ref <0.50)" },
    ],
  },
  pmh: {
    fields: [
      { label: "Dyslipidemia", value: "TC 5.99 mmol/L, LDL 4.20, HDL 1.03, TG 2.39 (Feb 2026). Atherogenic index 4.82 (ref ≤3.00)." },
      { label: "Mild hyperprolactinemia", value: "Prolactin 23.42 ng/mL (ref ≤23.30), Feb 2026 — endocrinology surveillance." },
      { label: "Vitamin D insufficiency", value: "25-OH 25.5 ng/mL (Jun 2025); supplemented." },
      { label: "Borderline ESR", value: "ESR 20 mm/h (Jun 2025) → 17 mm/h (Feb 2026)." },
      { label: "Cardiometabolic risk", value: "Family history of premature CAD; metabolic syndrome surveillance." },
    ],
  },
  psh: {
    fields: [
      { label: "Surgeries", value: "None reported." },
      { label: "Implanted devices", value: "None." },
    ],
  },
  meds: {
    fields: [
      { label: "Atorvastatin 20 mg PO qHS", value: "Since Mar 2026 — for LDL/total cholesterol." },
      { label: "Lisinopril 20 mg PO daily", value: "Since Jan 2026, ↑ from 10 mg in Feb 2026." },
      { label: "Metformin 500 mg PO BID", value: "Since Nov 2025 — for metabolic risk." },
      { label: "Aspirin 81 mg PO daily", value: "Since Sep 2025 — primary prevention." },
      { label: "Vitamin D 2000 IU PO daily", value: "Since Jul 2025." },
      { label: "__interactions__", value: "" },
    ],
  },
  allergies: {
    fields: [
      { label: "Drug allergies", value: "None known." },
      { label: "Environmental / Food", value: "None reported." },
    ],
  },
  fhx: {
    fields: [
      { label: "Father", value: "Myocardial infarction at 62; deceased 71 (heart failure)." },
      { label: "Mother", value: "Hypertension, type 2 diabetes; alive age 78." },
      { label: "Siblings", value: "Sister — dyslipidemia, alive 50." },
      { label: "Oncologic", value: "No first-degree relatives." },
    ],
  },
  shx: {
    fields: [
      { label: "Tobacco", value: "Never smoker." },
      { label: "Alcohol", value: "Occasional wine, ~3 drinks/week." },
      { label: "Recreational drugs", value: "None." },
      { label: "Occupation", value: "Sedentary office work." },
      { label: "Exercise", value: "~6,800 steps/day; beginning structured walking." },
      { label: "Diet", value: "Mediterranean pattern initiated Apr 2026." },
      { label: "Sleep", value: "Average 6.4 h, efficiency 82 %." },
      { label: "Advance directives", value: "Healthcare proxy on file." },
    ],
  },
  imm: {
    fields: [
      { label: "Influenza", value: "2025-10 — up to date." },
      { label: "COVID-19", value: "Booster 2025-11." },
      { label: "Tdap", value: "2022 — up to date." },
      { label: "Mammography", value: "2025-04 — negative." },
      { label: "Cervical cytology", value: "2024 — normal." },
    ],
  },
  ros: {
    intro: "Pertinent positives and negatives, organized by system.",
    fields: [
      { label: "Constitutional", value: "Mild fatigue. No fever or weight change." },
      { label: "Cardiovascular", value: "Intermittent palpitations; no chest pain, syncope, orthopnea, or PND." },
      { label: "Respiratory", value: "No cough, wheeze, or hemoptysis." },
      { label: "Endocrine", value: "No galactorrhea; menses regular." },
      { label: "Neurological", value: "No headache, focal weakness, or memory change." },
      { label: "Psychiatric", value: "Mild stress, denies depressive ideation." },
      { label: "Musculoskeletal", value: "Occasional lower back stiffness." },
    ],
  },
  pe: {
    intro: "Vital signs and organ-system examination at the most recent visit.",
    fields: [
      { label: "BP", value: "128/82 mmHg, bilateral." },
      { label: "HR", value: "76 bpm, regular." },
      { label: "RR", value: "14 /min." },
      { label: "Temp", value: "36.6 °C." },
      { label: "SpO₂", value: "98 % on room air." },
      { label: "Height / Weight / BMI", value: "164 cm / 71 kg / 26.4 kg/m²." },
      { label: "General", value: "Well-appearing, no acute distress." },
      { label: "Cardiovascular", value: "RRR; S1/S2 normal; no murmur, rub, or gallop." },
      { label: "Respiratory", value: "Clear to auscultation bilaterally." },
      { label: "Abdomen", value: "Soft, non-tender, no organomegaly." },
      { label: "Extremities", value: "No edema; pulses 2+ throughout." },
      { label: "Neurological", value: "Alert and oriented; non-focal exam." },
    ],
  },
  dx: {
    fields: [
      { label: "CBC (2026-02-28)", value: "RBC 4.81, HGB 142 g/L, HCT 0.431 ↑, WBC 5.63, PLT 309, LYMPH 43.2 % ↑, NEU 48.5 % ↓." },
      { label: "CBC (2025-06-12)", value: "RBC 4.24, HGB 129 g/L, HCT 0.374, WBC 6.10, PLT 268." },
      { label: "Lipid panel (2026-02-28)", value: "TC 5.99, LDL 4.20, HDL 1.03, TG 2.39 ↑, VLDL 1.10 ↑, CHOL/HDL 5.82, atherogenic index 4.82 ↑." },
      { label: "Lipid panel (2025-06-12)", value: "TC 5.09, LDL 3.23, HDL 0.87, TG 2.59 ↑, atherogenic index 4.85 ↑." },
      { label: "HbA1c (2025-06-12)", value: "5.59 % (ref 4.80–5.90)." },
      { label: "Electrolytes (2025-06-12 → 2026-02-28)", value: "Na 139.6, K 4.05; Mg 0.81 → 0.92." },
      { label: "Endocrine (2026-02-28)", value: "TSH 2.85 µIU/mL; Prolactin 23.42 ng/mL ↑; B12 648.5 pmol/L; Procalcitonin <0.05." },
      { label: "Vitamin D (2025-06-12)", value: "25-OH 25.5 ng/mL — insufficient." },
      { label: "Inflammation", value: "ESR 20 → 17 mm/h; hs-CRP 3.1 mg/L." },
      { label: "Coagulation (2026-02-28)", value: "PT 12.3 s, INR 0.95, APTT 27.8 s, Fibrinogen 2.83 g/L." },
      { label: "ECG (2024-04-07, 2024-04-12, 2026-05-17)", value: "Sinus rhythm; no acute ST-T changes — Apple Health single-lead recordings." },
      { label: "Cardiac MRI (2026-05-10)", value: "Normal LV function, no late gadolinium enhancement." },
    ],
  },
  timeline: {
    intro: "See the dedicated Clinical Timeline view — every metric, every intervention, every dose change.",
    fields: [
      { label: "Open", value: "Use the \"Open Clinical Timeline\" button in the sidebar to view the full chronological record with intervention markers overlaid on each trend." },
    ],
  },
};
