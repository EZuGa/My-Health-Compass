import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(1).max(2000),
  patientContext: z.string().max(40000),
});

export const askSearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const system =
      "You are the in-app search assistant for The Health Passport. " +
      "Answer ONLY from the PATIENT DATA block provided below. " +
      "If the answer is not in the data, reply exactly: \"Not found in this patient's record.\" " +
      "Do not invent values, do not give medical advice, do not diagnose. " +
      "Quote exact numbers, units, and dates from the data when relevant. " +
      "When useful, point to the section of the app where the value lives (e.g. 'Medications', 'Diagnostic Data > LDL', 'Exposures'). " +
      "Be concise — under 160 words.";

    const messages = [
      { role: "system", content: system },
      { role: "system", content: `PATIENT DATA:\n${data.patientContext}` },
      { role: "user", content: data.question },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "raw",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Search is rate-limited. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error(`Search failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { answer: (json.choices?.[0]?.message?.content ?? "").trim() };
  });
