import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CITATION_SOURCES, CITATION_INDEX } from "@/data/citation-sources";


// Universal extractor: given text, image, PDF, audio, or any combo from any
// connected source (EMR export, wearable CSV, scanned lab, voice note,
// app screenshot), pull out structured health observations and route each
// one to the correct Health Passport box.

const BoxId = z.enum([
  "heart",
  "metabolic",
  "fitness",
  "sleep",
  "mind",
  "exposures",
]);

const SectionId = z.enum([
  "patient-id",
  "chief-complaint",
  "hpi",
  "pmh",
  "psh",
  "meds",
  "allergies",
  "fhx",
  "shx",
  "imm",
  "ros",
  "pe",
  "dx",
  "timeline",
  "nutrition",
]);


const SourceKind = z.enum([
  "voice",
  "scan-image",
  "scan-pdf",
  "emr-export",
  "wearable-export",
  "app-screenshot",
  "manual-text",
  "other",
]);

const ExtractInput = z.object({
  text: z.string().max(50_000).optional(),
  note: z.string().max(2_000).optional(),
  sourceKind: SourceKind.default("other"),
  sourceLabel: z.string().max(200).optional(), // e.g. "Apple Health export"
  files: z
    .array(
      z.object({
        name: z.string().max(300),
        mime: z.string().max(120),
        // data URL (data:<mime>;base64,XXX) OR https URL
        dataUrl: z.string().min(10).max(20_000_000),
      }),
    )
    .max(8)
    .optional(),
});

export type IngestedObservation = {
  box: z.infer<typeof BoxId>;
  section: z.infer<typeof SectionId>;
  metric: string;
  value: string;
  unit?: string;
  date?: string;
  setting: "Inpatient" | "Outpatient";
  source: string;
  confidence: "low" | "medium" | "high";
  note?: string;
};

export type IngestResult = {
  summary: string;
  observations: IngestedObservation[];
  alerts: string[];
  source_kind: string;
};

const SYSTEM = `You are a clinical data extraction engine for a personal Health Passport.
You receive raw inputs from one of many possible sources: a voice note transcript,
a photo of a lab report, a PDF discharge summary, an EMR export (FHIR/CCDA/CSV),
a wearable app screenshot (Apple Health, Fitbit, Oura, Whoop, Dexcom, Garmin, etc.),
a patient portal (MyChart, FollowMyHealth, healow, athenaPatient, My HealtheVet…),
an outside prescription, or free-typed notes.

Your job: parse EVERYTHING measurable into structured observations. Assign EACH
observation to:

A) exactly one of the 6 Health Passport BOXES (drives the Clinical Timeline):
  - heart       : BP, HR, HRV, ECG, lipids, cardiac procedures, arrhythmias
  - metabolic   : glucose/CGM, HbA1c, insulin, weight/BMI, thyroid, kidneys
  - fitness     : steps, VO2max, workouts, activity minutes, strength
  - sleep       : sleep duration, stages, apnea/AHI, bedtime, wake
  - mind        : mood, stress, anxiety/depression scores, cognition, meditation
  - exposures   : medications, supplements, food, alcohol, smoking, environment

B) exactly one of the 15 clinical-record SECTIONS of the Health Passport:
  - patient-id      : 1. Patient Identification (name, DOB, MRN, demographics, ID docs)
  - chief-complaint : 2. Chief Complaint (the single presenting concern in the patient's own words)
  - hpi             : 3. History of Present Illness (current symptoms, complaint timeline)
  - pmh             : 4. Past Medical History (chronic conditions, prior diagnoses)
  - psh             : 5. Past Surgical History (operations, procedures, dates)
  - meds            : 6. Medications (active Rx, OTC, supplements, doses, adherence)
  - allergies       : 7. Allergies & Adverse Reactions (drug/food/env, severity)
  - fhx             : 8. Family History (relatives' conditions)
  - shx             : 9. Social History (smoking, alcohol, occupation, diet, exercise habits, living situation)
  - imm             : 10. Immunizations & Screening (vaccines, mammogram, colonoscopy, etc.)
  - ros             : 11. Review of Systems (system-by-system symptoms)
  - pe              : 12. Physical Examination (vitals, exam findings, BP/HR/Temp/RR/SpO2)
  - dx              : 13. Diagnostic Data (labs, imaging, ECG, biopsies, genomics)
  - timeline        : 14. Clinical Timeline (interventions, hospitalizations, procedures, dose changes)
  - nutrition       : 15. Nutrition (food log, macros, micronutrients, hydration)

Setting: "Inpatient" if it's a hospital EMR / discharge / inpatient procedure,
otherwise "Outpatient".

Return STRICT JSON (no markdown):
{
  "summary": "<2-3 sentence clinical summary>",
  "observations": [
    {
      "box": "<heart|metabolic|fitness|sleep|mind|exposures>",
      "section": "<patient-id|chief-complaint|hpi|pmh|psh|meds|allergies|fhx|shx|imm|ros|pe|dx|timeline|nutrition>",
      "metric": "<short name e.g. 'Systolic BP'>",
      "value": "<string value>",
      "unit": "<unit or empty>",
      "date": "<YYYY-MM-DD or empty>",
      "setting": "<Inpatient|Outpatient>",
      "source": "<short source label>",
      "confidence": "<low|medium|high>",
      "note": "<optional one-clause note>"
    }
  ],
  "alerts": ["<short clinical flags>"]
}`;


export const ingestData = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }): Promise<IngestResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userContent: any[] = [];
    const header =
      `Source kind: ${data.sourceKind}` +
      (data.sourceLabel ? ` (${data.sourceLabel})` : "") +
      (data.note ? `\nUser note: ${data.note}` : "");
    userContent.push({ type: "text", text: header });

    if (data.text && data.text.trim()) {
      userContent.push({
        type: "text",
        text: `Raw text / transcript:\n\n${data.text}`,
      });
    }

    for (const f of data.files ?? []) {
      if (f.mime.startsWith("image/")) {
        userContent.push({
          type: "image_url",
          image_url: { url: f.dataUrl },
        });
      } else if (f.mime === "application/pdf") {
        userContent.push({
          type: "file",
          file: { filename: f.name, file_data: f.dataUrl },
        });
      } else {
        userContent.push({
          type: "text",
          text: `[Attached file ${f.name} of type ${f.mime} — content not directly readable]`,
        });
      }
    }

    if (userContent.length === 1) {
      throw new Error("No content provided to extract from");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${body}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: IngestResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned non-JSON content");
      parsed = JSON.parse(m[0]);
    }
    return { ...parsed, source_kind: data.sourceKind };
  });

// Speech-to-text moved to the backend (`api.transcribeAudio` → POST
// /speech/transcribe), which transcribes with Gemini.

// Polish a raw note (typed or transcribed) into one or two grammatically
// correct, well-punctuated clinical sentences in the patient's voice.
// Keeps the original meaning and any specific symptoms/durations/numbers —
// only fixes grammar, capitalization, punctuation, and run-on phrasing.
const PolishInput = z.object({
  text: z.string().min(1).max(5000),
  context: z.string().max(200).optional(),
});

export const polishComplaint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PolishInput.parse(input))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system =
      `You are a medical scribe. Rewrite the user's raw note into ONE to THREE ` +
      `grammatically correct, clearly punctuated sentences in plain English, ` +
      `keeping the patient's first-person voice and ALL specific facts ` +
      `(symptoms, durations, body sites, numbers, medications, triggers). ` +
      `Do not invent symptoms, dates, severity, or diagnoses. Do not add ` +
      `pleasantries or headings. Return ONLY the rewritten text, no quotes ` +
      `and no preamble.`;

    const userText =
      (data.context ? `Context: ${data.context}\n\n` : "") +
      `Raw note:\n${data.text}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Polish error ${res.status}: ${body}`);
    }
    const j = await res.json();
    const out = (j.choices?.[0]?.message?.content ?? "").trim();
    return { text: out || data.text };
  });

// ---------- Citations (allow-list only) ----------
// Pick 1–3 references from the curated CITATION_SOURCES allow-list that are
// most relevant to a piece of AI-generated clinical text. The model returns
// ids only; anything not in the allow-list is dropped — no hallucinations.

const CiteInput = z.object({
  text: z.string().min(1).max(4000),
  max: z.number().int().min(1).max(3).default(3),
});

export type Citation = {
  id: string;
  name: string;
  specialty: string;
  kind: "journal" | "society" | "guideline" | "textbook" | "database";
};

export const suggestCitations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CiteInput.parse(input))
  .handler(async ({ data }): Promise<{ citations: Citation[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const catalog = CITATION_SOURCES.map(
      (s) => `${s.id} | ${s.specialty} | ${s.kind} | ${s.name}`,
    ).join("\n");

    const system =
      `You suggest peer-reviewed citations for a clinical note. ` +
      `You MUST pick ONLY from the allow-list provided. ` +
      `Return STRICT JSON of the form {"ids":["id1","id2"]} — nothing else. ` +
      `Choose ${data.max} or fewer ids most relevant to the note's specialty and topic. ` +
      `If nothing in the list is relevant, return {"ids":[]}. ` +
      `Never invent ids. Never add commentary.`;

    const user =
      `ALLOW-LIST (id | specialty | kind | name):\n${catalog}\n\n` +
      `CLINICAL NOTE:\n${data.text}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Citation error ${res.status}: ${body}`);
    }
    const j = await res.json();
    const raw = (j.choices?.[0]?.message?.content ?? "").trim();
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.ids)) ids = parsed.ids.filter((x: unknown) => typeof x === "string");
    } catch {
      ids = [];
    }
    const seen = new Set<string>();
    const citations: Citation[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      const s = CITATION_INDEX[id];
      if (!s) continue; // drop hallucinated ids
      seen.add(id);
      citations.push({ id: s.id, name: s.name, specialty: s.specialty, kind: s.kind });
      if (citations.length >= data.max) break;
    }
    return { citations };
  });
