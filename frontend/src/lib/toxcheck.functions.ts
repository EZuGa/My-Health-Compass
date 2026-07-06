import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  images: z.array(z.string().min(20).max(8_000_000)).max(8).optional(),
  text: z.string().max(4000).optional(),
  barcode: z.string().max(64).optional(),
});

const PATIENT_CONTEXT = `Patient: Mrs. Z, 47-year-old woman.
- Dyslipidemia (LDL 4.20 mmol/L, TG 2.39, atherogenic index 4.82)
- Metabolic syndrome surveillance (NOT diabetic)
- Hypertension
- Strong family history of premature coronary artery disease
- Active medications: Lisinopril 20 mg, Atorvastatin 20 mg, Metformin 500 mg BID,
  Aspirin 81 mg, Vitamin D 2000 IU
Special concerns: cardiometabolic risk, CYP3A4 substrates (atorvastatin),
renal function (ACEi + metformin), endocrine disruption (metabolic risk),
sodium load, added sugars, sat/trans fat, ultra-processed foods.`;

const SYSTEM_PROMPT = `You are ToxCheck, a clinical toxicology assistant. Analyze
products (consumer food, cosmetics, household chemicals, packaging) for hazardous
substances using authoritative sources: IARC monographs, US NTP Report on
Carcinogens, US FDA, US EPA IRIS, EFSA OpenFoodTox, ECHA REACH/SVHC, California
Prop 65, Stockholm Convention, WHO/JECFA, Codex Alimentarius.

You receive any combination of: product photos / label photos / hand-drawn
sketches, free-text description, and a barcode. Identify the product(s) and
their likely ingredients. Then flag hazardous substances and personalize for
the patient.

${PATIENT_CONTEXT}

Return STRICT JSON (no markdown):
{
  "products": [
    {
      "name": "<best-guess product name>",
      "category": "<food|beverage|cosmetic|cleaning|packaging|other>",
      "identified_from": "<photo|label|barcode|text>",
      "substances": [
        {
          "name": "<substance>",
          "severity": "<low|moderate|high|critical>",
          "iarc_group": "<1|2A|2B|3|null>",
          "category": "<carcinogen|endocrine_disruptor|heavy_metal|additive|pesticide|contaminant|allergen|other>",
          "health_effects": "<one short clinical sentence>",
          "regulatory_status": "<banned/restricted EU, permitted USA, etc.>",
          "patient_specific_risk": "<one short sentence; mention specific med/comorbidity interaction if relevant, else 'No patient-specific interaction'>"
        }
      ]
    }
  ],
  "patient_alerts": [
    {
      "severity": "<low|moderate|high|critical>",
      "message": "<specific interaction with this patient's meds/comorbidities>"
    }
  ],
  "conclusion": "<2-3 sentence overall verdict tailored to this patient>",
  "references": [
    { "label": "<source name + year>", "citation": "<short citation>", "url": "<URL or empty>" }
  ]
}

Severity rubric:
- critical: IARC Group 1 carcinogen, banned in EU/USA, or direct interaction with
  patient's medications (e.g. CYP3A4 inhibitor with atorvastatin, nephrotoxin
  with ACEi+metformin).
- high: IARC 2A, known endocrine disruptor, heavy metal above tolerable intake.
- moderate: IARC 2B, ultra-processed marker, additive restricted in some jurisdictions.
- low: minor additive with limited evidence of harm.`;

export type ToxSeverity = "low" | "moderate" | "high" | "critical";

export type ToxSubstance = {
  name: string;
  severity: ToxSeverity;
  iarc_group: string | null;
  category: string;
  health_effects: string;
  regulatory_status: string;
  patient_specific_risk: string;
};

export type ToxProduct = {
  name: string;
  category: string;
  identified_from: string;
  substances: ToxSubstance[];
};

export type ToxAnalysis = {
  products: ToxProduct[];
  patient_alerts: { severity: ToxSeverity; message: string }[];
  conclusion: string;
  references: { label: string; citation: string; url: string }[];
};

export const analyzeToxins = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }): Promise<ToxAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    if (!data.images?.length && !data.text && !data.barcode) {
      throw new Error("Provide a photo, text description, or barcode.");
    }

    const promptParts: string[] = [];
    if (data.barcode) promptParts.push(`Barcode (UPC/EAN): ${data.barcode}`);
    if (data.text) promptParts.push(`User description / label transcription / drawing notes:\n${data.text}`);
    if (!promptParts.length && data.images?.length) {
      promptParts.push("Identify every product visible in the attached images (labels, packaging, sketches) and analyze for hazardous substances.");
    }

    const userContent: any[] = [{ type: "text", text: promptParts.join("\n\n") }];
    for (const url of data.images ?? []) {
      userContent.push({ type: "image_url", image_url: { url } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: data.images?.length ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    try {
      return JSON.parse(content) as ToxAnalysis;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as ToxAnalysis;
      throw new Error("AI returned non-JSON content");
    }
  });
