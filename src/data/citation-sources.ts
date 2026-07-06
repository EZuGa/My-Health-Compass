// Allow-list of approved citation sources for AI-generated summaries.
// AI may ONLY cite from this list (by id). Anything outside this list is
// rejected — no hallucinated references, no off-list journals.

export type CitationSource = {
  id: string;
  specialty: string;
  kind: "journal" | "society" | "guideline" | "textbook" | "database";
  name: string;
};

export const CITATION_SOURCES: CitationSource[] = [
  // General / cross-specialty
  { id: "gen-nejm", specialty: "General", kind: "journal", name: "New England Journal of Medicine (NEJM)" },
  { id: "gen-jama", specialty: "General", kind: "journal", name: "JAMA" },
  { id: "gen-annals", specialty: "General", kind: "journal", name: "Annals of Internal Medicine" },
  { id: "gen-lancet", specialty: "General", kind: "journal", name: "The Lancet" },
  { id: "gen-bmj", specialty: "General", kind: "journal", name: "BMJ" },
  { id: "gen-jama-im", specialty: "General", kind: "journal", name: "JAMA Internal Medicine" },
  { id: "gen-uptodate", specialty: "General", kind: "database", name: "UpToDate (Wolters Kluwer)" },
  { id: "gen-dynamed", specialty: "General", kind: "database", name: "DynaMed (EBSCO)" },
  { id: "gen-bmj-bp", specialty: "General", kind: "database", name: "BMJ Best Practice" },
  { id: "gen-cochrane", specialty: "General", kind: "database", name: "Cochrane Library" },
  { id: "gen-pubmed", specialty: "General", kind: "database", name: "PubMed / MEDLINE" },
  { id: "gen-ahrq", specialty: "General", kind: "guideline", name: "AHRQ Evidence Reports" },
  { id: "gen-harrisons", specialty: "General", kind: "textbook", name: "Harrison's Principles of Internal Medicine (21st ed.)" },
  { id: "gen-cecil", specialty: "General", kind: "textbook", name: "Goldman-Cecil Medicine (27th ed.)" },
  { id: "gen-merck", specialty: "General", kind: "textbook", name: "Merck Manual" },
  { id: "gen-cmdt", specialty: "General", kind: "textbook", name: "Current Medical Diagnosis & Treatment (CMDT)" },

  // Internal medicine
  { id: "im-acp", specialty: "Internal Medicine", kind: "society", name: "American College of Physicians (ACP)" },

  // Cardiology
  { id: "card-circ", specialty: "Cardiology", kind: "journal", name: "Circulation" },
  { id: "card-jacc", specialty: "Cardiology", kind: "journal", name: "Journal of the American College of Cardiology (JACC)" },
  { id: "card-ehj", specialty: "Cardiology", kind: "journal", name: "European Heart Journal" },
  { id: "card-acc-aha", specialty: "Cardiology", kind: "guideline", name: "ACC/AHA Joint Clinical Practice Guidelines" },
  { id: "card-braunwald", specialty: "Cardiology", kind: "textbook", name: "Braunwald's Heart Disease (12th ed.)" },

  // Oncology / Hematology
  { id: "onc-ca", specialty: "Oncology", kind: "journal", name: "CA: A Cancer Journal for Clinicians" },
  { id: "onc-jco", specialty: "Oncology", kind: "journal", name: "Journal of Clinical Oncology (JCO)" },
  { id: "onc-blood", specialty: "Hematology", kind: "journal", name: "Blood" },
  { id: "onc-nccn", specialty: "Oncology", kind: "guideline", name: "NCCN Guidelines" },
  { id: "onc-asco", specialty: "Oncology", kind: "society", name: "ASCO" },
  { id: "onc-ash", specialty: "Hematology", kind: "society", name: "American Society of Hematology (ASH)" },
  { id: "onc-devita", specialty: "Oncology", kind: "textbook", name: "DeVita's Cancer: Principles & Practice of Oncology (12th ed.)" },

  // Pulmonary / Critical Care
  { id: "pulm-ajrccm", specialty: "Pulmonary", kind: "journal", name: "American Journal of Respiratory and Critical Care Medicine" },
  { id: "pulm-chest", specialty: "Pulmonary", kind: "journal", name: "CHEST" },
  { id: "pulm-ccm", specialty: "Critical Care", kind: "journal", name: "Critical Care Medicine" },
  { id: "pulm-ats", specialty: "Pulmonary", kind: "society", name: "American Thoracic Society (ATS)" },
  { id: "pulm-sccm", specialty: "Critical Care", kind: "society", name: "Society of Critical Care Medicine (SCCM)" },
  { id: "pulm-murray", specialty: "Pulmonary", kind: "textbook", name: "Murray & Nadel's Textbook of Respiratory Medicine (7th ed.)" },

  // GI / Hepatology
  { id: "gi-gastro", specialty: "Gastroenterology", kind: "journal", name: "Gastroenterology" },
  { id: "gi-ajg", specialty: "Gastroenterology", kind: "journal", name: "American Journal of Gastroenterology" },
  { id: "gi-hepatology", specialty: "Hepatology", kind: "journal", name: "Hepatology" },
  { id: "gi-aga", specialty: "Gastroenterology", kind: "society", name: "American Gastroenterological Association (AGA)" },
  { id: "gi-acg", specialty: "Gastroenterology", kind: "society", name: "American College of Gastroenterology (ACG)" },
  { id: "gi-aasld", specialty: "Hepatology", kind: "society", name: "AASLD" },
  { id: "gi-sleisenger", specialty: "Gastroenterology", kind: "textbook", name: "Sleisenger & Fordtran's GI and Liver Disease (11th ed.)" },

  // Nephrology
  { id: "neph-ki", specialty: "Nephrology", kind: "journal", name: "Kidney International" },
  { id: "neph-jasn", specialty: "Nephrology", kind: "journal", name: "JASN" },
  { id: "neph-cjasn", specialty: "Nephrology", kind: "journal", name: "CJASN" },
  { id: "neph-asn", specialty: "Nephrology", kind: "society", name: "American Society of Nephrology (ASN)" },
  { id: "neph-kdigo", specialty: "Nephrology", kind: "guideline", name: "KDIGO Guidelines" },
  { id: "neph-brenner", specialty: "Nephrology", kind: "textbook", name: "Brenner & Rector's The Kidney (11th ed.)" },

  // Endocrine / Diabetes
  { id: "endo-diacare", specialty: "Endocrinology", kind: "journal", name: "Diabetes Care" },
  { id: "endo-jcem", specialty: "Endocrinology", kind: "journal", name: "Journal of Clinical Endocrinology & Metabolism (JCEM)" },
  { id: "endo-ada", specialty: "Endocrinology", kind: "guideline", name: "ADA Standards of Care" },
  { id: "endo-aace", specialty: "Endocrinology", kind: "society", name: "AACE" },
  { id: "endo-society", specialty: "Endocrinology", kind: "society", name: "Endocrine Society" },
  { id: "endo-williams", specialty: "Endocrinology", kind: "textbook", name: "Williams Textbook of Endocrinology (14th ed.)" },

  // Infectious Disease
  { id: "id-lancet", specialty: "Infectious Disease", kind: "journal", name: "Lancet Infectious Diseases" },
  { id: "id-cid", specialty: "Infectious Disease", kind: "journal", name: "Clinical Infectious Diseases (CID)" },
  { id: "id-idsa", specialty: "Infectious Disease", kind: "society", name: "IDSA Guidelines" },
  { id: "id-cdc", specialty: "Infectious Disease", kind: "guideline", name: "CDC Guidance" },
  { id: "id-mandell", specialty: "Infectious Disease", kind: "textbook", name: "Mandell, Douglas, and Bennett's Principles & Practice of Infectious Diseases (9th ed.)" },
  { id: "id-sanford", specialty: "Infectious Disease", kind: "textbook", name: "Sanford Guide to Antimicrobial Therapy" },

  // Rheumatology
  { id: "rheum-ard", specialty: "Rheumatology", kind: "journal", name: "Annals of the Rheumatic Diseases" },
  { id: "rheum-ar", specialty: "Rheumatology", kind: "journal", name: "Arthritis & Rheumatology" },
  { id: "rheum-acr", specialty: "Rheumatology", kind: "society", name: "American College of Rheumatology (ACR)" },
  { id: "rheum-firestein", specialty: "Rheumatology", kind: "textbook", name: "Firestein & Kelley's Textbook of Rheumatology (11th ed.)" },

  // Neurology
  { id: "neuro-lancet", specialty: "Neurology", kind: "journal", name: "Lancet Neurology" },
  { id: "neuro-jamaneuro", specialty: "Neurology", kind: "journal", name: "JAMA Neurology" },
  { id: "neuro-neurology", specialty: "Neurology", kind: "journal", name: "Neurology (AAN)" },
  { id: "neuro-aan", specialty: "Neurology", kind: "society", name: "American Academy of Neurology (AAN)" },
  { id: "neuro-adams", specialty: "Neurology", kind: "textbook", name: "Adams and Victor's Principles of Neurology (12th ed.)" },

  // Psychiatry
  { id: "psych-ajp", specialty: "Psychiatry", kind: "journal", name: "American Journal of Psychiatry" },
  { id: "psych-jama", specialty: "Psychiatry", kind: "journal", name: "JAMA Psychiatry" },
  { id: "psych-lancet", specialty: "Psychiatry", kind: "journal", name: "Lancet Psychiatry" },
  { id: "psych-apa", specialty: "Psychiatry", kind: "society", name: "American Psychiatric Association (APA)" },
  { id: "psych-dsm5tr", specialty: "Psychiatry", kind: "textbook", name: "DSM-5-TR (2022)" },
  { id: "psych-stahl", specialty: "Psychiatry", kind: "textbook", name: "Stahl's Essential Psychopharmacology (5th ed.)" },

  // Surgery
  { id: "surg-annals", specialty: "Surgery", kind: "journal", name: "Annals of Surgery" },
  { id: "surg-jamasurg", specialty: "Surgery", kind: "journal", name: "JAMA Surgery" },
  { id: "surg-acs", specialty: "Surgery", kind: "society", name: "American College of Surgeons (ACS)" },
  { id: "surg-schwartz", specialty: "Surgery", kind: "textbook", name: "Schwartz's Principles of Surgery (11th ed.)" },
  { id: "surg-sabiston", specialty: "Surgery", kind: "textbook", name: "Sabiston Textbook of Surgery (21st ed.)" },

  // Orthopedics
  { id: "ortho-jbjs", specialty: "Orthopedics", kind: "journal", name: "Journal of Bone and Joint Surgery (JBJS)" },
  { id: "ortho-aaos", specialty: "Orthopedics", kind: "society", name: "AAOS" },
  { id: "ortho-campbell", specialty: "Orthopedics", kind: "textbook", name: "Campbell's Operative Orthopaedics (14th ed.)" },

  // OB/GYN
  { id: "obgyn-green", specialty: "Obstetrics & Gynecology", kind: "journal", name: "Obstetrics & Gynecology (Green Journal)" },
  { id: "obgyn-ajog", specialty: "Obstetrics & Gynecology", kind: "journal", name: "American Journal of Obstetrics and Gynecology (AJOG)" },
  { id: "obgyn-acog", specialty: "Obstetrics & Gynecology", kind: "society", name: "ACOG" },
  { id: "obgyn-williams", specialty: "Obstetrics & Gynecology", kind: "textbook", name: "Williams Obstetrics (26th ed.)" },

  // Pediatrics
  { id: "peds-pediatrics", specialty: "Pediatrics", kind: "journal", name: "Pediatrics (AAP)" },
  { id: "peds-jamapeds", specialty: "Pediatrics", kind: "journal", name: "JAMA Pediatrics" },
  { id: "peds-aap", specialty: "Pediatrics", kind: "society", name: "AAP — Red Book / Bright Futures" },
  { id: "peds-nelson", specialty: "Pediatrics", kind: "textbook", name: "Nelson Textbook of Pediatrics (22nd ed.)" },

  // Emergency Medicine
  { id: "em-annals", specialty: "Emergency Medicine", kind: "journal", name: "Annals of Emergency Medicine" },
  { id: "em-acep", specialty: "Emergency Medicine", kind: "society", name: "ACEP" },
  { id: "em-tintinalli", specialty: "Emergency Medicine", kind: "textbook", name: "Tintinalli's Emergency Medicine (9th ed.)" },
  { id: "em-rosen", specialty: "Emergency Medicine", kind: "textbook", name: "Rosen's Emergency Medicine (10th ed.)" },

  // Radiology
  { id: "rad-radiology", specialty: "Radiology", kind: "journal", name: "Radiology" },
  { id: "rad-ajr", specialty: "Radiology", kind: "journal", name: "American Journal of Roentgenology (AJR)" },
  { id: "rad-acr", specialty: "Radiology", kind: "guideline", name: "ACR Appropriateness Criteria" },

  // Anesthesiology
  { id: "anes-anesth", specialty: "Anesthesiology", kind: "journal", name: "Anesthesiology" },
  { id: "anes-asa", specialty: "Anesthesiology", kind: "society", name: "ASA" },
  { id: "anes-miller", specialty: "Anesthesiology", kind: "textbook", name: "Miller's Anesthesia (9th ed.)" },

  // Dermatology
  { id: "derm-jaad", specialty: "Dermatology", kind: "journal", name: "Journal of the American Academy of Dermatology (JAAD)" },
  { id: "derm-jamaderm", specialty: "Dermatology", kind: "journal", name: "JAMA Dermatology" },
  { id: "derm-aad", specialty: "Dermatology", kind: "society", name: "AAD" },
  { id: "derm-fitzpatrick", specialty: "Dermatology", kind: "textbook", name: "Fitzpatrick's Dermatology (9th ed.)" },

  // Ophthalmology
  { id: "oph-ophth", specialty: "Ophthalmology", kind: "journal", name: "Ophthalmology (AAO)" },
  { id: "oph-aao", specialty: "Ophthalmology", kind: "guideline", name: "AAO Preferred Practice Patterns" },

  // ENT
  { id: "ent-otohns", specialty: "Otolaryngology", kind: "journal", name: "Otolaryngology–Head and Neck Surgery" },
  { id: "ent-aao", specialty: "Otolaryngology", kind: "society", name: "AAO-HNS" },
  { id: "ent-cummings", specialty: "Otolaryngology", kind: "textbook", name: "Cummings Otolaryngology (7th ed.)" },

  // Urology
  { id: "uro-jurol", specialty: "Urology", kind: "journal", name: "Journal of Urology" },
  { id: "uro-eur", specialty: "Urology", kind: "journal", name: "European Urology" },
  { id: "uro-aua", specialty: "Urology", kind: "society", name: "American Urological Association (AUA)" },
  { id: "uro-campbell", specialty: "Urology", kind: "textbook", name: "Campbell-Walsh-Wein Urology (12th ed.)" },

  // Family Medicine
  { id: "fam-annals", specialty: "Family Medicine", kind: "journal", name: "Annals of Family Medicine" },
  { id: "fam-aafp", specialty: "Family Medicine", kind: "society", name: "AAFP" },
  { id: "fam-uspstf", specialty: "Preventive", kind: "guideline", name: "USPSTF Recommendations" },

  // PM&R
  { id: "pmr-arch", specialty: "PM&R", kind: "journal", name: "Archives of Physical Medicine and Rehabilitation" },
  { id: "pmr-braddom", specialty: "PM&R", kind: "textbook", name: "Braddom's Physical Medicine and Rehabilitation (6th ed.)" },

  // Pathology
  { id: "path-ajsp", specialty: "Pathology", kind: "journal", name: "American Journal of Surgical Pathology" },
  { id: "path-robbins", specialty: "Pathology", kind: "textbook", name: "Robbins & Cotran Pathologic Basis of Disease (10th ed.)" },

  // Preventive
  { id: "prev-cdc-acip", specialty: "Preventive", kind: "guideline", name: "CDC / ACIP Immunization Schedules" },
  { id: "prev-mmwr", specialty: "Preventive", kind: "journal", name: "MMWR (CDC)" },

  // Geriatrics
  { id: "geri-jags", specialty: "Geriatrics", kind: "journal", name: "JAGS" },
  { id: "geri-beers", specialty: "Geriatrics", kind: "guideline", name: "AGS Beers Criteria" },

  // Allergy & Immunology
  { id: "all-jaci", specialty: "Allergy & Immunology", kind: "journal", name: "Journal of Allergy and Clinical Immunology (JACI)" },
  { id: "all-aaaai", specialty: "Allergy & Immunology", kind: "society", name: "AAAAI" },

  // Plastic Surgery
  { id: "plas-prs", specialty: "Plastic Surgery", kind: "journal", name: "Plastic and Reconstructive Surgery (PRS)" },
  { id: "plas-asps", specialty: "Plastic Surgery", kind: "society", name: "ASPS" },

  // Cardiothoracic
  { id: "cts-jtcvs", specialty: "Cardiothoracic Surgery", kind: "journal", name: "JTCVS" },
  { id: "cts-sts", specialty: "Cardiothoracic Surgery", kind: "society", name: "STS" },

  // Vascular
  { id: "vasc-jvs", specialty: "Vascular Surgery", kind: "journal", name: "Journal of Vascular Surgery" },
  { id: "vasc-svs", specialty: "Vascular Surgery", kind: "society", name: "Society for Vascular Surgery (SVS)" },
  { id: "vasc-rutherford", specialty: "Vascular Surgery", kind: "textbook", name: "Rutherford's Vascular Surgery (10th ed.)" },

  // Neurosurgery
  { id: "nsg-jns", specialty: "Neurosurgery", kind: "journal", name: "Journal of Neurosurgery" },
  { id: "nsg-greenberg", specialty: "Neurosurgery", kind: "textbook", name: "Greenberg's Handbook of Neurosurgery (10th ed.)" },

  // Colorectal
  { id: "crs-dcr", specialty: "Colorectal Surgery", kind: "journal", name: "Diseases of the Colon & Rectum" },
  { id: "crs-ascrs", specialty: "Colorectal Surgery", kind: "society", name: "ASCRS" },

  // Palliative
  { id: "pall-jpm", specialty: "Palliative", kind: "journal", name: "Journal of Palliative Medicine" },
  { id: "pall-aahpm", specialty: "Palliative", kind: "society", name: "AAHPM" },

  // Nuclear / IR
  { id: "nuc-jnm", specialty: "Nuclear Medicine", kind: "journal", name: "Journal of Nuclear Medicine" },
  { id: "ir-jvir", specialty: "Interventional Radiology", kind: "journal", name: "JVIR" },
  { id: "ir-sir", specialty: "Interventional Radiology", kind: "society", name: "Society of Interventional Radiology (SIR)" },

  // Genetics
  { id: "gen2-gim", specialty: "Medical Genetics", kind: "journal", name: "Genetics in Medicine" },
  { id: "gen2-acmg", specialty: "Medical Genetics", kind: "society", name: "ACMG" },
  { id: "gen2-genereviews", specialty: "Medical Genetics", kind: "database", name: "GeneReviews" },
];

export const CITATION_INDEX: Record<string, CitationSource> = Object.fromEntries(
  CITATION_SOURCES.map((s) => [s.id, s]),
);
