// Mock health data for the Health Passport prototype.
// Demo patient: Mrs. Z (DOB 1978-06-14, F) — real lab values seeded
// from uploaded laboratory reports (2025-06-12 and 2026-02-28).

export type MetricPoint = { date: string; value: number };
export type Metric = {
  id: string;
  name: string;
  unit: string;
  reference?: string;
  range?: [number, number]; // shaded normal range on chart
  series: MetricPoint[];
};

export type Intervention = {
  date: string;
  label: string;
  kind: "medication" | "dose-change" | "procedure" | "lifestyle";
};

export type HealthBox = {
  id: string;
  title: string;
  subtitle: string;
  metrics: Metric[];
};

// Personal record number: a 10-digit number, randomly generated once per
// unique user and persisted in localStorage. Stays stable for that user
// for the lifetime of the app installation.
const PID_STORAGE_KEY = "zrunva.pid.v1";
const PID_FALLBACK = "0000000000";

const generatePid = () => {
  let out = "";
  // First digit 1-9 so we always get a true 10-digit number.
  out += String(1 + Math.floor(Math.random() * 9));
  for (let i = 0; i < 9; i++) out += String(Math.floor(Math.random() * 10));
  return out;
};

const getOrCreatePid = () => {
  if (typeof window === "undefined") return PID_FALLBACK;
  try {
    const existing = window.localStorage.getItem(PID_STORAGE_KEY);
    if (existing && /^\d{10}$/.test(existing)) return existing;
    const fresh = generatePid();
    window.localStorage.setItem(PID_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generatePid();
  }
};

const PATIENT_DOB = "1978-06-14";

export const patient = {
  // De-identified: personal record number is used everywhere instead of a name.
  get name() {
    return getOrCreatePid();
  },
  dob: PATIENT_DOB,
  age: 47,
  sex: "Female",
  get pid() {
    return getOrCreatePid();
  },
};



const weeklyDates = (n: number) => {
  const out: string[] = [];
  const today = new Date("2026-06-15");
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

// Deterministic pseudo-noise (no Math.random — avoids SSR hydration mismatch)
const series = (n: number, base: number, jitter: number, trend = 0): MetricPoint[] => {
  const ds = weeklyDates(n);
  return ds.map((date, i) => ({
    date,
    value: +(base + trend * i + (Math.sin(i * 1.3) + Math.cos(i * 2.7) * 0.5) * jitter).toFixed(2),
  }));
};

// Pin specific dated values into an existing series (real lab results).
const withReal = (s: MetricPoint[], pins: MetricPoint[]) => {
  const map = new Map(s.map((p) => [p.date, p.value]));
  for (const p of pins) map.set(p.date, p.value);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
};

export const interventions: Intervention[] = [
  { date: "2025-09-01", label: "Started aspirin 81 mg", kind: "medication" },
  { date: "2025-11-04", label: "Started metformin 500 mg BID", kind: "medication" },
  { date: "2026-01-12", label: "Started lisinopril 10 mg", kind: "medication" },
  { date: "2026-02-20", label: "Lisinopril ↑ 20 mg", kind: "dose-change" },
  { date: "2026-03-15", label: "Started atorvastatin 20 mg", kind: "medication" },
  { date: "2026-04-02", label: "Mediterranean diet initiated", kind: "lifestyle" },
  { date: "2026-05-10", label: "Cardiac MRI", kind: "procedure" },
];

export const boxes: HealthBox[] = [
  {
    id: "heart",
    title: "Heart & Circulation",
    subtitle: "Cardiovascular system, the largest driver of mortality",
    metrics: [
      { id: "sbp", name: "Systolic BP", unit: "mmHg", reference: "<120", range: [90, 120], series: series(20, 138, 6, -0.6) },
      { id: "dbp", name: "Diastolic BP", unit: "mmHg", reference: "<80", range: [60, 80], series: series(20, 88, 4, -0.3) },
      { id: "hr", name: "Resting heart rate", unit: "bpm", reference: "60–80", range: [60, 80], series: series(20, 74, 3) },
      { id: "hrv", name: "Heart rate variability", unit: "ms", reference: ">50", range: [50, 100], series: series(20, 42, 5, 0.4) },
      {
        id: "ldl", name: "LDL cholesterol", unit: "mmol/L", reference: "≤3.34", range: [0, 3.34],
        series: withReal(series(10, 4.1, 0.2, -0.05), [
          { date: "2025-06-12", value: 3.23 },
          { date: "2026-02-28", value: 4.20 },
        ]),
      },
      {
        id: "hdl", name: "HDL cholesterol", unit: "mmol/L", reference: ">1.15", range: [1.15, 2.5],
        series: withReal(series(10, 0.95, 0.05, 0.005), [
          { date: "2025-06-12", value: 0.87 },
          { date: "2026-02-28", value: 1.03 },
        ]),
      },
      {
        id: "trig", name: "Triglycerides", unit: "mmol/L", reference: "<2.30", range: [0, 2.3],
        series: withReal(series(10, 2.5, 0.15, -0.01), [
          { date: "2025-06-12", value: 2.59 },
          { date: "2026-02-28", value: 2.39 },
        ]),
      },
      {
        id: "chol", name: "Total cholesterol", unit: "mmol/L", reference: "<5.20", range: [0, 5.2],
        series: withReal(series(10, 5.5, 0.2, 0.02), [
          { date: "2025-06-12", value: 5.09 },
          { date: "2026-02-28", value: 5.99 },
        ]),
      },
    ],
  },
  {
    id: "metabolic",
    title: "Metabolic & Kidney Health",
    subtitle: "CKM syndrome: metabolism, kidneys, and the heart",
    metrics: [
      {
        id: "a1c", name: "HbA1c", unit: "%", reference: "4.80–5.90", range: [4.8, 5.9],
        series: withReal(series(8, 5.7, 0.1, 0.01), [{ date: "2025-06-12", value: 5.59 }]),
      },
      { id: "glu", name: "Fasting glucose", unit: "mg/dL", reference: "70–99", range: [70, 99], series: series(10, 96, 5, -0.4) },
      { id: "bmi", name: "BMI", unit: "kg/m²", reference: "18.5–24.9", range: [18.5, 24.9], series: series(20, 26.4, 0.3, -0.05) },
      { id: "waist", name: "Waist circumference", unit: "cm", reference: "<88", range: [60, 88], series: series(10, 92, 1, -0.3) },
      {
        id: "na", name: "Sodium", unit: "mmol/L", reference: "135–145", range: [135, 145],
        series: withReal(series(6, 139, 1.2), [{ date: "2025-06-12", value: 139.6 }]),
      },
      {
        id: "k", name: "Potassium", unit: "mmol/L", reference: "3.5–5.1", range: [3.5, 5.1],
        series: withReal(series(6, 4.1, 0.2), [{ date: "2025-06-12", value: 4.05 }]),
      },
      {
        id: "mg", name: "Magnesium", unit: "mmol/L", reference: "0.66–1.07", range: [0.66, 1.07],
        series: withReal(series(6, 0.85, 0.05), [
          { date: "2025-06-12", value: 0.81 },
          { date: "2026-02-28", value: 0.92 },
        ]),
      },
      { id: "egfr", name: "eGFR", unit: "mL/min/1.73m²", reference: ">60", range: [60, 120], series: series(8, 82, 3) },
    ],
  },
  {
    id: "fitness",
    title: "Fitness & Physical Function",
    subtitle: "Cardiorespiratory fitness, the strongest modifiable predictor",
    metrics: [
      { id: "vo2", name: "VO₂max (estimated)", unit: "mL/kg/min", reference: ">30", range: [30, 50], series: series(12, 28, 1, 0.3) },
      { id: "steps", name: "Daily steps", unit: "steps", reference: ">8,000", range: [8000, 15000], series: series(20, 6800, 900, 80) },
      { id: "grip", name: "Grip strength", unit: "kg", reference: ">22", range: [22, 40], series: series(8, 26, 1.2, 0.1) },
    ],
  },
  {
    id: "sleep",
    title: "Sleep & Recovery",
    subtitle: "Restorative physiology — the 8th of Life's Essential 8",
    metrics: [
      { id: "dur", name: "Sleep duration", unit: "hours", reference: "7–9", range: [7, 9], series: series(20, 6.4, 0.7, 0.03) },
      { id: "eff", name: "Sleep efficiency", unit: "%", reference: ">85", range: [85, 100], series: series(20, 82, 4, 0.1) },
      { id: "deep", name: "Deep sleep", unit: "min", reference: ">60", range: [60, 120], series: series(20, 55, 8, 0.3) },
      { id: "spo2", name: "Overnight SpO₂", unit: "%", reference: ">94", range: [94, 100], series: series(20, 95, 1) },
      { id: "rr", name: "Nocturnal RR", unit: "/min", reference: "12–18", range: [12, 18], series: series(20, 15, 1) },
    ],
  },
  {
    id: "mind",
    title: "Mind & Well-being",
    subtitle: "Psychological health as cardiovascular context",
    metrics: [
      { id: "phq", name: "PHQ-9 score", unit: "pts", reference: "<5", range: [0, 5], series: series(8, 9, 2, -0.4) },
      { id: "k6", name: "K-6 distress", unit: "pts", reference: "<5", range: [0, 5], series: series(8, 7, 1.5, -0.3) },
      { id: "wb", name: "Life satisfaction", unit: "0–10", reference: "≥7", range: [7, 10], series: series(8, 6.2, 0.6, 0.1) },
      { id: "moca", name: "MoCA", unit: "/30", reference: "≥26", range: [26, 30], series: series(4, 27, 0.5) },
    ],
  },
  {
    id: "exposures",
    title: "Exposures & Prevention",
    subtitle: "The story behind the numbers",
    metrics: [
      { id: "diet", name: "Mediterranean diet score", unit: "0–14", reference: "≥9", range: [9, 14], series: series(12, 7, 1, 0.2) },
      { id: "alc", name: "Alcohol intake", unit: "drinks/wk", reference: "≤7", range: [0, 7], series: series(12, 9, 2, -0.3) },
      { id: "tob", name: "Tobacco (cig/day)", unit: "/day", reference: "0", range: [0, 0], series: series(12, 0, 0) },
      { id: "adh", name: "Medication adherence", unit: "%", reference: ">90", range: [90, 100], series: series(12, 88, 3, 0.5) },
      {
        id: "vitd", name: "Vitamin D-25 OH", unit: "ng/mL", reference: "30–60", range: [30, 60],
        series: withReal(series(6, 26, 2, 0.3), [{ date: "2025-06-12", value: 25.5 }]),
      },
    ],
  },
];

export const medications = [
  { name: "Lisinopril 20 mg", times: ["08:00"], since: "2026-01-12" },
  { name: "Atorvastatin 20 mg", times: ["21:00"], since: "2026-03-15" },
  { name: "Metformin 500 mg", times: ["08:00", "20:00"], since: "2025-11-04" },
  { name: "Aspirin 81 mg", times: ["08:00"], since: "2025-09-01" },
  { name: "Vitamin D 2000 IU", times: ["08:00"], since: "2025-07-01" },
];

export const appointments = [
  { date: "2026-06-18", time: "10:30", title: "Cardiology follow-up — Dr. Patel" },
  { date: "2026-06-22", time: "14:00", title: "Lab draw: lipid panel + hs-CRP" },
  { date: "2026-07-02", time: "09:00", title: "Primary care annual visit" },
];

export const reminders = [
  { date: "2026-06-16", title: "Refill atorvastatin" },
  { date: "2026-06-17", title: "Log overnight sleep" },
  { date: "2026-06-20", title: "Submit home BP log" },
];

export const nejmSections = [
  { id: "patient-id", title: "1. Patient Identification" },
  { id: "chief-complaint", title: "2. Chief Complaint" },
  { id: "hpi", title: "3. History of Present Illness" },
  { id: "pmh", title: "4. Past Medical History" },
  { id: "psh", title: "5. Past Surgical History" },
  { id: "meds", title: "6. Medications" },
  { id: "allergies", title: "7. Allergies & Adverse Reactions" },
  { id: "fhx", title: "8. Family History" },
  { id: "shx", title: "9. Social History" },
  { id: "imm", title: "10. Immunizations & Screening" },
  { id: "ros", title: "11. Review of Systems" },
  { id: "pe", title: "12. Physical Examination" },
  { id: "dx", title: "13. Diagnostic Data" },
  { id: "nutrition", title: "14. Nutrition" },
  { id: "timeline", title: "15. Clinical Timeline" },
];

// Sections reachable via in-page buttons (not listed in the sidebar).
export const auxiliarySections = [
  { id: "interactions", title: "Medication Interactions" },
];

// ---------------------------------------------------------------------------
// Diagnostic catalog — every lab and imaging variable as a trendable metric.
// Each entry is clickable on the Diagnostic Data page and renders as a chart
// with intervention overlays (medication starts, dose changes, procedures).
// ---------------------------------------------------------------------------

export type DiagnosticCategory =
  | "Hematology"
  | "Lipid panel"
  | "Glycemic"
  | "Electrolytes & renal"
  | "Liver & metabolic"
  | "Endocrine"
  | "Inflammation"
  | "Coagulation"
  | "Vitamins"
  | "Cardiac imaging"
  | "Echocardiography"
  | "Electrocardiography";

export type DiagnosticMetric = Metric & { category: DiagnosticCategory; modality: "lab" | "imaging" | "ecg" };

export const diagnostics: DiagnosticMetric[] = [
  // ---------- Hematology ----------
  { category: "Hematology", modality: "lab", id: "hgb", name: "Hemoglobin", unit: "g/L", reference: "120–160", range: [120, 160],
    series: withReal(series(8, 132, 3, 0.4), [{ date: "2025-06-12", value: 129 }, { date: "2026-02-28", value: 142 }]) },
  { category: "Hematology", modality: "lab", id: "hct", name: "Hematocrit", unit: "L/L", reference: "0.36–0.46", range: [0.36, 0.46],
    series: withReal(series(8, 0.39, 0.01, 0.002), [{ date: "2025-06-12", value: 0.374 }, { date: "2026-02-28", value: 0.431 }]) },
  { category: "Hematology", modality: "lab", id: "rbc", name: "Red blood cells", unit: "10¹²/L", reference: "4.0–5.2", range: [4.0, 5.2],
    series: withReal(series(8, 4.4, 0.1, 0.02), [{ date: "2025-06-12", value: 4.24 }, { date: "2026-02-28", value: 4.81 }]) },
  { category: "Hematology", modality: "lab", id: "wbc", name: "White blood cells", unit: "10⁹/L", reference: "4.0–10.0", range: [4, 10],
    series: withReal(series(8, 6.0, 0.5), [{ date: "2025-06-12", value: 6.10 }, { date: "2026-02-28", value: 5.63 }]) },
  { category: "Hematology", modality: "lab", id: "plt", name: "Platelets", unit: "10⁹/L", reference: "150–400", range: [150, 400],
    series: withReal(series(8, 285, 15), [{ date: "2025-06-12", value: 268 }, { date: "2026-02-28", value: 309 }]) },
  { category: "Hematology", modality: "lab", id: "lymph", name: "Lymphocytes", unit: "%", reference: "20–40", range: [20, 40],
    series: withReal(series(8, 38, 2, 0.2), [{ date: "2026-02-28", value: 43.2 }]) },
  { category: "Hematology", modality: "lab", id: "neu", name: "Neutrophils", unit: "%", reference: "50–70", range: [50, 70],
    series: withReal(series(8, 53, 2, -0.2), [{ date: "2026-02-28", value: 48.5 }]) },

  // ---------- Lipid panel ----------
  { category: "Lipid panel", modality: "lab", id: "dx-chol", name: "Total cholesterol", unit: "mmol/L", reference: "<5.20", range: [0, 5.2],
    series: withReal(series(10, 5.5, 0.2, 0.02), [{ date: "2025-06-12", value: 5.09 }, { date: "2026-02-28", value: 5.99 }]) },
  { category: "Lipid panel", modality: "lab", id: "dx-ldl", name: "LDL cholesterol", unit: "mmol/L", reference: "≤3.34", range: [0, 3.34],
    series: withReal(series(10, 4.1, 0.2, -0.05), [{ date: "2025-06-12", value: 3.23 }, { date: "2026-02-28", value: 4.20 }]) },
  { category: "Lipid panel", modality: "lab", id: "dx-hdl", name: "HDL cholesterol", unit: "mmol/L", reference: ">1.15", range: [1.15, 2.5],
    series: withReal(series(10, 0.95, 0.05, 0.005), [{ date: "2025-06-12", value: 0.87 }, { date: "2026-02-28", value: 1.03 }]) },
  { category: "Lipid panel", modality: "lab", id: "dx-tg", name: "Triglycerides", unit: "mmol/L", reference: "<2.30", range: [0, 2.3],
    series: withReal(series(10, 2.5, 0.15, -0.01), [{ date: "2025-06-12", value: 2.59 }, { date: "2026-02-28", value: 2.39 }]) },
  { category: "Lipid panel", modality: "lab", id: "vldl", name: "VLDL", unit: "mmol/L", reference: "<1.04", range: [0, 1.04],
    series: withReal(series(8, 1.05, 0.08), [{ date: "2026-02-28", value: 1.10 }]) },
  { category: "Lipid panel", modality: "lab", id: "atherog", name: "Atherogenic index", unit: "ratio", reference: "≤3.00", range: [0, 3.0],
    series: withReal(series(8, 4.7, 0.2), [{ date: "2025-06-12", value: 4.85 }, { date: "2026-02-28", value: 4.82 }]) },

  // ---------- Glycemic ----------
  { category: "Glycemic", modality: "lab", id: "dx-a1c", name: "HbA1c", unit: "%", reference: "4.80–5.90", range: [4.8, 5.9],
    series: withReal(series(8, 5.7, 0.1, 0.01), [{ date: "2025-06-12", value: 5.59 }]) },
  { category: "Glycemic", modality: "lab", id: "dx-glu", name: "Fasting glucose", unit: "mg/dL", reference: "70–99", range: [70, 99],
    series: series(10, 96, 5, -0.4) },

  // ---------- Electrolytes & renal ----------
  { category: "Electrolytes & renal", modality: "lab", id: "dx-na", name: "Sodium", unit: "mmol/L", reference: "135–145", range: [135, 145],
    series: withReal(series(6, 139, 1.2), [{ date: "2025-06-12", value: 139.6 }]) },
  { category: "Electrolytes & renal", modality: "lab", id: "dx-k", name: "Potassium", unit: "mmol/L", reference: "3.5–5.1", range: [3.5, 5.1],
    series: withReal(series(6, 4.1, 0.2), [{ date: "2025-06-12", value: 4.05 }]) },
  { category: "Electrolytes & renal", modality: "lab", id: "dx-mg", name: "Magnesium", unit: "mmol/L", reference: "0.66–1.07", range: [0.66, 1.07],
    series: withReal(series(6, 0.85, 0.05), [{ date: "2025-06-12", value: 0.81 }, { date: "2026-02-28", value: 0.92 }]) },
  { category: "Electrolytes & renal", modality: "lab", id: "dx-egfr", name: "eGFR", unit: "mL/min/1.73m²", reference: ">60", range: [60, 120],
    series: series(8, 82, 3) },
  { category: "Electrolytes & renal", modality: "lab", id: "creat", name: "Creatinine", unit: "µmol/L", reference: "53–97", range: [53, 97],
    series: series(8, 72, 3) },

  // ---------- Endocrine ----------
  { category: "Endocrine", modality: "lab", id: "tsh", name: "TSH", unit: "µIU/mL", reference: "0.27–4.20", range: [0.27, 4.2],
    series: withReal(series(6, 2.6, 0.3), [{ date: "2026-02-28", value: 2.85 }]) },
  { category: "Endocrine", modality: "lab", id: "prl", name: "Prolactin", unit: "ng/mL", reference: "≤23.30", range: [0, 23.3],
    series: withReal(series(6, 21, 1.2), [{ date: "2026-02-28", value: 23.42 }]) },
  { category: "Endocrine", modality: "lab", id: "b12", name: "Vitamin B12", unit: "pmol/L", reference: "138–652", range: [138, 652],
    series: withReal(series(6, 600, 30), [{ date: "2026-02-28", value: 648.5 }]) },

  // ---------- Inflammation ----------
  { category: "Inflammation", modality: "lab", id: "esr", name: "ESR", unit: "mm/h", reference: "<20", range: [0, 20],
    series: withReal(series(6, 18, 1.5), [{ date: "2025-06-12", value: 20 }, { date: "2026-02-28", value: 17 }]) },
  { category: "Inflammation", modality: "lab", id: "hscrp", name: "hs-CRP", unit: "mg/L", reference: "<3.0", range: [0, 3.0],
    series: withReal(series(6, 2.8, 0.4), [{ date: "2026-02-28", value: 3.1 }]) },
  { category: "Inflammation", modality: "lab", id: "pct", name: "Procalcitonin", unit: "ng/mL", reference: "<0.05", range: [0, 0.05],
    series: withReal(series(4, 0.03, 0.01), [{ date: "2026-02-28", value: 0.04 }]) },

  // ---------- Coagulation ----------
  { category: "Coagulation", modality: "lab", id: "pt", name: "Prothrombin time", unit: "s", reference: "10–13", range: [10, 13],
    series: withReal(series(6, 12, 0.4), [{ date: "2026-02-28", value: 12.3 }]) },
  { category: "Coagulation", modality: "lab", id: "inr", name: "INR", unit: "ratio", reference: "0.85–1.15", range: [0.85, 1.15],
    series: withReal(series(6, 0.97, 0.03), [{ date: "2026-02-28", value: 0.95 }]) },
  { category: "Coagulation", modality: "lab", id: "aptt", name: "aPTT", unit: "s", reference: "25–35", range: [25, 35],
    series: withReal(series(6, 28, 1), [{ date: "2026-02-28", value: 27.8 }]) },
  { category: "Coagulation", modality: "lab", id: "fbg", name: "Fibrinogen", unit: "g/L", reference: "2.0–4.0", range: [2.0, 4.0],
    series: withReal(series(6, 2.9, 0.2), [{ date: "2026-02-28", value: 2.83 }]) },

  // ---------- Vitamins ----------
  { category: "Vitamins", modality: "lab", id: "dx-vitd", name: "Vitamin D-25 OH", unit: "ng/mL", reference: "30–60", range: [30, 60],
    series: withReal(series(6, 26, 2, 0.6), [{ date: "2025-06-12", value: 25.5 }]) },

  // ---------- Cardiac imaging (MRI) ----------
  { category: "Cardiac imaging", modality: "imaging", id: "lvef-mri", name: "LV ejection fraction (MRI)", unit: "%", reference: "≥55", range: [55, 70],
    series: [{ date: "2024-08-10", value: 58 }, { date: "2025-09-12", value: 56 }, { date: "2026-05-10", value: 59 }] },
  { category: "Cardiac imaging", modality: "imaging", id: "lvmass", name: "LV mass index", unit: "g/m²", reference: "≤95", range: [50, 95],
    series: [{ date: "2024-08-10", value: 92 }, { date: "2025-09-12", value: 96 }, { date: "2026-05-10", value: 93 }] },
  { category: "Cardiac imaging", modality: "imaging", id: "lge", name: "Late gadolinium enhancement burden", unit: "% LV", reference: "0", range: [0, 0],
    series: [{ date: "2024-08-10", value: 0 }, { date: "2025-09-12", value: 0 }, { date: "2026-05-10", value: 0 }] },

  // ---------- Echocardiography ----------
  { category: "Echocardiography", modality: "imaging", id: "lvef-echo", name: "LV ejection fraction (TTE)", unit: "%", reference: "≥55", range: [55, 70],
    series: [{ date: "2024-04-07", value: 57 }, { date: "2025-03-20", value: 55 }, { date: "2026-02-28", value: 58 }] },
  { category: "Echocardiography", modality: "imaging", id: "av-peak", name: "Aortic valve peak gradient", unit: "mmHg", reference: "<20", range: [0, 20],
    series: [{ date: "2024-04-07", value: 8 }, { date: "2025-03-20", value: 10 }, { date: "2026-02-28", value: 9 }] },
  { category: "Echocardiography", modality: "imaging", id: "av-mean", name: "Aortic valve mean gradient", unit: "mmHg", reference: "<10", range: [0, 10],
    series: [{ date: "2024-04-07", value: 4 }, { date: "2025-03-20", value: 5 }, { date: "2026-02-28", value: 4 }] },
  { category: "Echocardiography", modality: "imaging", id: "ee", name: "E/e′ ratio", unit: "ratio", reference: "<14", range: [0, 14],
    series: [{ date: "2024-04-07", value: 9 }, { date: "2025-03-20", value: 11 }, { date: "2026-02-28", value: 10 }] },
  { category: "Echocardiography", modality: "imaging", id: "lavi", name: "LA volume index", unit: "mL/m²", reference: "≤34", range: [16, 34],
    series: [{ date: "2024-04-07", value: 30 }, { date: "2025-03-20", value: 33 }, { date: "2026-02-28", value: 31 }] },
  { category: "Echocardiography", modality: "imaging", id: "tapse", name: "TAPSE", unit: "mm", reference: "≥17", range: [17, 30],
    series: [{ date: "2024-04-07", value: 22 }, { date: "2025-03-20", value: 21 }, { date: "2026-02-28", value: 23 }] },

  // ---------- Electrocardiography ----------
  { category: "Electrocardiography", modality: "ecg", id: "pr", name: "PR interval", unit: "ms", reference: "120–200", range: [120, 200],
    series: [{ date: "2024-04-07", value: 156 }, { date: "2024-04-12", value: 160 }, { date: "2025-09-12", value: 158 }, { date: "2026-05-17", value: 162 }] },
  { category: "Electrocardiography", modality: "ecg", id: "qrs", name: "QRS duration", unit: "ms", reference: "<120", range: [60, 120],
    series: [{ date: "2024-04-07", value: 92 }, { date: "2024-04-12", value: 90 }, { date: "2025-09-12", value: 94 }, { date: "2026-05-17", value: 92 }] },
  { category: "Electrocardiography", modality: "ecg", id: "qtc", name: "QTc (Bazett)", unit: "ms", reference: "<460", range: [350, 460],
    series: [{ date: "2024-04-07", value: 418 }, { date: "2024-04-12", value: 422 }, { date: "2025-09-12", value: 431 }, { date: "2026-05-17", value: 425 }] },
  { category: "Electrocardiography", modality: "ecg", id: "ecg-hr", name: "ECG heart rate", unit: "bpm", reference: "60–100", range: [60, 100],
    series: [{ date: "2024-04-07", value: 72 }, { date: "2024-04-12", value: 78 }, { date: "2025-09-12", value: 74 }, { date: "2026-05-17", value: 70 }] },
];
