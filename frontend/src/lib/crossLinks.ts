// Rule-based cross-section reasoning.
// Pure mapping from saved toxin keywords -> *informational* discussion items.
// Never diagnostic; never prescriptive. Wording is always
// "consider discussing with your clinician".

import { loadToxins, type SavedToxin } from "@/components/ToxinsBox";

export type DiscussionItem = {
  id: string;
  topic: string;            // e.g. "Earlier breast-cancer screening discussion"
  rationale: string;        // why this surfaced — informational
  trigger: string;          // substance name that triggered it
  source: string;           // product / where it was found
  basis: string;            // citation summary (NIH/IARC/USPSTF/etc.)
  createdAt: string;
};

type Rule = {
  match: RegExp;
  topic: string;
  rationale: string;
  basis: string;
};

const RULES: Rule[] = [
  {
    match: /bpa|bisphenol|phthalate|paraben|pfas|pfoa|pfos|forever chemical/i,
    topic: "Endocrine-disrupting chemical exposure — discuss surveillance",
    rationale:
      "This substance is classified as an endocrine-disrupting chemical. Patients with a family history of hormone-sensitive cancers (breast, ovarian, prostate) often discuss tailored screening timing with their clinician.",
    basis: "NIEHS — Endocrine Disruptors fact sheet; Endocrine Society Scientific Statement (2015, updated 2024).",
  },
  {
    match: /pfas|pfoa|pfos/i,
    topic: "Consider discussing lipid panel and thyroid function",
    rationale:
      "PFAS exposure has been associated in epidemiologic studies with elevated cholesterol and altered thyroid measures. A routine lipid panel and TSH may already be due.",
    basis: "ATSDR Toxicological Profile for Perfluoroalkyls (2021); NASEM PFAS clinical guidance (2022).",
  },
  {
    match: /formaldehyde|benzene|1,4-dioxane/i,
    topic: "Discuss CBC at next routine visit",
    rationale:
      "Formaldehyde and benzene are IARC Group 1 hematologic carcinogens. Patients with chronic exposure sometimes discuss a baseline CBC with their clinician.",
    basis: "IARC Monographs Vol. 100F (2012); NIOSH Hazard Reviews.",
  },
  {
    match: /glyphosate|atrazine|chlorpyrifos|organophosphate/i,
    topic: "Discuss agricultural-pesticide exposure history",
    rationale:
      "Chronic pesticide exposure is studied in the AGRICOH consortium and is commonly part of an occupational/environmental history.",
    basis: "IARC Monograph 112 (glyphosate, 2015); EPA pesticide registration reviews.",
  },
  {
    match: /lead|cadmium|mercury|arsenic/i,
    topic: "Discuss heavy-metal screening",
    rationale:
      "Heavy-metal exposure may warrant a discussion of blood lead, urine cadmium/arsenic, or whole-blood mercury — depending on source.",
    basis: "CDC ATSDR Case Studies in Environmental Medicine; AAP Bright Futures (pediatric lead).",
  },
  {
    match: /aspartame|saccharin/i,
    topic: "Information item — non-nutritive sweetener intake",
    rationale:
      "WHO 2023 reclassified aspartame as IARC Group 2B (possibly carcinogenic) while affirming the existing acceptable daily intake. Patients sometimes review beverage intake patterns.",
    basis: "IARC Monograph Vol. 134 (2024); WHO/JECFA July 2023 statement.",
  },
  {
    match: /caramel color iv|4-mei|4-methylimidazole/i,
    topic: "Information item — colored sodas",
    rationale:
      "Caramel color IV contains 4-methylimidazole, a California Prop 65 listed substance. Some patients track intake of darkly colored sodas.",
    basis: "California OEHHA Prop 65; FDA caramel-color guidance.",
  },
  {
    match: /flame retardant|pbde|pbb|tcep|tdcpp/i,
    topic: "Discuss thyroid function screening",
    rationale:
      "Brominated flame retardants are studied for thyroid hormone interference. A TSH is part of many routine panels.",
    basis: "NTP Brominated Flame Retardants RoC profile; NIEHS BFR fact sheet.",
  },
  {
    match: /triclosan|triclocarban/i,
    topic: "Information item — antimicrobial soaps and toothpaste",
    rationale:
      "Triclosan was banned by FDA from over-the-counter consumer soap in 2016 but remains in some products. Patients sometimes review personal-care product use.",
    basis: "FDA Final Rule 81 FR 61106 (2016).",
  },
];

const STORAGE_KEY = "discussion:items";

export function loadDiscussionItems(): DiscussionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiscussionItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: DiscussionItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("discussion:updated"));
}

export function regenerateFromToxins(toxins: SavedToxin[] = loadToxins()): DiscussionItem[] {
  const now = new Date().toISOString();
  const items: DiscussionItem[] = [];
  const seen = new Set<string>();
  for (const t of toxins) {
    const haystack = `${t.name} ${t.notes}`;
    for (const r of RULES) {
      if (r.match.test(haystack)) {
        const key = `${r.topic}::${t.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          topic: r.topic,
          rationale: r.rationale,
          trigger: t.name,
          source: t.source,
          basis: r.basis,
          createdAt: now,
        });
      }
    }
  }
  persist(items);
  return items;
}

export function clearDiscussionItems() {
  persist([]);
}
