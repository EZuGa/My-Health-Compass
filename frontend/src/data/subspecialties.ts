// Medical subspecialties for organizing the medical history view.
// Each entry maps a subspecialty to the systems/topics that should be
// emphasized when the user generates the subspecialty-organized history.
//
// Evidence base for section reorganization:
//   - Bates' Guide to Physical Examination (12th ed.) — focused histories
//   - ACP High Value Care: pertinent positives/negatives only
//   - ACC/AHA, ATS/ERS, ASGE, AAD, AAOS subspecialty guideline statements
//     all recommend system-focused intake rather than head-to-toe documentation
//     once the consult question is defined.

// Canonical Review-of-Systems / Physical-Exam system keys. These must match
// the keys used in the rendered ROS and PE blocks in MedicalHistoryDialog.
export type SystemKey =
  | "constitutional"
  | "skin"
  | "head"
  | "eyes"
  | "ears"
  | "nose"
  | "mouth"
  | "neck"
  | "lymph"
  | "respiratory"
  | "cardiovascular"
  | "gi"
  | "gu"
  | "msk"
  | "neuro"
  | "psych"
  | "endocrine"
  | "heme"
  | "immuno"
  | "vitals"
  | "general"
  | "breasts"
  | "abdomen";

// Optional lens controlling which content is pertinent for the subspecialty.
// When a lens is present, non-pertinent items are suppressed and the
// pertinent systems are surfaced first. When no lens is present we render
// the full default record.
export type SubspecialtyLens = {
  // ROS/PE systems considered directly pertinent to the consult question.
  // These are rendered first; non-listed systems are collapsed into a
  // single "Other systems reviewed — negative except as noted" line.
  primarySystems?: SystemKey[];
  // Show menstrual / obstetric / gravida–para detail in Social History.
  // Default (when a lens is set) is false — most subspecialties do not need it.
  showSexualHistory?: boolean;
  // Show full screening history (Pap, mammo, colonoscopy, DEXA).
  // Default true; set false to suppress for subspecialties where it is noise.
  showScreeningHistory?: boolean;
};

export type Subspecialty = {
  id: string;
  name: string;
  focus: string[];
  lens?: SubspecialtyLens;
};

export const SUBSPECIALTIES: Subspecialty[] = [
  { id: "adolescent-medicine", name: "Adolescent Medicine", focus: ["Growth & puberty", "Mental health & risk behaviors", "Reproductive & sexual health", "Immunizations", "School/social functioning"], lens: { primarySystems: ["constitutional", "psych", "endocrine", "gu"], showSexualHistory: true } },
  { id: "allergy-immunology", name: "Allergy and Immunology", focus: ["Atopic history", "Drug & food allergies", "Asthma/rhinitis", "Anaphylaxis history", "Immunodeficiency screen"], lens: { primarySystems: ["respiratory", "skin", "nose", "immuno"] } },
  { id: "anesthesiology", name: "Anesthesiology", focus: ["Airway exam (Mallampati)", "ASA class & prior anesthesia", "Cardiopulmonary reserve", "Medications & anticoagulation", "Allergies / MH risk"], lens: { primarySystems: ["vitals", "mouth", "neck", "respiratory", "cardiovascular"], showScreeningHistory: false } },
  { id: "cardiovascular-disease", name: "Cardiovascular Disease", focus: ["Cardiac symptoms (CP/SOB/palpitations/syncope)", "ASCVD risk factors", "Family history of premature CAD/SCD", "ECG/echo/stress findings", "Lipids & BP"], lens: { primarySystems: ["vitals", "cardiovascular", "respiratory", "neck"] } },
  { id: "clinical-cardiac-electrophysiology", name: "Clinical Cardiac Electrophysiology", focus: ["Palpitations/syncope timeline", "Arrhythmia documentation", "QT-prolonging meds", "Family hx SCD/channelopathy", "Device/ablation history"], lens: { primarySystems: ["vitals", "cardiovascular", "neuro"] } },
  { id: "critical-care-medicine", name: "Critical Care Medicine", focus: ["Hemodynamics & vasopressor needs", "Ventilator/oxygenation status", "Sepsis & infection sources", "Renal/hepatic function", "Goals of care & code status"], lens: { primarySystems: ["vitals", "cardiovascular", "respiratory", "neuro", "gu"], showScreeningHistory: false } },
  { id: "dermatology", name: "Dermatology", focus: ["Lesion morphology & distribution", "Photo-exposure & skin type", "Personal/family skin cancer hx", "Atopic & autoimmune skin disease", "Topical/systemic dermatologic meds"], lens: { primarySystems: ["skin", "lymph"] } },
  { id: "emergency-medicine", name: "Emergency Medicine", focus: ["Chief complaint & onset", "Red-flag symptoms (ACS/stroke/sepsis)", "Last meal & meds", "Allergies", "Code status & disposition"], lens: { primarySystems: ["vitals", "cardiovascular", "respiratory", "neuro", "abdomen"], showScreeningHistory: false } },
  { id: "endocrinology", name: "Endocrinology, Diabetes, and Metabolism", focus: ["Glycemic control (HbA1c, CGM)", "Thyroid / adrenal / pituitary axes", "Bone & mineral metabolism", "Lipids & weight trajectory", "Endocrine family history"], lens: { primarySystems: ["endocrine", "neck", "vitals", "constitutional"] } },
  { id: "family-medicine", name: "Family Medicine", focus: ["Preventive care & screening", "Chronic disease management", "Immunizations", "Social determinants", "Behavioral health"] },
  { id: "gastroenterology", name: "Gastroenterology", focus: ["GI symptom review (pain/bleeding/bowel habit)", "Hepatic risk factors", "Endoscopic/colonoscopy history", "NSAID/alcohol use", "Family hx IBD/CRC"], lens: { primarySystems: ["gi", "abdomen", "constitutional"] } },
  { id: "geriatric-medicine", name: "Geriatric Medicine", focus: ["Functional status (ADLs/IADLs)", "Cognition & mood", "Falls & gait", "Polypharmacy (Beers)", "Advance care planning"], lens: { primarySystems: ["neuro", "psych", "msk", "cardiovascular", "vitals"] } },
  { id: "hematology-oncology", name: "Hematology and Medical Oncology", focus: ["B-symptoms & performance status", "Bleeding/clotting history", "Transfusion & cancer history", "Family cancer pedigree", "Chemotherapy/radiation exposure"], lens: { primarySystems: ["constitutional", "heme", "lymph", "skin"] } },
  { id: "hospice-palliative", name: "Hospice and Palliative Medicine", focus: ["Symptom burden (pain/dyspnea/nausea)", "Goals of care & code status", "Prognosis discussion", "Caregiver & psychosocial support", "Advance directives"], lens: { primarySystems: ["constitutional", "respiratory", "gi", "psych"], showScreeningHistory: false } },
  { id: "infectious-disease", name: "Infectious Disease", focus: ["Exposure & travel history", "Immunization & immune status", "Antimicrobial history & allergies", "Sexual & substance exposures", "Source-of-infection review"], lens: { primarySystems: ["constitutional", "respiratory", "gi", "skin", "lymph", "immuno"], showSexualHistory: true } },
  { id: "internal-medicine", name: "Internal Medicine", focus: ["Complete problem list", "Medication reconciliation", "Preventive screening", "Cardiometabolic risk", "Functional & social context"] },
  { id: "interventional-cardiology", name: "Interventional Cardiology", focus: ["Anginal pattern & functional class", "Prior catheterization/PCI/CABG", "Antiplatelet & anticoagulation", "Renal function & contrast risk", "Access site history"], lens: { primarySystems: ["vitals", "cardiovascular", "neck"] } },
  { id: "neurological-surgery", name: "Neurological Surgery", focus: ["Neurologic deficit timeline", "Imaging findings", "Spine/cranial surgical history", "Anticoagulation & bleeding risk", "Functional baseline"], lens: { primarySystems: ["neuro", "msk"] } },
  { id: "nephrology", name: "Nephrology", focus: ["eGFR/creatinine trend", "Proteinuria & urinalysis", "BP control", "Volume status", "Nephrotoxin exposure (NSAID/contrast)"], lens: { primarySystems: ["vitals", "gu", "cardiovascular"] } },
  { id: "obstetrics-gynecology", name: "Obstetrics and Gynecology", focus: ["Menstrual & obstetric history (G/P)", "Contraception & sexual health", "Pap/HPV/mammography", "Pelvic symptoms", "Pregnancy-related risks"], lens: { primarySystems: ["gu", "breasts", "abdomen", "endocrine"], showSexualHistory: true } },
  { id: "ophthalmology", name: "Ophthalmology", focus: ["Visual acuity & field changes", "Ocular trauma/surgery", "Diabetic/HTN retinal risk", "Family hx glaucoma/AMD", "Eye medications & contacts"], lens: { primarySystems: ["eyes"], showScreeningHistory: false } },
  { id: "orthopedic-surgery", name: "Orthopedic Surgery", focus: ["Pain/functional limitation", "Trauma & prior orthopedic surgery", "Imaging findings", "Anticoagulation & VTE risk", "Occupational & activity demands"], lens: { primarySystems: ["msk", "neuro"], showScreeningHistory: false } },
  { id: "otolaryngology", name: "Otolaryngology — Head and Neck", focus: ["ENT symptom review (hearing/voice/swallow)", "Tobacco & alcohol", "Head & neck cancer hx", "Sinus & airway disease", "Prior ENT surgery"], lens: { primarySystems: ["ears", "nose", "mouth", "neck", "lymph"] } },
  { id: "pediatric-anesthesiology", name: "Pediatric Anesthesiology", focus: ["Birth & developmental history", "Airway anomalies", "Recent URIs", "NPO status & weight", "Family anesthesia/MH history"], lens: { primarySystems: ["vitals", "mouth", "neck", "respiratory"], showScreeningHistory: false } },
  { id: "pediatric-dermatology", name: "Pediatric Dermatology", focus: ["Onset & distribution of lesions", "Atopic march", "Birthmarks/vascular lesions", "Family skin disease", "Topical therapy history"], lens: { primarySystems: ["skin"] } },
  { id: "pediatric-emergency-medicine", name: "Pediatric Emergency Medicine", focus: ["Presenting complaint & vitals (age-adjusted)", "Immunization status", "Feeding/hydration", "Trauma/non-accidental injury screen", "Caregiver & disposition"], lens: { primarySystems: ["vitals", "respiratory", "cardiovascular", "neuro", "abdomen"], showScreeningHistory: false } },
  { id: "pediatric-surgery", name: "Pediatric Surgery", focus: ["Birth history & congenital anomalies", "Growth & nutrition", "Prior surgical history", "Anesthesia history", "Family/social context"], lens: { primarySystems: ["abdomen", "gi", "vitals"], showScreeningHistory: false } },
  { id: "pediatrics", name: "Pediatrics", focus: ["Birth, growth & development", "Immunizations", "Nutrition & feeding", "Behavioral & school", "Family & social environment"] },
  { id: "plastic-surgery", name: "Plastic Surgery", focus: ["Reconstructive/aesthetic goals", "Wound healing & smoking status", "Prior surgical & scar history", "Anticoagulation", "Psychosocial readiness"], lens: { primarySystems: ["skin", "msk"] } },
  { id: "pulmonary-disease", name: "Pulmonary Disease", focus: ["Dyspnea & cough pattern", "Smoking/occupational exposure", "PFT/imaging findings", "Sleep-disordered breathing", "Inhaler & oxygen use"], lens: { primarySystems: ["vitals", "respiratory", "cardiovascular"] } },
  { id: "pulmonary-critical-care", name: "Pulmonary Disease and Critical Care Medicine", focus: ["Respiratory failure etiology", "Ventilator history", "Sepsis & hemodynamics", "Chronic lung disease baseline", "Goals of care"], lens: { primarySystems: ["vitals", "respiratory", "cardiovascular", "neuro"], showScreeningHistory: false } },
  { id: "rheumatology", name: "Rheumatology", focus: ["Joint pattern & inflammatory features", "Systemic/extra-articular symptoms", "Autoimmune family history", "Serologies & imaging", "DMARD/biologic history"], lens: { primarySystems: ["msk", "skin", "constitutional", "eyes"] } },
  { id: "thoracic-surgery", name: "Thoracic Surgery", focus: ["Pulmonary reserve (PFT, 6MWT)", "Cardiac risk stratification", "Smoking status", "Prior thoracic surgery/radiation", "Tumor staging if applicable"], lens: { primarySystems: ["vitals", "respiratory", "cardiovascular"], showScreeningHistory: false } },
];

const KEY = "subspecialty:selected";

export function getSelectedSubspecialty(): Subspecialty | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(KEY);
    if (!id) return null;
    return SUBSPECIALTIES.find((s) => s.id === id) ?? null;
  } catch {
    return null;
  }
}

export function setSelectedSubspecialty(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("subspecialty:changed"));
  } catch {
    /* ignore */
  }
}
