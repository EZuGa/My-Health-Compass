import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  transcript: z.string().min(1).max(10000),
});

const PhotoInputSchema = z.object({
  images: z.array(z.string().min(20).max(8_000_000)).min(1).max(8),
  note: z.string().max(2000).optional(),
});

const PATIENT_CONTEXT = `The patient is Mrs. Z, 47-year-old woman with dyslipidemia
(LDL 4.20 mmol/L, TG 2.39, atherogenic index 4.82), metabolic-syndrome surveillance
on metformin 500 mg BID, hypertension on lisinopril 20 mg, and a strong family
history of premature coronary artery disease. She is NOT diabetic but is at high
cardiometabolic risk — flag foods high in refined carbohydrates, added sugars,
saturated fat, trans fat, sodium, and ultra-processed foods.`;

const SYSTEM_PROMPT = `You are a clinical dietitian assistant. Parse the patient's
spoken daily food log into a structured nutrition list. Use the patient's clinical
context to flag alarming items.

${PATIENT_CONTEXT}

Return STRICT JSON with this exact shape (no markdown, no commentary):
{
  "items": [
    {
      "food": "<short name>",
      "amount": "<portion description>",
      "calories": <number kcal estimate>,
      "carbs_g": <number>,
      "sugar_g": <number>,
      "sat_fat_g": <number>,
      "sodium_mg": <number>,
      "category": "<grain|protein|dairy|fruit|vegetable|sweet|beverage|fat|ultra-processed|other>",
      "alarm": "<none|low|moderate|high>",
      "alarm_reason": "<one short clause if alarm != none, else empty>"
    }
  ],
  "totals": {
    "calories": <number>,
    "carbs_g": <number>,
    "sugar_g": <number>,
    "sat_fat_g": <number>,
    "sodium_mg": <number>
  },
  "summary": "<2-3 sentence clinical summary of the day's diet for this patient>",
  "alerts": ["<short bullet>", "..."]
}`;

export type NutritionItem = {
  food: string;
  amount: string;
  calories: number;
  carbs_g: number;
  sugar_g: number;
  sat_fat_g: number;
  sodium_mg: number;
  category: string;
  alarm: "none" | "low" | "moderate" | "high";
  alarm_reason: string;
};

export type NutritionAnalysis = {
  items: NutritionItem[];
  totals: {
    calories: number;
    carbs_g: number;
    sugar_g: number;
    sat_fat_g: number;
    sodium_mg: number;
  };
  summary: string;
  alerts: string[];
};

export const analyzeNutrition = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }): Promise<NutritionAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Patient's spoken food log for today:\n\n${data.transcript}`,
          },
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
      return JSON.parse(content) as NutritionAnalysis;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as NutritionAnalysis;
      throw new Error("AI returned non-JSON content");
    }
  });

export const analyzeNutritionPhotos = createServerFn({ method: "POST" })
  .inputValidator(PhotoInputSchema)
  .handler(async ({ data }): Promise<NutritionAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userContent: any[] = [
      {
        type: "text",
        text:
          `These are photographs of the patient's meals${data.note ? ` (notes: ${data.note})` : ""}.` +
          ` Identify every visible food and beverage in each image, estimate the portion sizes,` +
          ` and return the structured JSON nutrition list as specified.`,
      },
      ...data.images.map((url) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      return JSON.parse(content) as NutritionAnalysis;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as NutritionAnalysis;
      throw new Error("AI returned non-JSON content");
    }
  });
