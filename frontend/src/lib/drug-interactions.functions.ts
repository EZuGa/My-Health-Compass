// Live evidence: pulls the "drug_interactions" section from each medication's
// FDA Structured Product Label via OpenFDA (https://open.fda.gov/apis/drug/label/).
// No auth required. Results are cached in-memory per request and bounded in size.

import { createServerFn } from "@tanstack/react-start";

type LiveLabel = {
  drug: string;
  brandName?: string;
  genericName?: string;
  text: string; // first paragraphs of the drug_interactions field
  source: string; // OpenFDA query URL (audit trail)
};

type LiveResult = {
  fetchedAt: string;
  labels: LiveLabel[];
  errors: { drug: string; message: string }[];
};

async function fetchLabel(drug: string): Promise<LiveLabel | null> {
  // Strip dose/route to keep the search term clean ("Atorvastatin 20 mg" -> "atorvastatin")
  const name = drug.toLowerCase().replace(/[0-9].*$/, "").trim().split(/\s+/)[0];
  const url =
    `https://api.fda.gov/drug/label.json?search=` +
    encodeURIComponent(
      `(openfda.generic_name:"${name}"+openfda.brand_name:"${name}")+AND+_exists_:drug_interactions`,
    ) +
    `&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`OpenFDA ${res.status}`);
  const json = (await res.json()) as {
    results?: Array<{
      drug_interactions?: string[];
      openfda?: { generic_name?: string[]; brand_name?: string[] };
    }>;
  };
  const hit = json.results?.[0];
  if (!hit?.drug_interactions?.length) return null;
  // Trim to ~1200 chars to keep payload small but still substantive
  const text = hit.drug_interactions.join("\n\n").slice(0, 1200);
  return {
    drug,
    brandName: hit.openfda?.brand_name?.[0],
    genericName: hit.openfda?.generic_name?.[0],
    text,
    source: url,
  };
}

export const fetchLiveInteractions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = input as { drugs?: unknown };
    if (!Array.isArray(data.drugs)) throw new Error("drugs must be an array");
    const drugs = data.drugs.filter((d): d is string => typeof d === "string").slice(0, 10);
    return { drugs };
  })
  .handler(async ({ data }): Promise<LiveResult> => {
    const labels: LiveLabel[] = [];
    const errors: { drug: string; message: string }[] = [];
    await Promise.all(
      data.drugs.map(async (d) => {
        try {
          const label = await fetchLabel(d);
          if (label) labels.push(label);
          else errors.push({ drug: d, message: "No drug_interactions section in FDA label." });
        } catch (e) {
          errors.push({ drug: d, message: (e as Error).message });
        }
      }),
    );
    return { fetchedAt: new Date().toISOString(), labels, errors };
  });
