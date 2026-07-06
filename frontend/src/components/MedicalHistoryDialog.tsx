import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIngestedObservations } from "@/lib/ingested";
import {
  getSelectedSubspecialty,
  type Subspecialty,
  type SystemKey,
} from "@/data/subspecialties";

const STORAGE_KEY = "medical-history:html";

export function MedicalHistoryDialog() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subspecialty, setSubspecialty] = useState<Subspecialty | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const initialRef = useRef<string | null>(null);

  useEffect(() => {
    setSubspecialty(getSelectedSubspecialty());
    const onChange = () => setSubspecialty(getSelectedSubspecialty());
    window.addEventListener("subspecialty:changed", onChange);
    return () => window.removeEventListener("subspecialty:changed", onChange);
  }, []);

  // Restore saved edits after the article mounts.
  useEffect(() => {
    if (!open || !articleRef.current) return;
    if (initialRef.current === null) initialRef.current = articleRef.current.innerHTML;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) articleRef.current.innerHTML = saved;
    } catch {
      /* ignore */
    }
  }, [open]);

  const save = () => {
    if (!articleRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, articleRef.current.innerHTML);
    } catch {
      /* ignore */
    }
  };

  const resetEdits = () => {
    if (!articleRef.current || initialRef.current === null) return;
    if (!confirm("Discard all edits and restore the original medical history?")) return;
    articleRef.current.innerHTML = initialRef.current;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const downloadPdf = () => {
    if (!articleRef.current) return;
    const html = articleRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Medical History — Mrs. Z</title>
<style>
  @page { margin: 18mm; }
  body { font-family: 'Iowan Old Style', 'Palatino Linotype', Georgia, serif; font-size: 12pt; line-height: 1.55; color: #111; }
  h1,h2,h3,h4 { font-family: inherit; }
  h2 { font-size: 13pt; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #000; padding-bottom: 2pt; margin-top: 18pt; }
  h4 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 10pt; }
  dl { margin: 6pt 0; } dt { font-weight: 700; } dd { margin: 0 0 4pt 14pt; }
  ul { margin: 4pt 0 4pt 18pt; } li { margin-bottom: 2pt; }
  p { margin: 6pt 0; }
  .title { font-size: 16pt; font-weight: 800; margin-bottom: 4pt; }
  .subtitle { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.18em; color: #444; margin-bottom: 14pt; }
</style></head><body>
<div class="title">Comprehensive Academic Medical Record</div>
<div class="subtitle">NEJM-Style Format · Mrs. Z</div>
${html}
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-center text-xs uppercase tracking-[0.18em] font-extrabold py-2 rounded-md cloud-panel cursor-pointer"
          style={{ background: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)", color: "#3a2a55" }}
        >
          Medical History
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[color:var(--background)] border border-foreground/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-xs uppercase tracking-[0.22em] font-extrabold">
            Comprehensive Academic Medical Record · NEJM-Style Format
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (editing) save();
              setEditing((e) => !e);
            }}
            className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel"
          >
            {editing ? "Save edits" : "Edit"}
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel"
            style={{ background: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)", color: "#3a2a55" }}
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={resetEdits}
            className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1.5 rounded-md cloud-panel opacity-80"
          >
            Reset
          </button>
          {editing && (
            <span className="text-[11px] font-bold opacity-70">
              Editing — click anywhere in the record and type. Press “Save edits” when done.
            </span>
          )}
        </div>

        <article
          ref={articleRef as never}
          contentEditable={editing}
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={save}
          className={
            "mt-4 font-serif text-[15px] leading-[1.75] font-medium text-foreground space-y-5 " +
            (editing ? "outline outline-1 outline-foreground/30 rounded-md p-3" : "")
          }
        >
          {subspecialty && (
            <p className="text-[11px] uppercase tracking-[0.18em] font-extrabold opacity-70 -mt-2">
              Organized for {subspecialty.name} — non-pertinent sections
              suppressed; pertinent systems surfaced first.
            </p>
          )}



          {/* ---------------- SECTION I ---------------- */}
          <SectionHeading>
            Patient Identification
          </SectionHeading>
          <DefList
            items={[
              ["Full legal name", "Z., [redacted], M."],
              ["Date of birth / Age", "12 March 1979 / 47 years"],
              ["Personal record number", "Auto-assigned 10-digit PID (see header)"],
            ]}
          />

          {/* ---------------- SECTION II ---------------- */}
          <SectionHeading>Chief Complaint</SectionHeading>
          <p>
            <em>"My heart keeps fluttering and I'm worried about my cholesterol."</em>{" "}
            × 12 months (palpitations); × 4 years (known dyslipidemia, routine
            surveillance).
          </p>

          {/* ---------------- SECTION III ---------------- */}
          <SectionHeading>History of Present Illness</SectionHeading>
          <p>
            Mrs. Z is a 47-year-old right-handed woman with a four-year history of
            mixed dyslipidemia and a strong paternal history of premature coronary
            disease, who presents to the outpatient cardiometabolic clinic for
            evaluation of intermittent palpitations and routine surveillance of her
            lipid profile. She had been in her usual state of health until approximately
            twelve months before the current evaluation, when she first noted episodic,
            non-positional palpitations of <strong>sudden onset</strong>, localized to
            the <strong>precordium without radiation</strong>, lasting from a few
            seconds to several minutes and recurring two to four times per week. The
            sensation is described as a <strong>"fluttering" or "skipping"</strong>{" "}
            quality, occurring at rest as well as during mild exertion. Episodes are
            not consistently aggravated by caffeine, stress, or the menstrual cycle,
            and resolve spontaneously or with slow breathing. There is no relation to
            meals, posture, or time of day. Severity is rated <strong>3 / 10</strong>{" "}
            for discomfort and <strong>5 / 10</strong> for anxiety.
          </p>
          <p>
            Approximately four months before presentation, she noted gradually
            increasing fatigue, modestly reduced exercise tolerance during her
            habitual walking program, and intermittent low back stiffness. She denies
            chest pain, pressure, dyspnea at rest, orthopnea, paroxysmal nocturnal
            dyspnea, presyncope, syncope, peripheral edema, claudication, or change
            in functional capacity beyond NYHA class I. There have been no prior
            episodes of sustained tachyarrhythmia. She has self-treated with reduced
            caffeine intake and a wearable single-lead ECG, which on three separate
            recordings has shown sinus rhythm. No prescription antiarrhythmic therapy
            has been trialed. She has continued her work and ADLs without limitation.
            The patient's primary concern is whether the palpitations herald
            inherited coronary disease, given her father's history; she would like
            "a clear plan" and to "avoid my father's outcome."
          </p>

          {/* ---------------- SECTION IV ---------------- */}
          <SectionHeading>Past Medical History</SectionHeading>
          <ul className="list-none pl-0 space-y-2">
            <li>
              <strong>Active problem list (in order of significance):</strong>
              <ul className="list-none pl-0 mt-1 space-y-1">
                <li>Mixed dyslipidemia — diagnosed 2022; currently uncontrolled on monotherapy (LDL 4.20 mmol/L, Feb 2026).</li>
                <li>Stage 1 hypertension — diagnosed Jan 2026; controlled on ACE inhibitor.</li>
                <li>Borderline dysglycemia — HbA1c 5.59 % (Jun 2025); metformin initiated for cardiometabolic risk reduction.</li>
                <li>Mild hyperprolactinemia — prolactin 23.42 ng/mL (Feb 2026); asymptomatic.</li>
                <li>Vitamin D insufficiency — on replacement.</li>
              </ul>
            </li>
            <li>
              <strong>Chronic conditions:</strong> No prior diagnosis of diabetes
              mellitus, CKD, COPD, asthma, heart failure, atrial fibrillation,
              CAD, stroke / TIA, seizure disorder, autoimmune disease, malignancy,
              HIV, or viral hepatitis.
            </li>
            <li>
              <strong>Prior acute illnesses:</strong> No hospitalizations, ICU
              admissions, VTE, MI, or CVA. COVID-19 in Jan 2022, mild, outpatient;
              fully vaccinated (primary series + two boosters).
            </li>
            {(subspecialty?.lens?.showScreeningHistory ?? true) && (
              <li>
                <strong>Screening history:</strong> Cervical cytology Mar 2025 —
                normal; mammography Apr 2025 — BI-RADS 1; colonoscopy not yet
                performed (planned at age 50); DEXA not performed; AAA screening
                N/A; HIV / HBV / HCV negative (Feb 2026).
              </li>
            )}
          </ul>


          {/* ---------------- SECTION V ---------------- */}
          <SectionHeading>Past Surgical History</SectionHeading>
          <p>
            Low transverse cesarean delivery × 1 (2008, general anesthesia,
            uncomplicated). Diagnostic upper endoscopy (2019, conscious sedation —
            mild antral gastritis). No other surgical, biopsy, endoscopic, or
            interventional cardiology procedures.
          </p>

          {/* ---------------- SECTION VI ---------------- */}
          <SectionHeading>Medications</SectionHeading>
          <ul className="list-none pl-0 space-y-2">
            <li>
              <strong>Current prescription medications (reconciled):</strong>{" "}
              Lisinopril 20 mg PO daily — hypertension — started Jan 2026 at 10
              mg, uptitrated Feb 2026 (Dr. Davitashvili); Atorvastatin 20 mg PO
              at bedtime — dyslipidemia — started Mar 2026 (Dr. Davitashvili);
              Metformin 500 mg PO BID — cardiometabolic risk reduction — started
              Nov 2025 (Dr. Kapanadze); Aspirin 81 mg PO daily — primary
              prevention — started Sept 2025 (Dr. Kapanadze); Cholecalciferol
              2000 IU PO daily — vitamin D insufficiency — started Jun 2025.
              Self-reported adherence ≈ 88 %.
            </li>
            <li>
              <strong>OTC:</strong> Acetaminophen 500 mg PO PRN headache (≤ 2 ×
              per month).
            </li>
            <li>
              <strong>Supplements:</strong> Magnesium glycinate 200 mg QHS;
              omega-3 1 g daily.
            </li>
            <li>
              <strong>Immunizations:</strong> Influenza Oct 2025; COVID-19
              (primary + booster Sept 2024); Tdap 2019; HPV complete; MMR /
              varicella immune; pneumococcal and shingles — not yet
              age-indicated.
            </li>
            <li>
              <strong>Recently discontinued:</strong> Combined oral contraceptive
              — stopped Nov 2024 (age + lipid profile).
            </li>
          </ul>


          {/* ---------------- SECTION VII ---------------- */}
          <SectionHeading>
            Allergies and Adverse Drug Reactions
          </SectionHeading>
          <p>
            <strong>NKDA</strong> — no known drug allergies. No food allergies.
            Reports mild seasonal allergic rhinitis (spring pollen, intermittent).
            No reaction to iodinated contrast or latex.
          </p>

          {/* ---------------- SECTION VIII ---------------- */}
          <SectionHeading>Family History</SectionHeading>
          <p>
            <strong>Father:</strong> MI at age 62, died at age 71 of congestive
            heart failure; lifelong dyslipidemia and hypertension. <strong>Mother:</strong>{" "}
            age 78, alive; hypertension and type 2 diabetes mellitus. <strong>
            Sister</strong>, age 50, alive: dyslipidemia. <strong>Brother</strong>,
            age 44, alive: healthy. <strong>Two children</strong> (age 18 and 15):
            healthy. <strong>Maternal grandmother:</strong> stroke at 82.{" "}
            <strong>Paternal grandfather:</strong> MI at 58. No family history of
            sudden cardiac death, inherited cardiomyopathy, long QT syndrome,
            Marfan syndrome, malignancy of breast / ovary / colon before age 50,
            autoimmune disease, psychiatric illness with hospitalization,
            neurodegenerative disease, bleeding or clotting disorders, congenital
            anomalies, or known genetic syndrome. No history of preeclampsia or
            gestational diabetes.
          </p>

          {/* ---------------- SECTION IX ---------------- */}
          <SectionHeading>Social History</SectionHeading>
          <ul className="list-none pl-0 space-y-2">
            <li><strong>Living situation:</strong> Owns and lives in a two-storey home in Tbilisi with husband and two children; no accessibility limitations; smoke detectors in place.</li>
            <li><strong>Functional status:</strong> Independent in all ADLs and IADLs; no mobility aids; no falls in the past 12 months.</li>
            <li><strong>Occupation:</strong> Administrative manager, 18 years; predominantly sedentary; no occupational exposure to asbestos, silica, solvents, or ionizing radiation; no military service; no disability claim.</li>
            <li><strong>Education:</strong> University degree (Master's, public administration); health literacy adequate (assessed informally).</li>
            <li><strong>Substance use:</strong> Tobacco — <em>never smoker</em> (cigarettes, cigars, pipe, chewing, vaping). Alcohol — approximately three 150 mL glasses of wine per week; CAGE 0 / 4, AUDIT-C 2 / 12; no history of withdrawal. Recreational drugs — denies marijuana, cocaine, opioids, methamphetamine, hallucinogens, prescription misuse; no IV drug use history.</li>
            {(subspecialty?.lens ? subspecialty.lens.showSexualHistory : true) && (
              <li><strong>Sexual & obstetric history:</strong> Heterosexual, monogamous with husband; sexually active; contraception by tubal ligation (2010); G2P2 (2008 SVD attempted, converted to LTCS; 2010 LTCS); no STI history.</li>
            )}
            <li><strong>Diet and nutrition:</strong> Mediterranean pattern initiated Apr 2026; no food restrictions; weight stable (intentional loss of 2 kg over 6 months); food-secure.</li>
            <li><strong>Exercise:</strong> Walking 30–45 min × 5 days / week (≈ 6800 steps / day); no resistance training.</li>
            <li><strong>Mental health:</strong> Moderate work-related stress; PHQ-9 = 4 (minimal); GAD-7 = 6 (mild); sleeps 6.4 h / night with mid-cycle awakening; no trauma or domestic-violence disclosure on sensitive screening; strong family and friend support; identifies as Georgian-Orthodox Christian but does not request religious accommodations; advance care planning not yet completed.</li>
            <li><strong>Social determinants:</strong> Insured; private car and public transit access; food-secure; stable housing; no financial strain; neighborhood safe; routine healthcare access.</li>
            <li><strong>Travel:</strong> Domestic only in the past 12 months; last international travel Türkiye, 2022; no endemic-disease exposure.</li>
            <li><strong>Legal:</strong> No advance directive; husband designated informal health-care proxy; no POLST / MOLST; code status — full code (default outpatient); not registered organ donor; no legal guardian.</li>
          </ul>

          {/* ---------------- SECTION X ---------------- */}
          <SectionHeading>Review of Systems</SectionHeading>
          <SystemList
            subspecialty={subspecialty}
            items={[
              { key: "constitutional", label: "Constitutional", body: "Fatigue (+); denies fever, chills, night sweats, unintentional weight change." },
              { key: "skin", label: "Skin", body: "Denies rash, pruritus, mole change, easy bruising." },
              { key: "head", label: "Head", body: "Occasional tension-type headache; denies trauma." },
              { key: "eyes", label: "Eyes", body: "Presbyopia, reading glasses; denies diplopia, photophobia, floaters; last eye exam Mar 2026." },
              { key: "ears", label: "Ears", body: "Denies hearing loss, tinnitus, vertigo." },
              { key: "nose", label: "Nose", body: "Seasonal rhinorrhea; denies epistaxis, anosmia." },
              { key: "mouth", label: "Mouth/Throat", body: "Denies sore throat, dysphagia, hoarseness, oral lesions; routine dental care." },
              { key: "neck", label: "Neck", body: "Denies pain, masses, stiffness." },
              { key: "respiratory", label: "Respiratory", body: "Denies cough, sputum, hemoptysis, dyspnea, wheeze, snoring, witnessed apnea." },
              { key: "cardiovascular", label: "Cardiovascular", body: "Palpitations as in HPI (+); denies chest pain, exertional dyspnea, orthopnea, PND, edema, claudication, syncope." },
              { key: "gi", label: "Gastrointestinal", body: "Denies nausea, vomiting, hematemesis, abdominal pain, change in bowel habit, melena, hematochezia, GERD; bowels daily, formed." },
              { key: "gu", label: "Genitourinary", body: "Denies dysuria, frequency, nocturia, hematuria, incontinence; LMP regular, 28-day cycle, last menses 4 May 2026; no menopausal symptoms." },
              { key: "msk", label: "Musculoskeletal", body: <>Intermittent low back stiffness (+); denies joint swelling, morning stiffness &gt; 30 min, gout, fracture.</> },
              { key: "neuro", label: "Neurological", body: "Denies focal weakness, numbness, paresthesias, tremor, gait disturbance, memory loss, speech difficulty, seizure." },
              { key: "psych", label: "Psychiatric", body: "Mild stress and sleep fragmentation as above; denies suicidal or homicidal ideation, hallucinations, panic, substance craving." },
              { key: "endocrine", label: "Endocrine", body: "Denies heat / cold intolerance, polyuria, polydipsia, polyphagia, hair or skin change." },
              { key: "heme", label: "Hematologic / Lymphatic", body: "Denies easy bruising, prolonged bleeding, lymphadenopathy, prior clots, transfusion." },
              { key: "immuno", label: "Immunologic / Allergic", body: "No recurrent infections; seasonal allergic rhinitis only." },
            ]}
          />



          {/* ---------------- SECTION XI ---------------- */}
          <SectionHeading>Physical Examination</SectionHeading>
          <SystemList
            subspecialty={subspecialty}
            items={[
              { key: "vitals", label: "Vital signs", body: "T 36.6 °C (oral); HR 76 bpm regular; BP 128 / 82 mm Hg (right arm, seated) and 126 / 80 mm Hg (left arm, seated); RR 14; SpO₂ 98 % on room air; height 165 cm; weight 71.9 kg; BMI 26.4 kg / m²; pain 0 / 10; orthostatic vitals not indicated." },
              { key: "general", label: "General appearance", body: "Well-appearing, well-nourished woman in no acute distress; alert and oriented × 4; affect calm and cooperative; well-groomed; no pallor, cyanosis, jaundice, or diaphoresis." },
              { key: "skin", label: "Skin", body: "Warm, dry, normal turgor; no rash, ulcer, or suspicious lesion; nails without clubbing, koilonychia, or splinter hemorrhage." },
              { key: "head", label: "Head", body: "NCAT; no scalp lesion or temporal-artery tenderness." },
              { key: "eyes", label: "Eyes", body: "PERRLA; EOMI; no nystagmus; conjunctivae pink, sclerae anicteric; fundi — sharp disc margins, no AV nicking, hemorrhage, exudate, or papilledema; visual fields full to confrontation." },
              { key: "ears", label: "Ears", body: "External ears normal; canals patent; TMs intact and mobile; whispered voice 60 cm bilaterally; no mastoid tenderness." },
              { key: "nose", label: "Nose", body: "Mucosa mildly pale and boggy (allergic); septum midline; no sinus tenderness." },
              { key: "mouth", label: "Mouth / Throat", body: "Moist mucosa; dentition intact; tongue midline; tonsils 1+ without exudate; uvula midline." },
              { key: "neck", label: "Neck", body: "Supple, full ROM; thyroid not enlarged, no nodules or bruit; no lymphadenopathy; carotids 2+ without bruit; JVP ≈ 6 cm H₂O above sternal angle; trachea midline." },
              { key: "lymph", label: "Lymph nodes", body: "No cervical, supraclavicular, axillary, epitrochlear, or inguinal lymphadenopathy." },
              { key: "respiratory", label: "Chest / Lungs", body: "Symmetric expansion; no retraction; tactile fremitus normal; percussion resonant throughout; vesicular breath sounds, no crackles, rhonchi, wheezes, or pleural rub." },
              { key: "cardiovascular", label: "Cardiovascular", body: <>PMI palpable at 5th ICS, MCL, non-displaced; no thrill or heave; regular rate and rhythm; S1 and S2 normal; no S3, S4, click, or rub; no murmur on Valsalva, squatting, standing, or sustained handgrip. Peripheral pulses 2+ and symmetric at radial, brachial, femoral, popliteal, dorsalis pedis, and posterior tibial; capillary refill &lt; 2 s; no peripheral edema; no varicosities. POCUS (bedside): preserved LV systolic function, no pericardial effusion, IVC &lt; 2 cm with &gt; 50 % respiratory variation.</> },
              { key: "breasts", label: "Breasts", body: "Deferred — recent normal mammography and clinical exam by primary care." },
              { key: "abdomen", label: "Abdomen", body: "Flat, soft, non-tender; well-healed Pfannenstiel scar; normoactive bowel sounds; no bruit; tympanic to percussion; liver span 9 cm at MCL; no organomegaly, mass, or aortic widening; Murphy / McBurney / Rovsing / psoas / obturator signs absent; no CVA tenderness; no hernia." },
              { key: "gu", label: "Genitourinary / Rectal", body: "Deferred — recent normal gynecologic exam; not clinically indicated today." },
              { key: "msk", label: "Musculoskeletal", body: "Gait fluid and symmetric; spine with preserved lordosis, no scoliosis; mild paraspinal tenderness at L4–L5 without spasm; full ROM of cervical spine, shoulders, elbows, wrists, hands, hips, knees, ankles; no joint erythema, effusion, or crepitus; ligamentous testing of knees stable; straight-leg-raise negative bilaterally." },
              { key: "neuro", label: "Neurological", body: "Alert and oriented × 4, GCS 15; MoCA 29 / 30 (lost 1 point on delayed recall); cranial nerves II–XII intact; motor 5 / 5 in all major muscle groups with normal bulk and tone, no pronator drift, no involuntary movements; sensation intact to light touch, pinprick, vibration, and proprioception; cortical sensation intact; DTRs 2+ and symmetric at biceps, brachioradialis, triceps, patellae, Achilles; plantar responses flexor; no clonus; cerebellar — finger-to-nose, heel-to-shin, rapid alternating movements intact; Romberg negative; tandem gait normal." },
              { key: "psych", label: "Psychiatric", body: "Cooperative; speech normal rate, rhythm, volume; mood \"a little worried,\" affect congruent and reactive; thought process linear; no SI / HI, delusion, or hallucination; insight and judgment intact." },
            ]}
          />



          {/* ---------------- SECTION XII ---------------- */}
          <SectionHeading>Diagnostic Data and Results</SectionHeading>
          <ul className="list-none pl-0 space-y-3">
            <li>
              <strong>Laboratory studies (Feb 2026):</strong> Hemoglobin 142 g/L;
              hematocrit 0.431; WBC 5.63 × 10⁹/L (lymphocytes 43.2 %, neutrophils
              48.5 %); platelets 309 × 10⁹/L. CMP — Na 140, K 4.2, Cl 102, HCO₃ 25,
              BUN 4.6, creatinine 68 µmol/L (eGFR &gt; 90 mL/min/1.73 m²), glucose
              5.1 mmol/L; ALT 22, AST 19, ALP 68, total bilirubin 8 µmol/L; albumin
              42 g/L; calcium 2.34; magnesium 0.92 mmol/L (up from 0.81).
              Coagulation — PT 12.4 s, INR 1.0, aPTT 30 s. Urinalysis — clear, SG
              1.018, no protein / blood / glucose / leukocytes / nitrites.
              <p className="mt-2">
                <strong>Specialty labs:</strong> Lipid panel — TC 5.99, LDL 4.20,
                HDL 1.03, TG 2.39, VLDL 1.10 mmol/L; atherogenic index 4.82 (ref
                ≤ 3.00). Prior (Jun 2025) — TC 5.09, LDL 3.23, HDL 0.87, TG 2.59,
                AI 4.85. HbA1c 5.59 % (Jun 2025). TSH 2.85 µIU/mL; prolactin 23.42
                ng/mL (ref ≤ 23.30); vitamin B12 648.5 pmol/L; 25-OH vitamin D
                25.5 ng/mL (Jun 2025). hs-CRP 3.1 mg/L; ESR 17 mm/h. Troponin and
                BNP — not indicated.
              </p>
            </li>
            <li>
              <strong>Microbiology:</strong> Not obtained.
            </li>
            <li>
              <strong>Imaging:</strong> None acutely; see special studies below.
            </li>
            <li>
              <strong>Electrodiagnostics:</strong> Single-lead wearable ECGs (Apr
              2024, Sept 2025, May 2026) — sinus rhythm, rate 62–78, PR 156–162
              ms, QRS 90–94 ms, QTc 418–431 ms; no ST–T-segment change. 14-day
              ambulatory rhythm monitor (May 2026) — infrequent premature atrial
              complexes (PAC burden 0.4 %); no sustained SVT, VT, AF, or pause.
            </li>
            <li>
              <strong>Pathology:</strong> N/A.
            </li>
            <li>
              <strong>Special studies:</strong> Transthoracic echocardiogram (Feb
              2026) — normal LV size and systolic function (EF 58 %), LAVI 31
              mL/m², E/e′ 10, TAPSE 23 mm, no significant valvular disease (aortic
              peak gradient 9 mm Hg). Cardiac MRI (May 2026) — normal biventricular
              size and function, no late gadolinium enhancement, no edema or
              infiltration.
            </li>
          </ul>


          {/* ---------------- SECTION XIII ---------------- */}
          <SectionHeading>Assessment</SectionHeading>
          <p>
            <strong>Problem-based assessment.</strong>
          </p>
          <ul className="list-none pl-0 space-y-2">

            <li>
              <em>Mixed dyslipidemia, uncontrolled</em> — LDL 4.20 mmol/L on
              atorvastatin 20 mg; AI 4.82. Differential: primary (familial /
              polygenic) vs. secondary (diet, perimenopausal lipid shift,
              metformin / ACEi minor effects). Strongly supported by family
              history and persistent elevation.
            </li>
            <li>
              <em>Stage 1 hypertension, controlled</em> — current BP 128/82 on
              lisinopril 20 mg.
            </li>
            <li>
              <em>Palpitations, benign atrial ectopy</em> — PAC burden 0.4 %,
              normal structural and MRI workup, normal QTc; SVT, sustained AF,
              and infiltrative cardiomyopathy effectively excluded.
            </li>
            <li>
              <em>Borderline dysglycemia</em> — HbA1c 5.59 %; on metformin for
              cardiometabolic risk.
            </li>
            <li>
              <em>Mild hyperprolactinemia</em> — asymptomatic, likely stress /
              lactotroph variation; pituitary imaging not indicated unless
              progressive.
            </li>
            <li>
              <em>Vitamin D insufficiency</em> — on replacement.
            </li>
            <li>
              <em>Mechanical low back pain</em> — non-radicular, no red flags.
            </li>
          </ul>

          <p>
            <strong>Summary statement.</strong> A 47-year-old previously
            healthy woman with mixed dyslipidemia, stage 1 hypertension, and a
            strong paternal history of premature coronary disease presents with
            twelve months of intermittent palpitations and mild fatigue, found on
            examination to be normotensive in clinic with a benign cardiopulmonary
            exam, and on workup to have persistently elevated LDL (4.20 mmol/L)
            and atherogenic index (4.82) despite moderate-intensity statin therapy,
            normal structural cardiac imaging, and rare premature atrial complexes
            on ambulatory monitoring — most consistent with AHA{" "}
            <strong>cardiovascular-kidney-metabolic (CKM) syndrome stage 2</strong>{" "}
            with high 10-year ASCVD risk and benign atrial ectopy.
          </p>
          <p>
            <strong>Risk stratification.</strong> Pooled Cohort 10-year ASCVD
            risk ≈ 9.8 % (borderline-to-intermediate, reclassified upward by
            family history and persistent LDL elevation). CHA₂DS₂-VASc 1 (sex
            category only). HEART score 2 (low). No indication for anticoagulation;
            primary-prevention aspirin remains on individualized basis.
          </p>

          {/* ---------------- SECTION XIV ---------------- */}
          <SectionHeading>Plan</SectionHeading>
          <PlanFromRecords />


          <p className="pt-4 border-t border-foreground/30 text-xs uppercase tracking-[0.18em] font-extrabold">
            This Case Record was prepared in the NEJM "Case Records of the
            Massachusetts General Hospital" format, aligned with ACP, ACC/AHA, and
            CARE guideline standards, for educational use within the ZRUNVA Health
            Passport.
          </p>
        </article>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-black tracking-tight uppercase mt-6 pb-1 border-b border-foreground/40">
      {children}
    </h3>
  );
}

function DefList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,14rem)_1fr] gap-x-6 gap-y-1">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-extrabold uppercase tracking-[0.06em] text-[12px] pt-1">
            {k}
          </dt>
          <dd className="pt-1">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProblemPlan({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <h4 className="font-extrabold uppercase tracking-[0.08em] text-[13px]">{title}</h4>
      <ul className="mt-1 list-disc pl-6 space-y-1">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Plan section — extracted purely from clinician-issued records that the user
 * has ingested into the Health Passport (prescriptions, discharge summaries,
 * visit notes). No AI-generated recommendations are produced here; we only
 * surface what a doctor has already prescribed/ordered.
 *
 * Source sections used:
 *   - meds      : active prescriptions (drug, dose, schedule)
 *   - timeline  : clinician interventions, procedures, dose changes
 */
function PlanFromRecords() {
  const meds = useIngestedObservations("meds");
  const timeline = useIngestedObservations("timeline");

  const formatObs = (o: {
    metric: string;
    value: string;
    unit?: string;
    date?: string;
    note?: string;
    source: string;
  }) => {
    const head = [o.metric, o.value && `— ${o.value}${o.unit ? ` ${o.unit}` : ""}`]
      .filter(Boolean)
      .join(" ");
    const tail = [o.date, o.note, o.source && `source: ${o.source}`]
      .filter(Boolean)
      .join(" · ");
    return tail ? `${head} (${tail})` : head;
  };

  const hasAny = meds.length > 0 || timeline.length > 0;

  if (!hasAny) {
    return (
      <p className="italic text-foreground/70">
        No clinician-issued plan items have been recorded yet. Import a
        prescription, discharge summary, or visit note from the Connections
        section, and any plan prescribed by a doctor will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {meds.length > 0 && (
        <ProblemPlan title="Prescribed medications" items={meds.map(formatObs)} />
      )}
      {timeline.length > 0 && (
        <ProblemPlan
          title="Interventions, procedures & follow-up ordered by clinician"
          items={timeline.map(formatObs)}
        />
      )}
    </div>
  );
}



// ---------------------------------------------------------------------------
// Subspecialty-aware ROS / PE filtering
// ---------------------------------------------------------------------------
// When the user selects a subspecialty with a `lens`, the Review of Systems
// and Physical Examination blocks render the pertinent systems first and
// collapse the rest into a single "Other systems reviewed — negative
// except as noted" line. This mirrors how subspecialists actually document
// (Bates' Guide; ACP High Value Care; ACC/AHA, ATS/ERS, ASGE consult notes)
// rather than reproducing a head-to-toe template.

function SystemList({
  items,
  subspecialty,
}: {
  items: { key: SystemKey; label: string; body: React.ReactNode }[];
  subspecialty: Subspecialty | null;
}) {
  const primary = subspecialty?.lens?.primarySystems;
  let ordered = items;
  let suppressed: typeof items = [];
  if (primary && primary.length > 0) {
    const pertinent = items.filter((i) => primary.includes(i.key));
    suppressed = items.filter((i) => !primary.includes(i.key));
    // Keep the pertinent items in the order declared by the subspecialty.
    pertinent.sort(
      (a, b) => primary.indexOf(a.key) - primary.indexOf(b.key),
    );
    ordered = pertinent;
  }
  return (
    <ul className="list-none pl-0 space-y-2">
      {ordered.map((i) => (
        <li key={i.key}>
          <strong>{i.label}:</strong> {i.body}
        </li>
      ))}
      {suppressed.length > 0 && (
        <li className="italic opacity-70">
          <strong>Other systems reviewed:</strong> negative or non-pertinent
          to this consult ({suppressed.map((s) => s.label).join(", ")}).
        </li>
      )}
    </ul>
  );
}

