// Registry of standardized U.S. medical forms surfaced in the Forms tab.
// Each form has a small set of field definitions; the renderer auto-fills
// defaults from the demo patient and lets the user edit & download as PDF.

export type FormFieldType = "text" | "textarea" | "date" | "checkbox" | "select";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  /** default value (after patient autofill substitution `{{tokens}}`). */
  default?: string;
  options?: string[]; // for select
  hint?: string;
  cols?: 1 | 2; // grid spans on md+
};

export type FormDef = {
  id: string;
  number: string;
  name: string;
  category: string;
  issuer: string;
  purpose: string;
  url: string;
  fields: FormField[];
};

// ------- field building blocks -------
const PATIENT_BLOCK: FormField[] = [
  { id: "patient_name", label: "Patient full name", type: "text", default: "{{name}}" },
  { id: "patient_dob", label: "Date of birth", type: "date", default: "{{dob}}" },
  { id: "patient_sex", label: "Sex", type: "select", options: ["Female", "Male", "Other"], default: "{{sex}}" },
  { id: "patient_pid", label: "Patient ID / Record №", type: "text", default: "{{pid}}" },
  { id: "patient_phone", label: "Phone", type: "text" },
  { id: "patient_address", label: "Address", type: "textarea", cols: 2 },
];

const PROVIDER_BLOCK: FormField[] = [
  { id: "provider_name", label: "Health care provider name", type: "text" },
  { id: "provider_npi", label: "NPI #", type: "text" },
  { id: "provider_specialty", label: "Specialty", type: "text" },
  { id: "provider_phone", label: "Office phone", type: "text" },
  { id: "provider_address", label: "Practice address", type: "textarea", cols: 2 },
  { id: "provider_signature", label: "Provider signature (typed)", type: "text" },
  { id: "provider_signed_date", label: "Date signed", type: "date" },
];

const DX_BLOCK: FormField[] = [
  { id: "diagnosis", label: "Primary diagnosis (ICD-10)", type: "text", default: "E78.5 — Mixed dyslipidemia" },
  { id: "secondary_dx", label: "Secondary diagnoses", type: "textarea", default: "I10 — Essential hypertension\nE27.0 — Hyperprolactinemia\nE55.9 — Vitamin D deficiency" },
  { id: "date_onset", label: "Approximate date condition began", type: "date" },
  { id: "treatment_summary", label: "Treatment summary", type: "textarea", cols: 2 },
];

const f = (...arr: FormField[][]) => arr.flat();

export const FORM_CATEGORIES: { id: string; title: string; blurb: string }[] = [
  { id: "fmla", title: "Family & Medical Leave (FMLA)", blurb: "U.S. Department of Labor — WH series." },
  { id: "ssa", title: "Social Security Disability (SSDI / SSI)", blurb: "Social Security Administration." },
  { id: "wc", title: "Workers' Compensation", blurb: "DOL/OWCP, OSHA & state boards." },
  { id: "va", title: "Veterans Affairs & Military", blurb: "VA, DoD, OPM." },
  { id: "cms", title: "Medicare / Medicaid & Insurance Billing", blurb: "CMS & NUCC." },
  { id: "pa", title: "Prior Authorization & Utilization", blurb: "AMA/AHIP, NCPDP, CMS-0057-F." },
  { id: "school", title: "School & Childcare", blurb: "State boards following CDC/ACIP & AAP." },
  { id: "sports", title: "Sports Pre-Participation (PPE)", blurb: "AAFP/AAP/ACSM PPE Monograph 5th ed." },
  { id: "occ", title: "Pre-Employment & Occupational Health", blurb: "OSHA, DOT/FMCSA, FAA, OPM." },
  { id: "hipaa", title: "HIPAA & Patient Rights", blurb: "HHS / Office for Civil Rights." },
  { id: "eol", title: "Advance Directives & End-of-Life", blurb: "State statutes & National POLST." },
  { id: "doc", title: "Clinical Documentation Standards", blurb: "CMS E/M, AMA CPT, Joint Commission, HL7." },
  { id: "imm", title: "Immigration & Civil Surgeon", blurb: "USCIS & DOS." },
];

export const MEDICAL_FORMS: FormDef[] = [
  // FMLA
  {
    id: "wh-380-e", number: "WH-380-E", name: "Certification of Health Care Provider — Employee", category: "fmla",
    issuer: "U.S. Department of Labor (WHD)", purpose: "Provider certifies the employee's own serious health condition requiring FMLA leave.",
    url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(
      [{ id: "employer_name", label: "Employer name", type: "text" }],
      PATIENT_BLOCK,
      DX_BLOCK,
      [
        { id: "leave_start", label: "Estimated leave start", type: "date" },
        { id: "leave_end", label: "Estimated leave end", type: "date" },
        { id: "incapacity", label: "Period of incapacity / frequency of episodes", type: "textarea", cols: 2 },
        { id: "essential_fn", label: "Job functions employee cannot perform", type: "textarea", cols: 2 },
        { id: "intermittent", label: "Intermittent leave required?", type: "select", options: ["No", "Yes — episodic", "Yes — reduced schedule"] },
      ],
      PROVIDER_BLOCK,
    ),
  },
  {
    id: "wh-380-f", number: "WH-380-F", name: "Certification — Family Member", category: "fmla",
    issuer: "U.S. Department of Labor (WHD)", purpose: "Provider certifies a family member's serious health condition.",
    url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(
      [
        { id: "employer_name", label: "Employer name", type: "text" },
        { id: "employee_name", label: "Employee name", type: "text", default: "{{name}}" },
        { id: "family_member_name", label: "Family member name", type: "text" },
        { id: "relationship", label: "Relationship", type: "select", options: ["Spouse", "Parent", "Child"] },
      ],
      DX_BLOCK,
      [
        { id: "care_needed", label: "Care the employee will provide", type: "textarea", cols: 2 },
        { id: "leave_start", label: "Estimated leave start", type: "date" },
        { id: "leave_end", label: "Estimated leave end", type: "date" },
      ],
      PROVIDER_BLOCK,
    ),
  },
  { id: "wh-381", number: "WH-381", name: "Notice of Eligibility & Rights/Responsibilities", category: "fmla", issuer: "DOL WHD", purpose: "Employer notifies employee of FMLA eligibility.", url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(PATIENT_BLOCK, [
      { id: "employer_name", label: "Employer name", type: "text" },
      { id: "eligible", label: "Eligibility determination", type: "select", options: ["Eligible", "Not eligible"] },
      { id: "notice_date", label: "Notice date", type: "date" },
    ]) },
  { id: "wh-382", number: "WH-382", name: "Designation Notice", category: "fmla", issuer: "DOL WHD", purpose: "Employer designates leave as FMLA-qualifying.", url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(PATIENT_BLOCK, [{ id: "designation", label: "Designation", type: "select", options: ["Approved", "Denied", "Additional info required"] }, { id: "hours_used", label: "Hours of FMLA used to date", type: "text" }, { id: "notice_date", label: "Notice date", type: "date" }]) },
  { id: "wh-384", number: "WH-384", name: "Qualifying Exigency — Military Family Leave", category: "fmla", issuer: "DOL WHD", purpose: "Certifies qualifying exigency for military family leave.", url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(PATIENT_BLOCK, [{ id: "servicemember_name", label: "Covered servicemember name", type: "text" }, { id: "exigency", label: "Qualifying exigency", type: "textarea", cols: 2 }]) },
  { id: "wh-385", number: "WH-385", name: "Serious Injury — Current Servicemember", category: "fmla", issuer: "DOL WHD", purpose: "Certifies serious injury/illness of covered servicemember.", url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(PATIENT_BLOCK, DX_BLOCK, PROVIDER_BLOCK) },
  { id: "wh-385-v", number: "WH-385-V", name: "Serious Injury — Veteran", category: "fmla", issuer: "DOL WHD", purpose: "Certifies serious injury/illness of a veteran for caregiver leave.", url: "https://www.dol.gov/agencies/whd/fmla/forms",
    fields: f(PATIENT_BLOCK, DX_BLOCK, PROVIDER_BLOCK) },

  // SSA
  { id: "ssa-16", number: "SSA-16", name: "Application for Disability Insurance Benefits", category: "ssa", issuer: "Social Security Administration", purpose: "Patient application for SSDI benefits.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [
      { id: "ssn", label: "Social Security Number", type: "text" },
      { id: "marital_status", label: "Marital status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
      { id: "last_worked", label: "Date last worked", type: "date" },
      { id: "conditions", label: "Medical conditions preventing work", type: "textarea", cols: 2, default: "Mixed dyslipidemia with ASCVD risk; hypertension; intermittent palpitations under evaluation." },
    ]) },
  { id: "ssa-3368", number: "SSA-3368", name: "Disability Report — Adult", category: "ssa", issuer: "SSA", purpose: "Self-report of conditions, treatments, and functional limitations.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [
      { id: "conditions", label: "List all medical conditions", type: "textarea", cols: 2, default: "1. Mixed dyslipidemia (E78.5)\n2. Essential hypertension (I10)\n3. Hyperprolactinemia (E27.0)\n4. Vitamin D deficiency (E55.9)" },
      { id: "height_weight", label: "Height / weight", type: "text", default: "165 cm / 71.9 kg" },
      { id: "meds", label: "Current medications", type: "textarea", cols: 2, default: "Atorvastatin 20 mg qHS\nLisinopril 20 mg daily\nMetformin 500 mg BID\nAspirin 81 mg daily\nVitamin D 2000 IU daily" },
      { id: "treatments", label: "Tests and treatments", type: "textarea", cols: 2 },
      { id: "providers", label: "Treating providers", type: "textarea", cols: 2 },
      { id: "functional", label: "How conditions limit ability to work", type: "textarea", cols: 2 },
    ]) },
  { id: "ssa-3441", number: "SSA-3441", name: "Disability Report — Appeal", category: "ssa", issuer: "SSA", purpose: "Updated medical information for reconsideration/appeal.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "changes", label: "Changes since last report", type: "textarea", cols: 2 }, { id: "new_providers", label: "New providers seen", type: "textarea", cols: 2 }, { id: "new_meds", label: "New medications", type: "textarea", cols: 2 }]) },
  { id: "ssa-827", number: "SSA-827", name: "Authorization to Disclose Information to SSA", category: "ssa", issuer: "SSA", purpose: "Patient authorizes release of medical records to SSA.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "ssn", label: "SSN", type: "text" }, { id: "auth_date", label: "Date signed", type: "date" }, { id: "signature", label: "Signature (typed)", type: "text", default: "{{name}}" }]) },
  { id: "ssa-4814", number: "SSA-4814", name: "Medical Report — Adult with HIV", category: "ssa", issuer: "SSA", purpose: "Physician report for HIV-related disability claims.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, DX_BLOCK, PROVIDER_BLOCK) },
  { id: "ssa-1151", number: "SSA-1151", name: "Consultative Examination (Physical)", category: "ssa", issuer: "SSA", purpose: "Physician report from consultative physical examination.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, DX_BLOCK, [{ id: "exam_findings", label: "Examination findings", type: "textarea", cols: 2 }, { id: "functional_assessment", label: "Functional assessment", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "ssa-1152", number: "SSA-1152", name: "Consultative Examination (Mental)", category: "ssa", issuer: "SSA", purpose: "Psychologist/psychiatrist report for mental health disability.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "mse", label: "Mental status examination", type: "textarea", cols: 2 }, { id: "dx", label: "DSM-5 diagnoses", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "ssa-454", number: "SSA-454", name: "Continuing Disability Review Report", category: "ssa", issuer: "SSA", purpose: "Periodic disability review report.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "review_period", label: "Reporting period", type: "text" }, { id: "changes", label: "Changes in condition", type: "textarea", cols: 2 }]) },
  { id: "ssa-561", number: "SSA-561", name: "Request for Reconsideration", category: "ssa", issuer: "SSA", purpose: "Appeal of initial disability determination.", url: "https://www.ssa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "decision_date", label: "Date of decision being appealed", type: "date" }, { id: "reason", label: "Reason for disagreement", type: "textarea", cols: 2 }]) },

  // Workers' Comp
  { id: "ca-16", number: "CA-16", name: "Authorization for Examination/Treatment (Federal)", category: "wc", issuer: "DOL / OWCP", purpose: "Authorizes medical treatment for federal employee work injury.", url: "https://www.dol.gov/agencies/owcp",
    fields: f(PATIENT_BLOCK, [{ id: "injury_date", label: "Date of injury", type: "date" }, { id: "injury_description", label: "Description of injury", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "ca-17", number: "CA-17", name: "Duty Status Report (Federal)", category: "wc", issuer: "DOL / OWCP", purpose: "Provider reports work capacity/restrictions.", url: "https://www.dol.gov/agencies/owcp",
    fields: f(PATIENT_BLOCK, [{ id: "restrictions", label: "Work restrictions", type: "textarea", cols: 2 }, { id: "return_date", label: "Anticipated return-to-work date", type: "date" }], PROVIDER_BLOCK) },
  { id: "ca-20", number: "CA-20", name: "Attending Physician's Report (Federal)", category: "wc", issuer: "DOL / OWCP", purpose: "Documents diagnosis, treatment, and disability status.", url: "https://www.dol.gov/agencies/owcp",
    fields: f(PATIENT_BLOCK, DX_BLOCK, [{ id: "disability_period", label: "Period of disability", type: "text" }], PROVIDER_BLOCK) },
  { id: "ca-1", number: "CA-1", name: "Notice of Traumatic Injury (Federal)", category: "wc", issuer: "DOL / OWCP", purpose: "Employee reports traumatic work injury.", url: "https://www.dol.gov/agencies/owcp",
    fields: f(PATIENT_BLOCK, [{ id: "injury_date", label: "Date/time of injury", type: "text" }, { id: "where", label: "Where it happened", type: "textarea", cols: 2 }, { id: "what", label: "What happened", type: "textarea", cols: 2 }]) },
  { id: "ca-2", number: "CA-2", name: "Notice of Occupational Disease (Federal)", category: "wc", issuer: "DOL / OWCP", purpose: "Employee reports occupational disease.", url: "https://www.dol.gov/agencies/owcp",
    fields: f(PATIENT_BLOCK, [{ id: "first_aware", label: "Date first aware of disease", type: "date" }, { id: "exposure", label: "Workplace exposure", type: "textarea", cols: 2 }]) },
  { id: "osha-300", number: "OSHA 300", name: "Log of Work-Related Injuries & Illnesses", category: "wc", issuer: "OSHA", purpose: "Employer log of all work-related injuries/illnesses.", url: "https://www.osha.gov/recordkeeping",
    fields: [{ id: "case_number", label: "Case #", type: "text" }, { id: "employee_name", label: "Employee name", type: "text", default: "{{name}}" }, { id: "job_title", label: "Job title", type: "text" }, { id: "date_injury", label: "Date of injury", type: "date" }, { id: "where", label: "Where occurred", type: "text" }, { id: "description", label: "Injury description & body part", type: "textarea", cols: 2 }, { id: "outcome", label: "Outcome", type: "select", options: ["Death", "Days away from work", "Job transfer/restriction", "Other recordable"] }] },
  { id: "osha-301", number: "OSHA 301", name: "Injury & Illness Incident Report", category: "wc", issuer: "OSHA", purpose: "Detailed report of each recordable work-related injury/illness.", url: "https://www.osha.gov/recordkeeping",
    fields: f(PATIENT_BLOCK, [{ id: "treatment", label: "Treatment provided", type: "textarea", cols: 2 }, { id: "physician", label: "Treating physician/facility", type: "text" }]) },
  { id: "froi", number: "FROI", name: "First Report of Injury (state)", category: "wc", issuer: "State workers' comp boards", purpose: "Employer/physician reports work injury to state board.", url: "Varies by state",
    fields: f(PATIENT_BLOCK, [{ id: "state", label: "State", type: "text" }, { id: "injury_date", label: "Date of injury", type: "date" }, { id: "description", label: "Injury description", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },

  // VA / Military
  { id: "va-21-526ez", number: "VA 21-526EZ", name: "Application for Disability Compensation", category: "va", issuer: "U.S. Department of Veterans Affairs", purpose: "Veteran applies for VA disability benefits.", url: "https://www.va.gov/find-forms",
    fields: f(PATIENT_BLOCK, [{ id: "ssn", label: "SSN", type: "text" }, { id: "service_branch", label: "Service branch", type: "text" }, { id: "service_dates", label: "Service dates", type: "text" }, { id: "claimed_conditions", label: "Claimed service-connected conditions", type: "textarea", cols: 2 }]) },
  { id: "va-21-0960", number: "VA 21-0960 (series)", name: "Disability Benefits Questionnaire (DBQ)", category: "va", issuer: "VA", purpose: "Condition-specific medical evidence form.", url: "https://www.va.gov/find-forms",
    fields: f(PATIENT_BLOCK, DX_BLOCK, [{ id: "body_system", label: "Body system / DBQ type", type: "text" }, { id: "functional_impact", label: "Functional impact", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "va-10-10ez", number: "VA 10-10EZ", name: "Application for Health Benefits", category: "va", issuer: "VA", purpose: "Veteran enrolls in VA healthcare.", url: "https://www.va.gov/find-forms",
    fields: f(PATIENT_BLOCK, [{ id: "ssn", label: "SSN", type: "text" }, { id: "service_branch", label: "Service branch", type: "text" }, { id: "income", label: "Household income (annual)", type: "text" }]) },
  { id: "dd-214", number: "DD-214", name: "Certificate of Release / Discharge", category: "va", issuer: "DoD", purpose: "Documents military service history & discharge status.", url: "https://www.archives.gov/veterans",
    fields: [{ id: "name", label: "Member name", type: "text", default: "{{name}}" }, { id: "service_branch", label: "Branch", type: "text" }, { id: "entry_date", label: "Entry date", type: "date" }, { id: "separation_date", label: "Separation date", type: "date" }, { id: "discharge_type", label: "Type of discharge", type: "select", options: ["Honorable", "General", "Other than honorable", "Bad conduct", "Dishonorable"] }] },
  { id: "sf-86", number: "SF-86", name: "Questionnaire for National Security Positions", category: "va", issuer: "OPM", purpose: "Security clearance application including mental health questions.", url: "https://www.opm.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "position", label: "Position applying for", type: "text" }, { id: "clearance_level", label: "Clearance level", type: "select", options: ["Confidential", "Secret", "Top Secret", "TS/SCI"] }, { id: "mental_health", label: "Mental health treatment disclosure (Section 21)", type: "textarea", cols: 2 }]) },
  { id: "sf-600", number: "SF-600", name: "Chronological Record of Medical Care", category: "va", issuer: "DoD", purpose: "Standard military medical encounter documentation.", url: "https://www.militaryonesource.mil",
    fields: f(PATIENT_BLOCK, [{ id: "encounter_date", label: "Encounter date", type: "date" }, { id: "subjective", label: "Subjective", type: "textarea", cols: 2 }, { id: "objective", label: "Objective", type: "textarea", cols: 2 }, { id: "assessment", label: "Assessment", type: "textarea", cols: 2 }, { id: "plan", label: "Plan", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "va-10-5345", number: "VA 10-5345", name: "Authorization to Release Health Information", category: "va", issuer: "VA", purpose: "Patient authorizes release of VA medical records.", url: "https://www.va.gov/find-forms",
    fields: f(PATIENT_BLOCK, [{ id: "release_to", label: "Release records to", type: "text" }, { id: "purpose", label: "Purpose of release", type: "text" }, { id: "expiration", label: "Authorization expires", type: "date" }, { id: "signature", label: "Signature (typed)", type: "text", default: "{{name}}" }]) },

  // CMS / Billing
  { id: "cms-1500", number: "CMS-1500", name: "Health Insurance Claim Form (Professional)", category: "cms", issuer: "CMS / NUCC", purpose: "Standard claim form for physician/outpatient services.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PATIENT_BLOCK, [
      { id: "insurance_name", label: "Insurance plan name", type: "text" },
      { id: "insurance_id", label: "Insured ID #", type: "text" },
      { id: "date_of_service", label: "Date of service", type: "date" },
      { id: "place_of_service", label: "Place of service code", type: "text", default: "11 (Office)" },
      { id: "cpt", label: "CPT/HCPCS code(s)", type: "textarea", default: "99214 — Office visit, established, moderate" },
      { id: "icd10", label: "ICD-10 diagnosis code(s)", type: "textarea", default: "E78.5, I10, E27.0, E55.9" },
      { id: "charges", label: "Charges ($)", type: "text" },
    ], PROVIDER_BLOCK) },
  { id: "cms-1450", number: "CMS-1450 (UB-04)", name: "Uniform Bill — Institutional Claim", category: "cms", issuer: "CMS / NUCC", purpose: "Standard claim form for hospital/institutional services.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PATIENT_BLOCK, [{ id: "facility", label: "Billing facility", type: "text" }, { id: "admit_date", label: "Admission date", type: "date" }, { id: "discharge_date", label: "Discharge date", type: "date" }, { id: "drg", label: "DRG", type: "text" }, { id: "revenue_codes", label: "Revenue codes & charges", type: "textarea", cols: 2 }]) },
  { id: "cms-460", number: "CMS-460", name: "Medicare Participating Physician Agreement", category: "cms", issuer: "CMS", purpose: "Physician agrees to accept Medicare assignment.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: PROVIDER_BLOCK },
  { id: "cms-855i", number: "CMS-855I", name: "Medicare Enrollment Application (Individual)", category: "cms", issuer: "CMS", purpose: "Physician enrolls in Medicare.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PROVIDER_BLOCK, [{ id: "reason", label: "Reason for application", type: "select", options: ["Initial enrollment", "Reactivation", "Change of information", "Revalidation"] }]) },
  { id: "cms-484", number: "CMS-484", name: "Certificate of Medical Necessity — Oxygen", category: "cms", issuer: "CMS", purpose: "Physician certifies medical necessity for home oxygen.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PATIENT_BLOCK, [{ id: "spo2", label: "Arterial PaO₂ / SpO₂", type: "text" }, { id: "test_date", label: "Date of testing", type: "date" }, { id: "lpm", label: "Liters per minute", type: "text" }, { id: "duration", label: "Hours of use per day", type: "text" }], PROVIDER_BLOCK) },
  { id: "cms-846", number: "CMS-846/847", name: "Certificate of Medical Necessity — DME", category: "cms", issuer: "CMS", purpose: "Physician certifies medical necessity for durable medical equipment.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PATIENT_BLOCK, [{ id: "equipment", label: "DME requested", type: "text" }, { id: "clinical_justification", label: "Clinical justification", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "cms-10106", number: "CMS-10106", name: "Advance Beneficiary Notice (ABN)", category: "cms", issuer: "CMS", purpose: "Notifies patient that Medicare may not cover a service.", url: "https://www.cms.gov/Medicare/CMS-Forms",
    fields: f(PATIENT_BLOCK, [{ id: "service", label: "Item or service", type: "textarea", cols: 2 }, { id: "reason", label: "Reason Medicare may not pay", type: "textarea", cols: 2 }, { id: "estimated_cost", label: "Estimated cost ($)", type: "text" }, { id: "option", label: "Patient option selected", type: "select", options: ["Option 1 — receive service & bill Medicare", "Option 2 — receive service, do not bill Medicare", "Option 3 — do not receive service"] }]) },

  // Prior Auth
  { id: "ama-pa", number: "AMA PA", name: "AMA/AHIP Standard Prior Authorization Request", category: "pa", issuer: "American Medical Association / AHIP", purpose: "Standardized PA request form endorsed by AMA and AHIP.", url: "https://www.ama-assn.org/practice-management",
    fields: f(PATIENT_BLOCK, [
      { id: "insurance_name", label: "Plan", type: "text" },
      { id: "insurance_id", label: "Member ID", type: "text" },
      { id: "request_type", label: "Request type", type: "select", options: ["Standard", "Urgent (72h)", "Concurrent review"] },
      { id: "service", label: "Service / medication / device", type: "textarea", cols: 2 },
      { id: "cpt_hcpcs", label: "CPT/HCPCS", type: "text" },
      { id: "icd10", label: "ICD-10 codes", type: "text", default: "E78.5, I10" },
      { id: "clinical_rationale", label: "Clinical rationale", type: "textarea", cols: 2 },
    ], PROVIDER_BLOCK) },
  { id: "ncpdp-pa", number: "NCPDP PA", name: "Electronic Prior Authorization (Pharmacy)", category: "pa", issuer: "National Council for Prescription Drug Programs", purpose: "Standardized electronic PA for pharmacy claims.", url: "https://www.ncpdp.org",
    fields: f(PATIENT_BLOCK, [{ id: "drug", label: "Drug name & NDC", type: "text" }, { id: "strength", label: "Strength / dose", type: "text" }, { id: "days_supply", label: "Days supply", type: "text" }, { id: "step_therapy", label: "Step therapy / failure history", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },

  // School
  { id: "school-immun", number: "Form", name: "School Immunization Record", category: "school", issuer: "State health department (CDC/ACIP)", purpose: "Documents required immunizations for school entry.", url: "State health department website",
    fields: f(PATIENT_BLOCK, [{ id: "grade", label: "Grade / school entry", type: "text" }, { id: "immunizations", label: "Vaccines administered (vaccine, date, lot)", type: "textarea", cols: 2, default: "DTaP — completed series\nMMR — 2 doses\nVaricella — 2 doses\nHepB — 3 doses\nIPV — 4 doses\nHPV — series" }], PROVIDER_BLOCK) },
  { id: "school-health", number: "Form", name: "School Health Examination", category: "school", issuer: "State education / health departments", purpose: "Annual or periodic health assessment for school attendance.", url: "State education department website",
    fields: f(PATIENT_BLOCK, [{ id: "vitals", label: "Vitals (HR, BP, RR, Temp, BMI)", type: "textarea", cols: 2 }, { id: "exam", label: "Physical examination", type: "textarea", cols: 2 }, { id: "clearance", label: "Cleared for school?", type: "select", options: ["Yes", "Yes with restrictions", "No"] }], PROVIDER_BLOCK) },
  { id: "school-exempt", number: "Form", name: "Medical Exemption from Immunization", category: "school", issuer: "State health department", purpose: "Physician certifies medical contraindication to specific vaccine(s).", url: "State health department website",
    fields: f(PATIENT_BLOCK, [{ id: "vaccine", label: "Vaccine(s) contraindicated", type: "text" }, { id: "reason", label: "Medical reason (ACIP-recognized)", type: "textarea", cols: 2 }, { id: "duration", label: "Duration of exemption", type: "select", options: ["Permanent", "Temporary"] }], PROVIDER_BLOCK) },
  { id: "school-medadmin", number: "Form", name: "School Medication Administration", category: "school", issuer: "State education / district", purpose: "Authorizes school nurse to administer medication.", url: "School district website",
    fields: f(PATIENT_BLOCK, [{ id: "medication", label: "Medication, dose, route", type: "textarea", cols: 2 }, { id: "schedule", label: "Schedule / PRN indication", type: "textarea", cols: 2 }, { id: "duration", label: "Duration of order", type: "text" }], PROVIDER_BLOCK) },
  { id: "school-eap", number: "Form", name: "Emergency Action Plan (allergy/asthma/seizure)", category: "school", issuer: "AAP / AAFA templates", purpose: "Physician-directed emergency management plan for school.", url: "https://www.aap.org",
    fields: f(PATIENT_BLOCK, [{ id: "condition", label: "Condition", type: "select", options: ["Anaphylaxis", "Asthma", "Seizure", "Diabetes"] }, { id: "triggers", label: "Triggers / warning signs", type: "textarea", cols: 2 }, { id: "rescue_meds", label: "Rescue medications & doses", type: "textarea", cols: 2 }, { id: "emergency_steps", label: "Step-by-step response", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "504-iep", number: "Form", name: "504 / IEP Medical Documentation", category: "school", issuer: "U.S. Department of Education", purpose: "Documents medical condition requiring educational accommodations.", url: "https://www.ed.gov",
    fields: f(PATIENT_BLOCK, DX_BLOCK, [{ id: "accommodations", label: "Recommended accommodations", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },

  // Sports PPE
  { id: "ppe-history", number: "PPE", name: "PPE History Form", category: "sports", issuer: "AAFP/AAP/ACSM/AMSSM/AOSSM/AOASM", purpose: "Standardized medical/family history for sports clearance (includes AHA 14-point cardiac screen).", url: "PPE Monograph 5th ed.",
    fields: f(PATIENT_BLOCK, [
      { id: "sport", label: "Sport(s) participating in", type: "text" },
      { id: "cardiac_personal", label: "AHA cardiac history — personal (chest pain, syncope, palpitations, etc.)", type: "textarea", cols: 2 },
      { id: "cardiac_family", label: "AHA cardiac history — family (sudden death <50, HCM, long QT)", type: "textarea", cols: 2 },
      { id: "musculoskeletal", label: "Musculoskeletal history", type: "textarea", cols: 2 },
      { id: "concussion", label: "Concussion / head injury history", type: "textarea", cols: 2 },
    ]) },
  { id: "ppe-exam", number: "PPE", name: "PPE Physical Examination Form", category: "sports", issuer: "Same as PPE History", purpose: "Standardized physical exam documentation for sports clearance.", url: "PPE Monograph 5th ed.",
    fields: f(PATIENT_BLOCK, [{ id: "vitals", label: "Vitals (HR, BP, vision)", type: "textarea", cols: 2 }, { id: "cv", label: "Cardiovascular exam", type: "textarea", cols: 2 }, { id: "msk", label: "Musculoskeletal screen", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "ppe-clear", number: "PPE", name: "PPE Clearance Form", category: "sports", issuer: "Same as PPE History", purpose: "Physician clearance/restriction determination.", url: "PPE Monograph 5th ed.",
    fields: f(PATIENT_BLOCK, [{ id: "clearance", label: "Clearance", type: "select", options: ["Cleared, all sports", "Cleared, with restrictions", "Not cleared, pending evaluation", "Not cleared"] }, { id: "restrictions", label: "Restrictions / follow-up", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },

  // Occupational
  { id: "osha-resp", number: "29 CFR 1910.134 App C", name: "OSHA Respirator Medical Evaluation Questionnaire", category: "occ", issuer: "OSHA", purpose: "Medical clearance for respirator use.", url: "https://www.osha.gov",
    fields: f(PATIENT_BLOCK, [{ id: "respirator_type", label: "Respirator type", type: "select", options: ["N95 / filtering facepiece", "Half-mask air-purifying", "Full-face APR", "PAPR", "SCBA"] }, { id: "cardio_resp_history", label: "Cardiopulmonary history", type: "textarea", cols: 2 }, { id: "clearance", label: "Clearance", type: "select", options: ["Cleared", "Cleared with limitations", "Not cleared"] }], PROVIDER_BLOCK) },
  { id: "mcsa-5875", number: "MCSA-5875", name: "DOT/FMCSA Medical Examination Report", category: "occ", issuer: "DOT / FMCSA", purpose: "CDL driver medical certification.", url: "https://www.fmcsa.dot.gov",
    fields: f(PATIENT_BLOCK, [{ id: "cdl_class", label: "CDL class", type: "select", options: ["A", "B", "C"] }, { id: "vitals", label: "BP, vision, hearing", type: "textarea", cols: 2 }, { id: "med_history", label: "Driver medical history", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "mcsa-5876", number: "MCSA-5876", name: "Medical Examiner's Certificate (wallet card)", category: "occ", issuer: "DOT / FMCSA", purpose: "CDL driver medical certificate.", url: "https://www.fmcsa.dot.gov",
    fields: f(PATIENT_BLOCK, [{ id: "expiration", label: "Certificate expires", type: "date" }, { id: "restrictions", label: "Restrictions", type: "text" }], PROVIDER_BLOCK) },
  { id: "faa-8500-8", number: "FAA 8500-8", name: "Application for Airman Medical Certificate", category: "occ", issuer: "FAA", purpose: "Pilot medical certificate.", url: "https://www.faa.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "class", label: "Class of certificate", type: "select", options: ["First", "Second", "Third"] }, { id: "med_history", label: "Aviation medical history", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "sf-78", number: "SF-78", name: "Certificate of Medical Examination (Federal employment)", category: "occ", issuer: "OPM", purpose: "Federal employment medical examination.", url: "https://www.opm.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "position", label: "Position", type: "text" }, { id: "exam_findings", label: "Examination findings", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "of-178", number: "OF-178", name: "Certificate of Medical Examination (alternate)", category: "occ", issuer: "OPM", purpose: "Federal employment medical examination (alternate).", url: "https://www.opm.gov/forms",
    fields: f(PATIENT_BLOCK, [{ id: "position", label: "Position", type: "text" }, { id: "exam_findings", label: "Examination findings", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },

  // HIPAA
  { id: "hipaa-auth", number: "HIPAA", name: "Authorization for Release of PHI", category: "hipaa", issuer: "HHS / OCR", purpose: "Patient authorizes disclosure of PHI per 45 CFR § 164.508.", url: "https://www.hhs.gov/hipaa",
    fields: f(PATIENT_BLOCK, [{ id: "release_from", label: "Release PHI FROM", type: "text" }, { id: "release_to", label: "Release PHI TO", type: "text" }, { id: "info_to_release", label: "Information to be released", type: "textarea", cols: 2 }, { id: "purpose", label: "Purpose", type: "text" }, { id: "expiration", label: "Expiration date or event", type: "date" }, { id: "signature", label: "Signature (typed)", type: "text", default: "{{name}}" }, { id: "signed_date", label: "Date signed", type: "date" }]) },
  { id: "hipaa-npp", number: "HIPAA", name: "Notice of Privacy Practices (NPP)", category: "hipaa", issuer: "HHS / OCR", purpose: "Informs patients of HIPAA rights and PHI use.", url: "https://www.hhs.gov/hipaa",
    fields: [{ id: "practice_name", label: "Practice / covered entity name", type: "text" }, { id: "effective_date", label: "Effective date", type: "date" }, { id: "contact", label: "Privacy officer contact", type: "textarea", cols: 2 }] },
  { id: "hipaa-breach", number: "HIPAA", name: "Breach Notification to Patient", category: "hipaa", issuer: "HHS / OCR", purpose: "Notifies patient of unauthorized PHI disclosure.", url: "https://www.hhs.gov/hipaa",
    fields: f(PATIENT_BLOCK, [{ id: "breach_date", label: "Date of breach (or discovery)", type: "date" }, { id: "phi_involved", label: "Types of PHI involved", type: "textarea", cols: 2 }, { id: "steps_taken", label: "Steps taken / patient actions", type: "textarea", cols: 2 }]) },

  // End-of-life
  { id: "ad-livingwill", number: "AD", name: "Advance Directive / Living Will", category: "eol", issuer: "State statute", purpose: "Documents wishes for end-of-life care.", url: "State attorney general site",
    fields: f(PATIENT_BLOCK, [{ id: "wishes_lifesupport", label: "Wishes regarding life-sustaining treatment", type: "textarea", cols: 2 }, { id: "wishes_nutrition", label: "Artificial nutrition / hydration", type: "select", options: ["Provide", "Withhold/withdraw"] }, { id: "wishes_cpr", label: "CPR", type: "select", options: ["Attempt", "Do not attempt"] }, { id: "signature", label: "Signature", type: "text", default: "{{name}}" }, { id: "witness1", label: "Witness 1", type: "text" }, { id: "witness2", label: "Witness 2", type: "text" }]) },
  { id: "polst", number: "POLST/MOLST", name: "Physician Orders for Life-Sustaining Treatment", category: "eol", issuer: "National POLST", purpose: "Portable medical orders for serious illness.", url: "https://polst.org",
    fields: f(PATIENT_BLOCK, [{ id: "cpr", label: "Section A — CPR", type: "select", options: ["Attempt CPR", "Do not attempt CPR (DNR)"] }, { id: "interventions", label: "Section B — medical interventions", type: "select", options: ["Full treatment", "Selective treatment", "Comfort-focused"] }, { id: "nutrition", label: "Section C — artificial nutrition", type: "select", options: ["Long-term", "Trial period", "None"] }], PROVIDER_BLOCK) },
  { id: "hcpoa", number: "HCPOA", name: "Healthcare Power of Attorney / Proxy", category: "eol", issuer: "State statute", purpose: "Designates surrogate decision-maker.", url: "State website",
    fields: f(PATIENT_BLOCK, [{ id: "agent_name", label: "Healthcare agent name", type: "text" }, { id: "agent_relation", label: "Relationship", type: "text" }, { id: "agent_phone", label: "Agent phone", type: "text" }, { id: "alternate", label: "Alternate agent", type: "text" }, { id: "signature", label: "Signature", type: "text", default: "{{name}}" }]) },
  { id: "dnr", number: "DNR", name: "Do Not Resuscitate Order", category: "eol", issuer: "State / hospital", purpose: "Physician order for DNR.", url: "State health department",
    fields: f(PATIENT_BLOCK, [{ id: "diagnosis", label: "Diagnosis / prognosis", type: "textarea", cols: 2 }, { id: "discussion", label: "Discussion documented with", type: "text" }], PROVIDER_BLOCK) },
  { id: "ooh-dnr", number: "OOH-DNR", name: "Out-of-Hospital DNR (EMS)", category: "eol", issuer: "State EMS", purpose: "Portable DNR for EMS/community settings.", url: "State EMS website",
    fields: f(PATIENT_BLOCK, PROVIDER_BLOCK) },

  // Clinical documentation
  { id: "em-2021", number: "CMS 2021 E/M", name: "Office/Outpatient E/M Documentation", category: "doc", issuer: "CMS", purpose: "E/M documentation based on MDM or time.", url: "https://www.cms.gov",
    fields: f(PATIENT_BLOCK, [{ id: "date_of_service", label: "Date of service", type: "date" }, { id: "code", label: "E/M code", type: "select", options: ["99202", "99203", "99204", "99205", "99212", "99213", "99214", "99215"] }, { id: "basis", label: "Basis for code selection", type: "select", options: ["Medical Decision Making", "Total time on date of encounter"] }, { id: "time_minutes", label: "Total time (min)", type: "text" }, { id: "mdm", label: "MDM elements (problems, data, risk)", type: "textarea", cols: 2 }, { id: "note", label: "Note (HPI, exam, A/P)", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
  { id: "cpt-procedure", number: "AMA CPT", name: "Procedure / Service Documentation", category: "doc", issuer: "AMA", purpose: "Document a CPT-coded procedure.", url: "https://www.ama-assn.org",
    fields: f(PATIENT_BLOCK, [{ id: "cpt", label: "CPT code", type: "text" }, { id: "procedure", label: "Procedure description", type: "textarea", cols: 2 }, { id: "indication", label: "Clinical indication", type: "textarea", cols: 2 }, { id: "findings", label: "Findings", type: "textarea", cols: 2 }, { id: "complications", label: "Complications", type: "text" }], PROVIDER_BLOCK) },
  { id: "jc-medrec", number: "Joint Commission", name: "Medical Record Standards Checklist", category: "doc", issuer: "The Joint Commission", purpose: "Accreditation standards for medical record content.", url: "https://www.jointcommission.org",
    fields: f(PATIENT_BLOCK, [{ id: "id_complete", label: "Identification complete", type: "checkbox" }, { id: "hp_24h", label: "H&P within 24h of admission", type: "checkbox" }, { id: "consent", label: "Informed consent on file", type: "checkbox" }, { id: "discharge_summary", label: "Discharge summary within 30 days", type: "checkbox" }, { id: "medication_reconciliation", label: "Medication reconciliation documented", type: "checkbox" }]) },
  { id: "ccda", number: "C-CDA", name: "HL7 C-CDA Continuity of Care Document", category: "doc", issuer: "HL7 International", purpose: "Standardized electronic clinical document.", url: "https://www.hl7.org",
    fields: f(PATIENT_BLOCK, [{ id: "problems", label: "Problems", type: "textarea", cols: 2, default: "E78.5, I10, E27.0, E55.9" }, { id: "medications", label: "Medications", type: "textarea", cols: 2, default: "Atorvastatin 20 mg qHS; Lisinopril 20 mg daily; Metformin 500 mg BID; ASA 81 mg daily; Vit D 2000 IU" }, { id: "allergies", label: "Allergies", type: "textarea", default: "NKDA" }, { id: "results", label: "Results", type: "textarea", cols: 2 }]) },
  { id: "uscdi", number: "USCDI", name: "USCDI Data Class Summary", category: "doc", issuer: "ONC (HHS)", purpose: "Standardized health data elements for interoperability.", url: "https://www.healthit.gov",
    fields: f(PATIENT_BLOCK, [{ id: "data_classes", label: "USCDI data classes captured", type: "textarea", cols: 2, default: "Patient demographics, problems, medications, allergies, lab results, vital signs, immunizations, procedures, smoking status, care team, encounters, clinical notes." }]) },

  // Immigration
  { id: "i-693", number: "I-693", name: "Report of Medical Examination & Vaccination Record", category: "imm", issuer: "USCIS", purpose: "Civil surgeon medical exam for immigration / green card.", url: "https://www.uscis.gov/i-693",
    fields: f(PATIENT_BLOCK, [
      { id: "alien_number", label: "A-Number", type: "text" },
      { id: "tb_screen", label: "TB screening (IGRA/CXR) result", type: "text" },
      { id: "syphilis", label: "Syphilis serology (age ≥18)", type: "text" },
      { id: "gonorrhea", label: "Gonorrhea NAAT (age ≥18)", type: "text" },
      { id: "vaccines", label: "Vaccinations administered", type: "textarea", cols: 2 },
      { id: "class_a_b", label: "Class A / B condition findings", type: "textarea", cols: 2 },
    ], [
      { id: "surgeon_name", label: "Civil surgeon name", type: "text" },
      { id: "surgeon_id", label: "USCIS civil surgeon designation #", type: "text" },
      { id: "surgeon_signed", label: "Date signed", type: "date" },
    ]) },
  { id: "ds-2054", number: "DS-2054", name: "Medical Examination for Immigrant/Refugee", category: "imm", issuer: "U.S. Department of State", purpose: "Overseas medical exam for visa applicants.", url: "https://travel.state.gov",
    fields: f(PATIENT_BLOCK, [{ id: "panel_physician", label: "Panel physician", type: "text" }, { id: "country", label: "Country of examination", type: "text" }, { id: "results", label: "Examination results", type: "textarea", cols: 2 }]) },
  { id: "i-693-supp", number: "I-693 Supp.", name: "Vaccination Supplement", category: "imm", issuer: "USCIS", purpose: "Documents required vaccinations per CDC Technical Instructions.", url: "https://www.uscis.gov/i-693",
    fields: f(PATIENT_BLOCK, [{ id: "vaccinations", label: "Vaccines (name, date, lot)", type: "textarea", cols: 2 }, { id: "contraindications", label: "Contraindications / waivers", type: "textarea", cols: 2 }], PROVIDER_BLOCK) },
];

export const formsByCategory = (catId: string) =>
  MEDICAL_FORMS.filter((f) => f.category === catId);

export const findForm = (id: string) => MEDICAL_FORMS.find((f) => f.id === id);
