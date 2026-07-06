// Completed sample templates for each medical form, with individual
// fictional patient data following each issuing agency's structure.
//
// Each sample is markdown-flavored plain text. The Forms detail view
// renders it as an editable document and exports to PDF.

export const FORM_SAMPLES: Record<string, string> = {
  // ============================================================
  // FMLA
  // ============================================================
  "wh-380-e": `# Certification of Health Care Provider for Employee's Serious Health Condition
**U.S. Department of Labor — Wage and Hour Division · Form WH-380-E**

---

## SECTION I — To be completed by the EMPLOYER
- **Employee's Name:** Jane A. Doe
- **Employee's Job Title:** Registered Nurse
- **Regular Work Schedule:** Monday–Friday, 7:00 AM – 3:30 PM (40 hrs/week)
- **Essential Job Functions:** Direct patient care including lifting up to 50 lbs, standing for 8+ hours, administering medications, charting in EHR, responding to emergencies.

## SECTION II — To be completed by the HEALTH CARE PROVIDER
- **Provider:** Robert M. Smith, MD — Internal Medicine
- **Practice:** Springfield Internal Medicine Associates
- **Address:** 1200 Medical Center Drive, Suite 300, Springfield, IL 62704
- **Phone / Fax:** (217) 555-0142 / (217) 555-0143
- **NPI:** 1234567890

### Part A — Medical Facts
1. Approximate date condition commenced: **04/15/2026**
2. Probable duration of condition: **8–12 weeks**
3. Inpatient admission: ☒ Yes — admitted 04/15/2026, discharged 04/18/2026
4. Diagnosis: **L4–L5 disc herniation with left-sided radiculopathy (ICD-10 M51.16)**
5. Brief medical facts:
   Patient presented with acute onset severe low back pain radiating to the left lower extremity with numbness and 4/5 weakness in left dorsiflexion. MRI lumbar spine (04/15/2026) confirmed a large left paracentral disc herniation at L4–L5 with nerve root compression. Underwent L4–L5 microdiscectomy on 04/17/2026 with an uncomplicated post-operative course. Currently in recovery phase requiring physical therapy 3×/week, activity restrictions (no lifting > 10 lbs, no prolonged standing/sitting > 30 min), and scheduled pain management follow-up.

### Part B — Amount of Leave Needed
1. Continuous absence: ☒ Yes — **8 weeks (04/15/2026 – 06/10/2026)**
2. Reduced schedule: ☒ Yes — After initial 8 weeks, 4 weeks of modified duty: 4 hours/day, no lifting > 20 lbs, gradual return to full duty by **07/08/2026**
3. Follow-up: ☒ Yes — surgeon 1×/week; PT 3×/week × 6 weeks, then 2×/week × 4 weeks

---

**Signature of Health Care Provider:** Robert M. Smith, MD  **Date:** 04/20/2026
`,

  "wh-380-f": `# Certification of Health Care Provider for Family Member's Serious Health Condition
**Form WH-380-F · U.S. Department of Labor**

---

## SECTION I — Employer
- **Employee:** Maria S. Alvarez
- **Job Title:** Senior Accountant
- **Family Member:** Carlos R. Alvarez (father), age 74
- **Relationship:** Parent

## SECTION II — Health Care Provider
- **Provider:** Anita K. Brennan, MD — Geriatric Medicine
- **Practice:** Riverside Geriatric Associates, 88 Elm St., Riverside, CA 92501
- **Phone:** (951) 555-0177 · **NPI:** 2233445566

### Medical Facts
- **Diagnosis:** Acute ischemic stroke (left MCA, I63.512); dysphagia; hemiparesis right side.
- **Onset:** 03/02/2026; admitted Riverside Community Hospital 03/02–03/14/2026; discharged to acute inpatient rehab.
- **Treatment regimen:** Daily PT/OT/SLT, BP control (amlodipine 10 mg, atorvastatin 40 mg, aspirin 81 mg, apixaban 5 mg BID), aspiration precautions, fall precautions.

### Care the Employee Will Provide
Transportation to rehab and follow-up appointments (3–4×/week), assistance with ADLs, medication administration, meal preparation per dysphagia diet, supervision during transfers (fall risk), emotional support, and care coordination with home health.

### Leave Requested
- Continuous: 03/15/2026 – 05/15/2026 (8 weeks)
- Then intermittent: up to 2 days/week for 8 additional weeks for follow-up appointments and care needs.

---

**Provider Signature:** Anita K. Brennan, MD  **Date:** 03/16/2026
`,

  "wh-381": `# Notice of Eligibility & Rights and Responsibilities (FMLA)
**Form WH-381 · U.S. Department of Labor**

---

**To:** Jane A. Doe, RN
**From:** Springfield Memorial Hospital · Human Resources
**Date:** 04/16/2026

## Part A — Notice of Eligibility
Your request for FMLA leave commencing **04/15/2026** has been reviewed.

☒ **You ARE eligible for FMLA leave.** You have worked for this employer for at least 12 months, have at least 1,250 hours of service in the prior 12-month period, and work at a worksite with 50+ employees within 75 miles.

You have **480 hours (12 weeks)** of FMLA leave available in the current 12-month rolling period.

## Part B — Rights & Responsibilities
- Maintenance of group health insurance during leave on the same terms as if working.
- Restoration to the same or equivalent position upon return.
- Required to provide certification (WH-380-E) within 15 calendar days.
- May be required to provide fitness-for-duty certification before returning.
- May substitute accrued paid leave (PTO, sick) concurrently with FMLA.

**HR Contact:** Patricia Lin, SHRM-CP — (217) 555-0188 · plin@springfieldmemorial.org
`,

  "wh-382": `# FMLA Designation Notice
**Form WH-382 · U.S. Department of Labor**

---

**Employee:** Jane A. Doe, RN
**Date:** 04/22/2026

☒ Your FMLA leave request is **APPROVED**.

| Field | Value |
|---|---|
| Leave start | 04/15/2026 |
| Anticipated leave end | 06/10/2026 |
| Type | Continuous, employee's own serious health condition |
| Hours designated | 320 hours of available 480 |
| Paid leave substitution | 80 hrs PTO + 80 hrs sick concurrent |
| Fitness-for-duty required to return | Yes |
| Health insurance | Maintained; employee share auto-deducted from PTO payout |

**HR Authorization:** Patricia Lin, SHRM-CP — 04/22/2026
`,

  "wh-384": `# Certification of Qualifying Exigency for Military Family Leave
**Form WH-384 · U.S. Department of Labor**

---

- **Employee:** Sarah J. Mitchell · **Employer:** Capital Logistics, Inc.
- **Covered Servicemember:** Sgt. David T. Mitchell, U.S. Army (spouse)
- **Active Duty Orders:** Deployment to Republic of Korea, 06/01/2026 – 05/31/2027 (Title 10 USC § 12302)

### Qualifying Exigency
☒ **Short-notice deployment** — orders received 05/15/2026 with reporting date 06/01/2026.
☒ **Military events & related activities** — pre-deployment briefing 05/22/2026, family readiness group meeting 05/24/2026.
☒ **Childcare and school activities** — arranging childcare for two minor children (ages 6 and 9), enrollment in after-school program.
☒ **Financial and legal arrangements** — execution of power of attorney, will update, banking/SCRA matters.

### Leave Requested
- 05/20/2026 – 06/05/2026 (12 business days)
- Documentation attached: copy of military orders, FRG meeting notice.

**Signature:** Sarah J. Mitchell — 05/18/2026
`,

  "wh-385": `# Certification for Serious Injury or Illness of a Current Servicemember
**Form WH-385 · U.S. Department of Labor**

---

- **Servicemember:** SSgt. Marcus L. Hayes, USMC
- **Caregiver:** Linda R. Hayes (mother)
- **Provider:** LCDR Emily Carter, MD — Naval Medical Center San Diego
- **Address:** 34800 Bob Wilson Dr., San Diego, CA 92134

### Medical Facts
- **Condition:** Polytrauma from IED blast — penetrating TBI, bilateral lower-extremity amputations (below knee R, above knee L), partial hearing loss.
- **Date Incurred:** Line-of-duty injury, Helmand Province, 02/12/2026.
- **Treatment:** Stabilized at Role 3 Kandahar; transferred via Landstuhl to NMC San Diego 02/18/2026; ongoing wound care, prosthetic fitting, cognitive rehabilitation, audiology, mental health support.
- **Estimated duration of treatment:** ≥ 12 months.

### Caregiver Care Needed
24-hour assistance with mobility, transfers, wound care, transportation to 4–6 appointments/week, medication management, psychological support, coordination with case manager.

**Provider:** Emily Carter, MD, LCDR USN — 03/05/2026
`,

  "wh-385-v": `# Certification for Serious Injury or Illness of a Veteran
**Form WH-385-V · U.S. Department of Labor**

---

- **Veteran:** SFC (Ret.) James W. Holloway, U.S. Army (separated 11/2023)
- **Caregiver:** Rebecca A. Holloway (spouse)
- **VA Treating Provider:** Dr. Aaron S. Cole, MD — VA Tampa Polytrauma Center
- **Address:** 13000 Bruce B. Downs Blvd., Tampa, FL 33612 · **NPI:** 3344556677

### Service-Connected Condition Aggravated/Manifested
- Combat-related TBI (initial OEF 2010), now with progressive post-concussive syndrome.
- Severe PTSD with current GAF 45.
- Chronic lumbar radiculopathy (service-connected 40%).
- New: cervical myelopathy requiring C5–C6 ACDF (surgery 04/02/2026).

### Care Required
Continuous 12 weeks post-operative care including transportation to 12 scheduled VA appointments, medication administration (oxycodone, gabapentin, sertraline, prazosin), supervision for fall risk, wound care, emotional/behavioral support during PTSD exacerbations.

**Provider:** Aaron S. Cole, MD — 04/05/2026
`,

  // ============================================================
  // SOCIAL SECURITY
  // ============================================================
  "ssa-16": `# Application for Disability Insurance Benefits
**Form SSA-16 · Social Security Administration**

---

**Claimant:** Jane A. Doe
**SSN:** XXX-XX-1234 · **DOB:** 03/12/1968 · **Sex:** Female
**Marital Status:** Married — to John P. Doe (SSN XXX-XX-5678)
**Address:** 456 Oak Street, Springfield, IL 62704
**Phone:** (217) 555-0456

### Work History
- Last Employer: Springfield Memorial Hospital — Registered Nurse, 2002–02/01/2025
- Date last worked: **02/01/2025**
- Reason work stopped: Inability to perform essential job duties due to medical conditions.

### Medical Conditions Preventing Work
1. Congestive heart failure, HFrEF (EF 25%) — diagnosed 01/2024
2. Type 2 diabetes mellitus with diabetic nephropathy (CKD Stage 3b)
3. Major depressive disorder, recurrent, severe
4. Peripheral neuropathy, bilateral lower extremities
5. Chronic low back pain, degenerative disc disease

I authorize SSA to obtain all medical and vocational records necessary to evaluate this claim.

**Signature:** Jane A. Doe — 03/15/2026
`,

  "ssa-3368": `# Disability Report — Adult
**Form SSA-3368 · Social Security Administration**

---

**Claimant:** Jane A. Doe · **SSN:** XXX-XX-1234 · **DOB:** 03/12/1968
**Height:** 5′4″ · **Weight:** 172 lbs

### 1. Conditions limiting ability to work
- Congestive heart failure (HFrEF, EF 25%) — 01/2024
- Type 2 DM with diabetic nephropathy (CKD Stage 3b, GFR 38) — 2010
- Major Depressive Disorder, recurrent, severe — 2019
- Peripheral neuropathy, bilateral LE — 2022
- Chronic low back pain, DDD — 2018

### 2. Onset & Worsening
First bothered: 01/2024 (CHF onset). Unable to work since **02/01/2025**.
☒ Conditions have worsened: NYHA II → III despite optimal therapy; two CHF admissions (08/2024, 12/2024); CKD progression 3a → 3b; depression worsened.

### 3. Treating Providers
| Provider | Specialty | Dates | MRN | Address | Phone |
|---|---|---|---|---|---|
| Dr. Sarah Chen | Cardiology | 01/2024–present | HC-44521 | 500 Heart Center Blvd, Springfield IL | (217) 555-0200 |
| Dr. Robert Smith | Internal Medicine | 2010–present | IM-78832 | 1200 Medical Center Dr, Springfield IL | (217) 555-0142 |
| Dr. Lisa Park | Psychiatry | 2019–present | BH-11234 | 800 Behavioral Health Way, Springfield IL | (217) 555-0300 |
| Springfield Memorial Hospital | Inpatient | 08/2024, 12/2024 | MRN 9988776 | 1500 N. 5th St, Springfield IL | (217) 555-0100 |

### 4. Current Medications
| Medication | Dose | Prescriber | Indication |
|---|---|---|---|
| Sacubitril/valsartan (Entresto) | 97/103 mg BID | Chen | HFrEF |
| Carvedilol | 25 mg BID | Chen | HFrEF |
| Dapagliflozin | 10 mg daily | Chen / Smith | HF / DM / CKD |
| Furosemide | 40 mg BID | Chen | Volume |
| Spironolactone | 25 mg daily | Chen | HFrEF |
| Metformin | 500 mg BID | Smith | DM2 |
| Insulin glargine | 20 u qHS | Smith | DM2 |
| Sertraline | 200 mg daily | Park | MDD |
| Gabapentin | 300 mg TID | Smith | Neuropathy |

### 5. Functional Limitations (self-report)
- Cannot walk > 1 block without dyspnea
- Cannot climb 1 flight of stairs without resting
- Cannot lift > 10 lbs
- Requires rest after 15–20 min of any activity
- Concentration impaired by fatigue and depression
- LE numbness — balance problems, two falls in past 6 months

**Signed:** Jane A. Doe — 03/15/2026
`,

  "ssa-3441": `# Disability Report — Appeal
**Form SSA-3441 · Social Security Administration**

---

**Claimant:** Jane A. Doe · SSN XXX-XX-1234
**Date of Reconsideration Request:** 06/12/2026
**Initial Decision Date:** 05/20/2026

### Changes since last report
- New CHF admission 05/28/2026 — 4-day stay, IV diuresis, restarted on hydralazine/isosorbide.
- New diagnosis: paroxysmal atrial fibrillation — started apixaban 5 mg BID.
- Renal function declined: eGFR 38 → 30; nephrology referral made.
- Suicidal ideation with plan 06/05/2026, 72-hour hold at Memorial Behavioral Health; sertraline increased to 200 mg, mirtazapine 15 mg added.

### New providers
- Dr. Marcus Reed — Nephrology — first visit 06/10/2026.
- Memorial Behavioral Health (inpatient psych) — 06/05–06/08/2026.

### New medications
Apixaban 5 mg BID, mirtazapine 15 mg qHS, hydralazine 25 mg TID, isosorbide dinitrate 20 mg TID.

**Signed:** Jane A. Doe — 06/12/2026
`,

  "ssa-827": `# Authorization to Disclose Information to the Social Security Administration
**Form SSA-827**

---

**Claimant:** Jane A. Doe · DOB 03/12/1968 · SSN XXX-XX-1234

I authorize the following sources to release ALL my records to SSA and the State Disability Determination Services:
- All medical sources (hospitals, clinics, labs, psychologists)
- Educational sources
- Employers and other agencies

Records to include: medical, psychological, psychiatric, substance use, HIV/AIDS, genetic testing, drug/alcohol treatment, sexually transmitted infections — covered under 42 CFR Part 2 and 45 CFR.

This authorization expires 12 months from date of signing.

**Signature:** Jane A. Doe · **Date:** 03/15/2026
`,

  "ssa-4814": `# Medical Report on Adult with Allegation of HIV Infection
**Form SSA-4814 · Social Security Administration**

---

**Patient:** Daniel R. Foster · DOB 08/14/1972 · SSN XXX-XX-9012
**Reporting Provider:** Dr. Priya Sharma, MD — Infectious Disease
**NPI:** 5566778899 · Clinic: Riverbend ID Associates, 200 Wellness Way, Atlanta, GA 30303

### HIV Diagnosis
- Date confirmed: 06/2008 (Western blot positive)
- Nadir CD4: 122 cells/µL (2012)
- Current CD4: 380 cells/µL (04/2026)
- Viral load: < 20 copies/mL (suppressed × 6 yrs)

### AIDS-Defining or Severe Conditions
- Pneumocystis jirovecii pneumonia (2012) — hospitalized 14 days, ICU 5 days
- HIV-associated neurocognitive disorder, moderate (HAND) — neuropsych testing 02/2026
- Recurrent oral candidiasis, last episode 03/2026
- HIV-associated nephropathy — eGFR 42

### Current ART
Bictegravir/emtricitabine/tenofovir alafenamide (Biktarvy) daily — adherent.

### Functional Impact
Chronic fatigue, cognitive slowing, difficulty with complex tasks. Unable to sustain employment since 2022.

**Signed:** Priya Sharma, MD — 05/02/2026
`,

  "ssa-1151": `# Consultative Examination Report (Physical)
**Form SSA-1151**

---

**Claimant:** Robert E. Johnson · DOB 11/22/1965
**Date of Exam:** 04/18/2026
**Examiner:** Dr. Helen K. Liu, MD — Internal Medicine · NPI 6677889900

### History
58-year-old male alleging disability from COPD (GOLD Stage III), chronic right knee OA s/p ACL repair 1995, depression. Smokes ½ ppd × 35 yrs.

### Vitals & Exam
- BP 142/88, HR 92, RR 22, SpO₂ 91% room air, BMI 31
- Pulmonary: decreased breath sounds bilaterally, prolonged expiratory phase, scattered wheezes
- MSK: right knee — crepitus, varus deformity, ROM 5°–95°, antalgic gait, positive McMurray
- Spirometry: FEV₁ 1.42 L (45% predicted), FEV₁/FVC 0.58

### Functional Capacity
- Sit: 6 hrs/8-hr day with breaks
- Stand/walk: 2 hrs/8-hr day
- Lift/carry: 10 lbs frequent, 20 lbs occasional
- Postural: occasional stoop/crouch; never kneel
- Environmental: avoid concentrated fumes/dust

**Signed:** Helen K. Liu, MD — 04/18/2026
`,

  "ssa-1152": `# Consultative Examination Report (Mental)
**Form SSA-1152**

---

**Claimant:** Amanda T. Reyes · DOB 09/04/1988
**Date of Exam:** 05/05/2026
**Examiner:** Dr. Marcus J. Bell, PsyD — Clinical Psychology · NPI 7788990011

### Presenting Complaint
"I can't be around people anymore and I can't sleep."

### History
35-year-old female with PTSD secondary to domestic violence (2017–2021), recurrent MDD, generalized anxiety disorder, alcohol use disorder in early remission (90 days). Two prior psychiatric hospitalizations (2022, 2024). Currently on sertraline 150 mg, prazosin 4 mg qHS, weekly EMDR therapy.

### Mental Status Examination
- Appearance: disheveled, poor eye contact
- Behavior: tearful, psychomotor slowed
- Speech: soft, slow but coherent
- Mood: "empty" · Affect: constricted, dysphoric
- Thought process: linear, no FOI
- Thought content: passive SI without plan/intent; no HI; no AH/VH; no delusions
- Cognition: A&O × 3; MMSE 27/30 (lost points on serial 7s and recall)
- Insight/judgment: fair

### DSM-5 Diagnoses
PTSD (F43.10), MDD recurrent severe (F33.2), GAD (F41.1), AUD in early remission (F10.21)

### Functional Assessment
Marked limitation in ability to interact with others, sustain concentration > 1 hour, adapt to change. Moderate limitation in understanding/remembering. GAF estimate 45.

**Signed:** Marcus J. Bell, PsyD — 05/05/2026
`,

  "ssa-454": `# Continuing Disability Review Report
**Form SSA-454**

---

**Beneficiary:** Jane A. Doe · SSN XXX-XX-1234
**Reporting Period:** 03/2024 – 03/2026

### Medical updates
- CHF: 2 admissions in review period; current EF 25% (echo 02/2026); NYHA III.
- CKD: progressed Stage 3a → 3b → 3 (eGFR 30 in 06/2026).
- New paroxysmal AF on apixaban.
- Psychiatric: 72-hour hold 06/2026 for SI.

### Treatment / Provider Contacts
Cardiology q3 months · IM q3 months · Psychiatry monthly · Nephrology new (06/2026) · Inpatient psychiatry (06/2026).

### Activities of Daily Living
Unchanged or worsened. Spouse assists with bathing, meal prep, transportation. No work attempted.

**Signed:** Jane A. Doe — 06/15/2026
`,

  "ssa-561": `# Request for Reconsideration
**Form SSA-561**

---

**Claimant:** Jane A. Doe · SSN XXX-XX-1234
**Decision being appealed:** Initial disability denial dated 05/20/2026

### Reason for disagreement
The decision states my conditions do not prevent substantial gainful activity. This is incorrect because:
1. NYHA Class III CHF with EF 25% prevents standing > 5 minutes or walking > 1 block.
2. Two CHF hospitalizations in past 8 months document ongoing decompensation.
3. New diagnosis of paroxysmal atrial fibrillation requires anticoagulation and adds fall risk.
4. Psychiatric hospitalization 06/05–06/08/2026 for suicidal ideation with plan demonstrates ongoing severe MDD.
5. Cardiology and psychiatry both attest in writing to inability to sustain employment.

Updated medical evidence (CHF admission 05/2026, psychiatric admission 06/2026, new nephrology consult) was not available at time of initial determination and is attached.

**Signed:** Jane A. Doe — 06/12/2026
`,

  // ============================================================
  // WORKERS' COMPENSATION
  // ============================================================
  "ca-16": `# Authorization for Examination and/or Treatment
**Form CA-16 · Federal Employees' Compensation Act**

---

- **Employee:** John B. Martinez · SSN XXX-XX-3344
- **Employer:** U.S. Postal Service, Springfield Distribution Center
- **Date / Time of Injury:** 03/05/2026, 10:30 AM
- **Description:** Lifting 70-lb mail container — sudden right shoulder pop, severe pain, inability to raise right arm.

### Authorization
The above employee is authorized to obtain medical examination and any necessary treatment from **Dr. Amanda K. Williams, MD — Orthopedic Surgery, 2200 Bone & Joint Pkwy, Springfield, IL 62704** for the work-related injury described above. Authorization is valid for **60 days** from the date of injury.

**Authorizing Official:** Karen M. Stevens, Postmaster — 03/05/2026
**OWCP Claim #:** OWCP-2026-0045678
`,

  "ca-17": `# Duty Status Report
**Form CA-17 · OWCP**

---

- **Employee:** John B. Martinez · Claim # OWCP-2026-0045678
- **Date of Injury:** 03/05/2026
- **Diagnosis:** Right rotator cuff tear, complete supraspinatus (M75.110)
- **Date of Examination:** 04/15/2026

### Physical Limitations (per current exam)
| Activity | Limit |
|---|---|
| Continuous standing | 4 hrs |
| Lifting (right arm) | 5 lbs |
| Lifting (left arm only) | 25 lbs |
| Reaching above shoulder (R) | Not permitted |
| Pushing/pulling (R) | Not permitted |
| Driving | Permitted |

### Work Status
☒ Modified duty as of 04/15/2026
- 4 hrs/day, sedentary–light only
- No right-arm overhead work
- No lifting > 5 lbs with right arm
- Re-evaluate 05/15/2026

**Provider:** Amanda K. Williams, MD — 04/15/2026
`,

  "ca-20": `# Attending Physician's Report
**Form CA-20 · U.S. Department of Labor — OWCP**

---

- **Employee:** John B. Martinez · DOI 03/05/2026 · Claim OWCP-2026-0045678
- **Employer:** USPS — Springfield Distribution Center
- **Occupation:** Mail Handler
- **Provider:** Amanda K. Williams, MD · Orthopedic Surgery · NPI 9876543210
- **Practice:** 2200 Bone & Joint Pkwy, Springfield, IL 62704 · (217) 555-0250

### 1. History of Injury
On 03/05/2026 at approximately 10:30 AM, while lifting a 70-lb mail container from a conveyor belt, the patient felt a sudden "pop" in his right shoulder followed by immediate severe pain and inability to raise his right arm above shoulder level. He reported the injury to his supervisor immediately and was sent to employee health, then referred here.

### 2. Diagnoses (ICD-10)
- Right rotator cuff tear, complete, supraspinatus (M75.110)
- Right shoulder impingement syndrome (M75.110)
- Right shoulder bursitis (M75.510)

### 3. Objective Findings
- Right shoulder: moderate swelling, tenderness over greater tuberosity
- AROM: forward flexion 90° (180°), abduction 80° (180°), ER 20° (90°)
- Positive Neer impingement, Hawkins-Kennedy, drop-arm
- Strength: supraspinatus 3/5; infraspinatus 4/5; subscapularis 5/5
- MRI 03/08/2026: full-thickness supraspinatus tear, 2.5 cm retraction; moderate subacromial bursitis; no labral tear

### 4. Causal Relationship
☒ Yes — Mechanism (heavy lifting) is consistent with acute rotator cuff tear; no prior right-shoulder history; direct temporal relationship.

### 5. Treatment Plan
- Arthroscopic rotator cuff repair, scheduled 03/25/2026
- Post-op sling × 6 weeks → PT 3×/week × 12 weeks
- Meds: acetaminophen 1000 mg TID; tramadol 50 mg q6h PRN (short course); ice / elevation

### 6. Work Status
☒ Totally disabled from 03/05/2026
- Estimated return to modified duty: 05/15/2026 (light duty, no right-arm work above shoulder, no lifting > 5 lbs R)
- Estimated return to full duty: 09/01/2026

### 7. Next Appointment
03/25/2026 (pre-operative)

**Signature:** Amanda K. Williams, MD · 03/10/2026
`,

  "ca-1": `# Notice of Traumatic Injury (Federal)
**Form CA-1 · OWCP**

---

- **Employee:** John B. Martinez · SSN XXX-XX-3344
- **Employing Agency:** USPS — Springfield Distribution Center
- **Date/Time of Injury:** 03/05/2026 at 10:30 AM
- **Where occurred:** Conveyor line 4, parcel sorting area
- **What happened:** Lifting 70-lb mail container; sudden "pop" right shoulder, severe pain, unable to raise right arm.
- **Nature of injury:** Right rotator cuff tear
- **Witness:** Maria L. Gomez (co-worker)

**Employee signature:** John B. Martinez — 03/05/2026
**Supervisor signature:** Daniel R. Foster, MDO — 03/05/2026
`,

  "ca-2": `# Notice of Occupational Disease (Federal)
**Form CA-2 · OWCP**

---

- **Employee:** Carla F. Webb · SSN XXX-XX-2211
- **Agency:** Department of Veterans Affairs — Tampa VAMC, Sterile Processing
- **Date first aware of disease:** 02/2026
- **Disease:** Latex hypersensitivity with occupational contact dermatitis and asthma (J45.998, L23.5)
- **Exposure:** Routine use of latex gloves and processing of latex-containing surgical instruments × 18 years; daily airborne particulate.
- **Symptoms:** Progressive hand dermatitis, urticaria, wheezing during shift, post-shift cough. PEFR drop > 20% during shift documented 03/2026.
- **Treatment to date:** Allergy/immunology referral 03/2026; RAST positive Hev b 5, 6.01; daily fluticasone/salmeterol; topical clobetasol.

**Employee:** Carla F. Webb — 03/18/2026
**Supervisor:** Anita Park, RN — 03/18/2026
`,

  "osha-300": `# OSHA Form 300 — Log of Work-Related Injuries and Illnesses
**Establishment:** Springfield Distribution Center, USPS · Year 2026

| Case # | Employee | Job Title | Date | Where | Description | Outcome | Days Away | Days Restricted | Type |
|---|---|---|---|---|---|---|---|---|---|
| 2026-014 | J. Martinez | Mail Handler | 03/05/2026 | Conveyor line 4 | Lifted 70-lb container; right shoulder rotator cuff tear | Days away + restricted | 60 | 45 | Injury |
| 2026-015 | M. Gomez | Mail Handler | 03/12/2026 | Loading dock B | Slip/fall on wet floor; left wrist fracture | Days away | 28 | 0 | Injury |
| 2026-016 | C. Webb | SPD Tech | 03/18/2026 | OR 3 instrument decon | Occupational latex asthma | Restricted | 0 | 30 | Illness |
| 2026-017 | T. Nguyen | Custodian | 04/02/2026 | Restroom 2 | Chemical splash, conjunctivitis | Other recordable | 0 | 0 | Injury |

**Recordkeeper:** Patricia Lin, SHRM-CP — Updated 04/30/2026
`,

  "osha-301": `# OSHA Form 301 — Injury and Illness Incident Report
**Case 2026-014 · Establishment:** Springfield Distribution Center, USPS

---

- **Employee:** John B. Martinez · DOB 06/14/1979 · M
- **Job title:** Mail Handler · Date hired 04/10/2014
- **Address:** 880 Pine Ave., Springfield, IL 62701

### Incident
- Date: 03/05/2026 · Time: 10:30 AM
- Began work that day: 06:00 AM
- Location: Conveyor line 4, parcel sort
- What employee was doing: Lifting 70-lb container from conveyor to roll cage.
- What happened: Felt sudden pop in right shoulder during lift; severe pain; unable to raise arm.
- Injury: Full-thickness right supraspinatus tear (M75.110)
- Object/substance directly harmed: Heavy parcel
- Days away/restricted: 60 days away, 45 days restricted (estimated)

### Treatment
Emergency referral to Orthopedics (Dr. Williams). MRI 03/08/2026. Surgery scheduled 03/25/2026.

**Completed by:** Patricia Lin, SHRM-CP — 03/06/2026
`,

  "froi": `# First Report of Injury (Illinois)
**Illinois Workers' Compensation Commission**

---

- **Employer:** Lakeshore Construction, LLC · FEIN 36-1234567
- **Employee:** Anthony R. Castro · DOB 04/12/1986 · Hired 08/2019
- **Occupation:** Steel Erector · Wage: $38/hr
- **Date / Time of Injury:** 05/14/2026, 2:15 PM
- **Location:** 425 W. Randolph St., Chicago, IL — 8th floor structural deck
- **Cause of injury:** Fall from scaffolding (~6 ft) to deck below
- **Nature of injury:** Closed comminuted right tibial plateau fracture (S82.141A); mild concussion (S06.0X0A)
- **Body parts:** Right lower leg; head
- **Initial treatment:** Northwestern Memorial ED — splint, CT head negative, ortho consult; surgery scheduled 05/16/2026 (ORIF).
- **Witnesses:** R. Velasquez, T. O'Brien
- **Lost time:** Began 05/14/2026; anticipated return 09/2026 modified, 12/2026 full.

**Reported by:** Megan Strauss, Safety Director · 05/14/2026
**State filing:** Illinois WC Commission · IWCC Claim # 2026-FROI-009921
`,

  // ============================================================
  // VA & MILITARY
  // ============================================================
  "va-21-526ez": `# Application for Disability Compensation and Related Compensation Benefits
**VA Form 21-526EZ**

---

- **Veteran:** Michael R. Thompson · SSN XXX-XX-5678 · DOB 07/22/1985
- **Branch / Dates of Service:** U.S. Army · 06/2004 – 08/2012
- **Discharge:** Honorable
- **Deployments:** OIF (Iraq) 2006–2007 · OEF (Afghanistan) 2009–2010
- **Address:** 712 Maple Ridge Ln., Killeen, TX 76541 · (254) 555-0140

### Claimed Service-Connected Conditions
| # | Condition | Date Began | Service Connection |
|---|---|---|---|
| 1 | PTSD | 2007 | IED attack — Fallujah, 2006 (Purple Heart) |
| 2 | TBI, mild | 2006 | Same IED event |
| 3 | Tinnitus | 2008 | Blast exposure |
| 4 | Lumbar DDD | 2011 | Repetitive load-bearing as 11B |
| 5 | Right knee chondromalacia | 2010 | Foot-patrol repetitive injury |

### Treatment
VA Mental Health Clinic (Temple, TX) since 2013 — sertraline, prazosin, CPT.
VA Audiology — hearing aids issued 2018.
VA Spine Clinic — MRI L4-5 disc bulge.

### Claim Type
☒ Standard claim · ☐ Fully developed · Buddy statements attached (3).

**Signature:** Michael R. Thompson — 05/01/2026
`,

  "va-21-0960": `# Disability Benefits Questionnaire: Review Post-Traumatic Stress Disorder (PTSD)
**VA Form 21-0960P-3**

---

- **Veteran:** Michael R. Thompson · SSN XXX-XX-5678 · DOB 07/22/1985
- **Branch / Dates:** U.S. Army · 06/2004 – 08/2012
- **Deployments:** OIF (Iraq) 2006–2007 · OEF (Afghanistan) 2009–2010
- **Examiner:** Dr. Lisa M. Park, MD — Psychiatry
- **Date of Examination:** 05/10/2026

### 1. Diagnostic Summary
☒ Veteran HAS a DSM-5 diagnosis of PTSD.
Additional diagnoses: MDD, recurrent, moderate (F33.1); Alcohol Use Disorder, moderate, early remission (F10.20).

### 2. Stressor
Convoy struck by IED — Fallujah, Iraq, 2006. Two soldiers killed in his vehicle. Veteran sustained mild TBI and witnessed deaths of close friends.
- Related to: ☒ Combat ☒ Fear of hostile military activity
- Verified: ☒ Yes (service records, Purple Heart citation)

### 3. DSM-5 Criteria
- **A — Exposure:** ☒ Met (direct exposure)
- **B — Intrusion (≥1):** ☒ recurrent memories ☒ distressing dreams ☒ dissociative flashbacks (2–3×/mo) ☒ distress at cues
- **C — Avoidance (≥1):** ☒ avoids memories/feelings ☒ avoids external reminders (fireworks, crowds, driving)
- **D — Cognition/Mood (≥2):** ☒ negative beliefs ☒ self-blame ☒ persistent negative emotions ☒ diminished interest ☒ detachment
- **E — Arousal (≥2):** ☒ irritability/outbursts ☒ hypervigilance ☒ exaggerated startle ☒ insomnia/nightmares 4–5 nights/wk ☒ concentration difficulty
- **F — Duration:** ☒ > 1 month (since 2007)
- **G — Distress/Impairment:** ☒ Yes · **H — Not due to substance/medical:** ☒ Yes

### 4. Occupational/Social Impairment
☒ Deficiencies in MOST areas (work, family, judgment, mood).

### 5. Symptoms
Depressed mood, anxiety, suspiciousness, chronic sleep impairment, mild memory loss, difficulty maintaining work/social relationships, difficulty adapting to stress, passive SI (no plan/intent), hypervigilance, exaggerated startle.

### 6. Functional Impact
Unable to maintain employment > 6 months since 2018 (irritability, concentration, intolerance of crowded/noisy environments). Divorced 2020; limited contact with two children; largely isolated; engaged in VA treatment.

### 7. Current Treatment
Sertraline 200 mg daily · Prazosin 5 mg qHS · Individual CPT biweekly · VA peer support group weekly · 8 months sober.

### 8. Risk Assessment
- SI: passive ("family would be better off without him") · no plan/intent
- HI: denied
- Safety plan in place; VA Crisis Line 988-1 reviewed.

**Examiner:** Lisa M. Park, MD — 05/10/2026
`,

  "va-10-10ez": `# Application for Health Benefits
**VA Form 10-10EZ**

---

- **Veteran:** Diana K. Russell · SSN XXX-XX-7741 · DOB 02/19/1982
- **Branch / Dates:** U.S. Air Force · 09/2000 – 09/2008
- **Discharge:** Honorable · **MOS:** 4N0X1 (Aerospace Medical Service)
- **Service-connected disability rating:** 60% (combined)
- **Address:** 145 Lakeview Dr., Colorado Springs, CO 80917

### Income & Insurance
- Household income (2025): $58,400
- Marital status: Single
- Dependents: 1 (child age 11)
- Insurance: Tricare Reserve Select; Anthem (employer secondary)

### Health Needs
- Migraine without aura (service-connected 30%) — sumatriptan / topiramate
- Lumbar strain (10%) — PT
- PTSD (20%) — VA Tele-Mental Health
- Annual women's health, pap, mammography

**Signed:** Diana K. Russell · 04/12/2026
`,

  "dd-214": `# Certificate of Release or Discharge from Active Duty
**DD Form 214**

---

| Field | Value |
|---|---|
| Name | THOMPSON, MICHAEL R. |
| SSN | XXX-XX-5678 |
| Branch / Component | U.S. Army / Regular |
| Grade at separation | E-5 / Sergeant |
| Date entered active duty | 14 JUN 2004 |
| Separation date | 28 AUG 2012 |
| Net active service | 8 yrs 2 mos 14 days |
| Primary MOS | 11B30 — Infantryman |
| Decorations | Purple Heart; Army Commendation Medal (V); Combat Infantryman Badge; Iraq Campaign Medal w/ 2 stars; Afghanistan Campaign Medal w/ 1 star; GWOT Service Medal |
| Foreign service | Iraq (12 mo); Afghanistan (12 mo) |
| Character of service | Honorable |
| Separation authority | AR 635-200, Chap 4 |
| Reentry code | RE-1 |
| Narrative reason | Completion of required active service |

**Authenticating Officer:** CPT R. L. Harvey — 28 AUG 2012
`,

  "sf-86": `# Questionnaire for National Security Positions
**Standard Form 86 · OPM · for Top Secret / SCI eligibility**

---

- **Applicant:** Diana K. Russell · SSN XXX-XX-7741 · DOB 02/19/1982
- **Position:** Cybersecurity Engineer, Department of Defense (DoD)
- **Investigation requested:** Top Secret / SCI

### Section 13A — Employment Activities
2008–present: Multiple federal contractor positions (Northrop Grumman, Leidos, ManTech). No firings, no resignations under unfavorable circumstances.

### Section 21 — Psychological & Emotional Health
☒ Within the last 7 years, consulted with a health care professional regarding emotional/mental health condition.
- Treatment: PTSD related to deployment (service-connected). No court-ordered treatment.
- Provider: VA Tele-Mental Health Clinic (2018–present)
- Treatment does not impact ability to perform sensitive duties — confirmed by treating provider letter dated 02/12/2026.

### Section 22 — Police Record
☒ No arrests, charges, convictions in last 7 years.

### Section 23 — Illegal Use of Drugs and Drug Activity
☒ No illegal use of controlled substances in last 7 years.

### Section 24 — Use of Alcohol
☒ No alcohol-related treatment, counseling, or impact on work/legal issues in last 7 years.

### Section 26 — Financial Record
No bankruptcies, liens, repossessions, or delinquencies > 120 days.

### Section 27 — Use of Information Technology Systems
No unauthorized use, modification, or destruction.

**Applicant Certification:** Diana K. Russell — 04/30/2026
`,

  "sf-600": `# Chronological Record of Medical Care
**Standard Form 600 · Department of Defense**

---

- **Patient:** SGT THOMPSON, MICHAEL R. · SSN XXX-XX-5678
- **Date / Time:** 14 OCT 2010 / 09:20 L
- **Facility:** Role 3 MMU, Kandahar Airfield, Afghanistan

### S (Subjective)
SM presents s/p IED blast 12 OCT 2010 — loss of consciousness ~3 min, persistent HA, nausea, photophobia, difficulty concentrating. Denies focal weakness, vision change, vomiting today.

### O (Objective)
- VS: BP 128/78 · HR 84 · T 36.9 · SpO₂ 99%
- HEENT: small left frontal scalp laceration s/p closure (steri-strips intact); TM clear bilateral; no hemotympanum
- Neuro: A&O × 4 · CN II-XII intact · MRC 5/5 throughout · gait steady · MACE 22/30 (impaired delayed recall, concentration)

### A (Assessment)
- Concussion / mTBI, blast-induced (S06.0X0A) — symptomatic
- Closed scalp laceration, healing
- Acute combat stress reaction — not meeting PTSD criteria

### P (Plan)
- 7-day duty restriction (no deployments to combat ops, no weapon handling, no PT)
- Symptom rest; gradual return to activity per DoD mTBI protocol
- Daily F/U × 7 days; cognitive testing day 7
- Restricted from driving × 72 hours
- Acetaminophen 1000 mg PO q6h PRN

**Provider:** MAJ K. R. Donovan, MC, USA — 14 OCT 2010
`,

  "va-10-5345": `# Request for and Authorization to Release Health Information
**VA Form 10-5345**

---

- **Patient:** Michael R. Thompson · DOB 07/22/1985 · SSN XXX-XX-5678
- **VA Facility:** Central Texas Veterans Health Care System
- **Release To:** Disabled American Veterans (DAV) — National Service Office, Waco TX
- **Information to be released:**
  - All mental health treatment records 2013–present
  - All audiology records
  - All spine clinic records
  - Compensation & Pension exam reports
- **Purpose:** Support of VA disability claim filed 05/01/2026
- **Authorization expires:** 05/01/2027

**Signature:** Michael R. Thompson — 05/01/2026
`,

  // ============================================================
  // CMS / BILLING
  // ============================================================
  "cms-1500": `# Health Insurance Claim Form (Professional)
**Form CMS-1500 · 02/12 version**

---

| # | Field | Value |
|---|---|---|
| 1 | Type of Insurance | ☒ Medicare |
| 1a | Insured's ID | 1EG4-TE5-MK72 |
| 2 | Patient Name | DOE, JANE A |
| 3 | DOB / Sex | 03/12/1968 / F |
| 5 | Address | 456 Oak Street, Springfield, IL 62704 |
| 6 | Relationship to Insured | ☒ Self |
| 9 | Other Insured | N/A |
| 11 | Group # | N/A (Medicare) |
| 12 | Patient Signature | Signature on File |
| 14 | Date of Current Illness | 04/15/2026 |
| 17 | Referring Provider | Robert M. Smith, MD |
| 17b | Referring NPI | 1234567890 |
| 21 | ICD-10 | A: I50.22 · B: E11.65 · C: N18.32 · D: F33.1 |
| 24A | Date of Service | 05/01/2026 |
| 24B | Place of Service | 11 (Office) |
| 24D | CPT/HCPCS | 99215 (Office visit, high complexity) |
| 24E | Dx pointer | A,B,C |
| 24F | Charges | $250.00 |
| 24J | Rendering NPI | 9876543210 |
| 25 | Federal Tax ID | 37-XXXXXXX |
| 26 | Patient Account # | PT-44521 |
| 31 | Physician Signature | Sarah Chen, MD |
| 32 | Service Facility | Springfield Cardiology Associates, 500 Heart Center Blvd, Springfield IL 62704 |
| 33 | Billing Provider | Same as Field 32 |
`,

  "cms-1450": `# Uniform Bill — Institutional Claim
**Form CMS-1450 (UB-04)**

---

- **Patient:** Doe, Jane A. · MRN 9988776 · DOB 03/12/1968 · F
- **Insurance:** Medicare Part A · 1EG4-TE5-MK72
- **Facility:** Springfield Memorial Hospital · NPI 1122334455 · TIN 37-XXXXXXX
- **Type of Bill:** 111 (inpatient, admit through discharge)
- **Admit Date:** 05/28/2026 · 03:14 · ED via ambulance
- **Discharge Date:** 06/01/2026 · 11:00 · Discharged home with home health
- **Admitting Dx:** I50.23 (Acute on chronic systolic CHF)
- **Principal Dx:** I50.23 · **Secondary:** E11.65, N18.32, F33.1, I48.0
- **Principal Procedure:** 5A1D60Z — Performance of urinary filtration

### Revenue Codes
| Rev | Description | HCPCS | Units | Charges |
|---|---|---|---|---|
| 0120 | Room & Board · Semi-private | — | 4 | $9,600.00 |
| 0250 | Pharmacy | — | 38 | $3,420.50 |
| 0300 | Laboratory | — | 22 | $2,180.00 |
| 0320 | Radiology / Echo | 93306 | 1 | $850.00 |
| 0450 | Emergency Room | 99285 | 1 | $1,250.00 |
| 0636 | Drugs requiring detailed coding | J1655 | 4 | $620.00 |
| **Total** | | | | **$17,920.50** |

**MS-DRG:** 291 (Heart failure & shock w/ MCC)
`,

  "cms-460": `# Medicare Participating Physician or Supplier Agreement
**Form CMS-460**

---

- **Provider:** Sarah Chen, MD · NPI 9876543210
- **Group:** Springfield Cardiology Associates · TIN 37-XXXXXXX
- **PTAN:** IL-12345
- **Address:** 500 Heart Center Blvd, Springfield, IL 62704

The undersigned hereby enters into an agreement with the Medicare program to accept assignment of the Medicare Part B payment for all covered services furnished to Medicare beneficiaries, effective **07/01/2026** through end of the calendar year and each year thereafter until terminated.

**Signature:** Sarah Chen, MD — 06/15/2026
`,

  "cms-855i": `# Medicare Enrollment Application — Individual
**Form CMS-855I**

---

- **Applicant:** Sarah Chen, MD · NPI 9876543210 · SSN XXX-XX-3456 · DOB 05/30/1976
- **Reason for application:** ☒ Initial enrollment
- **Specialty / Taxonomy:** Cardiovascular Disease (207RC0000X)
- **Education:** MD, University of Michigan 2002 · IM Residency Northwestern 2005 · Cardiology Fellowship Cleveland Clinic 2008
- **Board Certification:** ABIM — Cardiovascular Disease (active through 12/2030)
- **State Licenses:** IL #036-1234567 (active) · MO #2010012345 (active)
- **DEA #:** BC1234567
- **Practice Location:** Springfield Cardiology Associates, 500 Heart Center Blvd, Springfield IL 62704
- **EFT (CMS-588):** ☒ Attached
- **Authorized Official:** Linda Park, MBA, Group Administrator

**Signature:** Sarah Chen, MD — 06/15/2026
`,

  "cms-484": `# Certificate of Medical Necessity — Oxygen
**Form CMS-484**

---

- **Patient:** Walter J. Hughes · DOB 11/14/1948 · M · Medicare ID 8WX2-DE9-PL51
- **Diagnosis:** COPD with chronic respiratory failure (J96.11), GOLD Stage IV
- **Testing Date:** 04/22/2026
- **PaO₂ on room air (rest):** 54 mmHg
- **SpO₂ on room air (rest):** 86%
- **Sleep oximetry:** ≥ 5 min < 88% over study
- **Continuous oxygen meets Medicare Group I criteria:** ☒ Yes

### Prescription
- Flow: **2 L/min nasal cannula at rest; 3 L/min with exertion; 2 L/min during sleep**
- Duration: **24 hours/day**
- Equipment: stationary concentrator + portable concentrator
- Recertification: 12 months

**Ordering Physician:** Helen K. Liu, MD · Pulmonology · NPI 6677889900 — 04/25/2026
`,

  "cms-846": `# Certificate of Medical Necessity — DME
**Form CMS-846/847 — Powered Mobility Device**

---

- **Patient:** Edith M. Carter · DOB 09/30/1939 · F · Medicare ID 3KL5-MN8-RT22
- **Diagnoses:** Severe osteoarthritis bilateral hips (M16.0); CHF NYHA III (I50.32); peripheral neuropathy (G62.9)
- **Mobility Limitation:** Unable to ambulate > 10 ft without rest; cannot transfer from sit to stand independently; manual wheelchair insufficient due to bilateral shoulder impingement.
- **DME requested:** Group 2 standard power wheelchair (K0822)
- **Home assessment:** ☒ Performed 05/01/2026 — doorways ≥ 32″, no thresholds, ramp installed.
- **Trial:** ☒ Patient demonstrated safe operation with PT 05/05/2026.

### Clinical Justification
Patient meets CMS coverage criteria for a Group 2 power wheelchair: mobility limitation significantly impairs ability to perform MRADLs in the home; less costly alternatives (cane, walker, manual wheelchair) have been tried and are inadequate; patient has sufficient cognitive/visual function to safely operate device.

**Ordering Provider:** Robert M. Smith, MD · IM · NPI 1234567890 — 05/06/2026
`,

  "cms-10106": `# Advance Beneficiary Notice of Noncoverage (ABN)
**Form CMS-R-131 (formerly CMS-10106)**

---

- **Patient:** Walter J. Hughes · Medicare ID 8WX2-DE9-PL51
- **Notifier:** Springfield Pulmonary Associates
- **Date issued:** 05/10/2026

### Item / Service Medicare May Not Pay For
**Lung volume reduction surgery evaluation — high-resolution CT chest with low-dose protocol, 6-minute walk test, and full cardiopulmonary exercise testing**

### Reason Medicare May Not Pay
Service may not meet Medicare's documented criteria for medical necessity at this stage of disease (post-bronchodilator FEV₁ 28%; current LVRS criteria require FEV₁ 20–45% with predominant upper-lobe emphysema). Pre-evaluation testing is being performed prior to formal candidacy determination.

### Estimated Cost
$1,840.00

### Patient Option Selected
☒ **OPTION 1:** I want the items/services listed. Bill Medicare. I will pay if Medicare denies.

**Patient Signature:** Walter J. Hughes — 05/10/2026
`,

  // ============================================================
  // PRIOR AUTHORIZATION
  // ============================================================
  "ama-pa": `# Prior Authorization Request
**AMA / AHIP Consensus Standard Form**

---

- **Date of Request:** 05/05/2026 · **Urgency:** ☒ Urgent (clinical deterioration without treatment)

### Patient
- Name: Jane A. Doe · DOB 03/12/1968 · Member ID MED-9988776
- Plan: BlueCross BlueShield of Illinois · Group GRP-44521
- Phone: (217) 555-0456

### Requesting Provider
- Sarah Chen, MD — Cardiology · NPI 9876543210 · TIN 37-XXXXXXX
- (217) 555-0200 · Fax (217) 555-0201

### Service Requested
- ☒ Procedure
- CPT 33285 — Insertion of subcutaneous cardiac rhythm monitor (implantable loop recorder)
- ICD-10: R55 (syncope); R00.1 (bradycardia); I49.9 (cardiac arrhythmia, unspecified)
- Planned date of service: 05/15/2026 · POS: Outpatient — Springfield Cardiology Associates

### Clinical Justification
58-year-old female with CHF (EF 25%) presenting with three episodes of unexplained syncope over 4 months (01, 03, 04 / 2026). Each episode sudden, no prodrome, < 1 minute, spontaneous recovery.
- ECG (04/28/2026): sinus bradycardia 48 bpm, 1° AV block (PR 240 ms), no ST changes
- 48-hour Holter (04/2026): sinus rhythm with intermittent sinus pauses up to 2.8 s, no sustained arrhythmia captured
- Echocardiogram (04/2026): EF 25%, no LVOT obstruction, no significant valvular disease
- Orthostatic vitals: negative · Carotid US: no significant stenosis · Neurology: unremarkable

Etiology of recurrent syncope unexplained. Given high-risk substrate (severely reduced EF) and concern for intermittent bradyarrhythmia or VT, continuous long-term monitoring with an ILR is medically necessary per ACC/AHA/HRS guidelines for unexplained recurrent syncope when initial evaluation is non-diagnostic.

### Prior Treatments Tried
☒ 48-hour Holter — non-diagnostic
☒ 30-day event monitor — patient unable to activate during loss of consciousness

### Documentation Attached
☒ Office notes (last 3 visits) · ECG · Holter · Echo · Neurology consult

**Signature:** Sarah Chen, MD — 05/05/2026
`,

  "ncpdp-pa": `# Electronic Prior Authorization — Pharmacy (NCPDP SCRIPT)
**Submitted via NCPDP ePA · Transaction ID: PA-20260512-0091**

---

- **Patient:** Daniel R. Foster · DOB 08/14/1972 · M · Member ID HUM-44551
- **Plan:** Humana Medicare Part D · PCN HUMRX
- **Prescriber:** Priya Sharma, MD · NPI 5566778899 · DEA BS1122334
- **Pharmacy:** CVS #4421, Atlanta GA · NCPDP ID 1099001

### Medication Requested
- Drug: **Lenacapavir (Sunlenca) 463.5 mg subcutaneous q6 months**
- NDC: 61958-2701-01
- Quantity: 2 syringes (one 6-month cycle)
- Days supply: 180 · Refills: 1

### Diagnosis
- HIV-1 infection, multidrug-resistant (B20)
- Treatment-experienced — failed 3 prior regimens

### Step Therapy / Failure History
- 2018–2021: emtricitabine/tenofovir + dolutegravir — virologic failure with resistance (M184V, K65R)
- 2021–2023: darunavir/cobicistat + dolutegravir + lamivudine — failure (E92K, N155H)
- 2023–2025: bictegravir/FTC/TAF — failure with integrase resistance

### Clinical Justification
Resistance testing (GenoSure 04/2026) shows susceptibility to lenacapavir. Patient meets FDA label criteria for heavily treatment-experienced patients with multidrug-resistant HIV in combination with optimized background regimen.

**Submitted:** 05/12/2026 — Priya Sharma, MD
`,

  // ============================================================
  // SCHOOL
  // ============================================================
  "school-immun": `# School Immunization Record
**Illinois Department of Public Health · School Year 2026–2027**

---

- **Student:** Emily R. Doe · DOB 09/15/2016 · Grade entering: 4th
- **School:** Lincoln Elementary School, Springfield, IL

### Immunizations
| Vaccine | Doses Required | Dates Administered | Lot # | Provider |
|---|---|---|---|---|
| DTaP | 5 doses | 11/2016, 01/2017, 03/2017, 11/2017, 09/2021 | various | Smith |
| IPV | 4 doses | 11/2016, 01/2017, 11/2017, 09/2021 | — | Smith |
| MMR | 2 doses | 09/2017, 09/2021 | — | Smith |
| Varicella | 2 doses | 09/2017, 09/2021 | — | Smith |
| HepB | 3 doses | 09/2016, 11/2016, 03/2017 | — | Hospital |
| HepA | 2 doses | 09/2017, 03/2018 | — | Smith |
| HiB | 4 doses | 11/2016, 01/2017, 03/2017, 11/2017 | — | Smith |
| PCV13 | 4 doses | 11/2016, 01/2017, 03/2017, 11/2017 | — | Smith |
| Influenza | Annual | 10/2025 | — | Smith |

### Status
☒ **Compliant** with Illinois 4th-grade immunization requirements per IDPH and CDC/ACIP schedule.

**Certifying Provider:** Robert M. Smith, MD — 06/01/2026
`,

  "school-health": `# Student Health Examination Form
**State Department of Education · School Health Form**

---

- **Student:** Emily R. Doe · DOB 09/15/2016 · Grade: 4th
- **School:** Lincoln Elementary School, Springfield, IL
- **Parent:** Jane A. Doe · (217) 555-0456

### PART A — Health History (Parent)
- Allergies: ☒ Peanut (anaphylaxis risk; carries EpiPen Jr)
- Medications: EpiPen Jr 0.15 mg PRN; cetirizine 5 mg daily
- Chronic conditions: ☒ Food allergy ☒ Allergic rhinitis
- Hospitalizations/Surgeries: None
- IEP or 504: ☒ 504 Plan for peanut allergy accommodations

### PART B — Physical Examination (Physician)
- Date: 06/01/2026 · Examiner: Robert M. Smith, MD · NPI 1234567890
- Vitals: Height 52″ (50th) · Weight 62 lb (50th) · BMI 16.1 (50th) · BP 98/62 · HR 82
- Vision: R 20/20, L 20/20 · Hearing: pass bilateral

### Systems Review
| System | Normal | Abnormal | Comments |
|---|---|---|---|
| General | ☒ | | Well-nourished, well-developed |
| Skin | ☒ | | No rashes/lesions |
| HEENT | ☒ | | PERRLA, EOMI; TMs clear; no tonsillar hypertrophy |
| Heart | ☒ | | RRR, no murmur |
| Lungs | ☒ | | CTA bilateral |
| Abdomen | ☒ | | Soft, non-tender |
| MSK | ☒ | | No scoliosis, full ROM |
| Neuro | ☒ | | Age-appropriate development |
| GU | ☒ | | Tanner Stage I |

- Immunizations: ☒ Up to date per CDC/ACIP
- TB screening: ☐ Required ☒ Not required
- Activity restrictions: ☒ None
- Anaphylaxis Action Plan: ☒ On file

☒ Cleared for school attendance and full participation.

**Signature:** Robert M. Smith, MD — 06/01/2026
`,

  "school-exempt": `# Medical Exemption from Immunization
**Illinois Department of Public Health**

---

- **Patient:** Liam J. Carter · DOB 04/18/2018 · Grade entering: Kindergarten
- **School:** Pine Hollow Elementary, Springfield, IL

### Exemption Requested
☒ Permanent medical exemption from **Varicella vaccine**
☒ Permanent medical exemption from **MMR vaccine**

### Medical Justification
Patient diagnosed with severe combined immunodeficiency (SCID, T-B-NK+, IL2RG mutation) confirmed by newborn screening 04/2018; underwent allogeneic hematopoietic stem cell transplant 09/2018 with subsequent reconstitution of cellular immunity. Live attenuated vaccines (MMR, varicella, rotavirus, yellow fever, LAIV) are CONTRAINDICATED per ACIP Best Practices Guidelines and IDSA guidelines for HSCT recipients, as they may cause vaccine-strain disseminated infection.

Non-live vaccines (DTaP, IPV, HiB, PCV, HepB, influenza inactivated) ARE administered per post-HSCT schedule.

**Certifying Physician:** Karen O. Patel, MD — Pediatric Immunology · NPI 4455667788 — 07/15/2026
`,

  "school-medadmin": `# School Medication Administration Authorization
**Springfield Public School District**

---

- **Student:** Emily R. Doe · DOB 09/15/2016 · Grade 4 · Lincoln Elementary
- **Parent:** Jane A. Doe · (217) 555-0456

### Medication
| Medication | Dose | Route | Schedule | Indication |
|---|---|---|---|---|
| Epinephrine auto-injector (EpiPen Jr) | 0.15 mg | IM | PRN signs of anaphylaxis | Peanut allergy |
| Cetirizine | 5 mg | PO | Once daily 8:00 AM if forgotten at home | Allergic rhinitis |

### Anaphylaxis Action
1. Administer EpiPen Jr to lateral thigh immediately for any signs of anaphylaxis.
2. Call 911.
3. Notify parent.
4. Lay patient flat with legs elevated unless vomiting.
5. May repeat EpiPen Jr after 5 minutes if no improvement.

- Self-carry: ☒ Yes (per IL "Emily's Law")
- Authorized for school year 2026–2027

**Physician:** Robert M. Smith, MD — 06/01/2026
**Parent Consent:** Jane A. Doe — 06/01/2026
`,

  "school-eap": `# Emergency Action Plan — Food Allergy & Anaphylaxis
**AAP / FARE template**

---

- **Student:** Emily R. Doe · DOB 09/15/2016 · Photo on file
- **Allergens:** PEANUT (severe), tree nuts (avoid as cross-contact precaution)
- **Asthma:** No
- **Severe history:** Yes — anaphylaxis 03/2020 requiring epinephrine

### Signs of Anaphylaxis
- Mouth: itching, swelling of tongue/lips
- Skin: hives, swelling, red itchy rash
- Gut: vomiting, diarrhea, cramps
- Throat: hoarseness, hard swallowing
- Lung: short of breath, wheeze, cough
- Heart: pale, blue, faint, weak pulse, dizzy
- Other: anxiety, "feeling something bad is about to happen"

### Action
1. **GIVE EPINEPHRINE IMMEDIATELY** — EpiPen Jr 0.15 mg IM lateral thigh
2. **Call 911** — state "anaphylaxis", request advanced life support, transport to ED
3. Notify parent and physician
4. Begin CPR if pulseless
5. May repeat epinephrine after 5 minutes if symptoms persist

### Medications on Site
- EpiPen Jr × 2 (in nurse's office and classroom kit)
- Diphtheria/cetirizine 5 mg liquid (for mild non-anaphylactic reactions only — never as substitute for epinephrine)

**Physician:** Robert M. Smith, MD — 06/01/2026
`,

  "504-iep": `# 504 Plan / IEP Medical Documentation
**U.S. Department of Education · Section 504 / IDEA**

---

- **Student:** Jacob N. Pierce · DOB 02/27/2014 · Grade 6 · Lincoln Middle School
- **Provider:** Karen O. Patel, MD — Developmental-Behavioral Pediatrics · NPI 4455667788

### Diagnoses
- Attention-Deficit/Hyperactivity Disorder, combined presentation (F90.2) — confirmed via Vanderbilt parent + teacher, NICHQ scales (04/2026)
- Specific Learning Disorder with impairment in reading (dyslexia, F81.0) — psychoeducational testing 03/2026
- Generalized anxiety disorder (F41.1)

### Functional Impact (school setting)
- Sustained attention < 10 min during structured tasks
- Reading fluency 16th percentile (Woodcock-Johnson IV)
- Test anxiety with measurable performance decrement (~30%)
- Working memory deficits affecting multi-step instructions

### Recommended Accommodations
- Preferential seating near teacher, away from distractions
- Extended time (1.5×) for tests and standardized assessments
- Text-to-speech / audiobook access for grade-level reading
- Chunked assignments with written and verbal directions
- Frequent movement breaks (every 30 min)
- Quiet testing environment for high-stakes assessments
- Daily home–school communication log

### Medications
- Methylphenidate ER 36 mg daily (morning)
- Guanfacine ER 2 mg qHS
- Therapy: weekly CBT for anxiety

**Physician:** Karen O. Patel, MD — 05/01/2026
`,

  // ============================================================
  // SPORTS PPE
  // ============================================================
  "ppe-history": `# Preparticipation Physical Evaluation — History Form
**PPE Monograph, 5th Ed. · AAFP/AAP/ACSM/AMSSM/AOSSM/AOASM**

---

- **Athlete:** Tyler J. Doe · DOB 04/22/2010 · Age 16 · Grade 10
- **School:** Springfield High School
- **Sports:** Varsity Basketball, Track & Field

### General Health
1. Doctor ever denied/restricted sports? ☐ Yes ☒ No
2. Ongoing medical conditions? ☐ Yes ☒ No
3. Ever hospitalized overnight? ☐ Yes ☒ No
4. Currently taking medications/supplements? ☐ Yes ☒ No

### Cardiovascular — AHA 14-Point Screen
5. Passed out / nearly passed out during or after exercise? ☐ Yes ☒ No
6. Chest discomfort with exercise? ☐ Yes ☒ No
7. Heart races/skips during exercise? ☐ Yes ☒ No
8. Doctor said heart problem? ☐ Yes ☒ No
9. Doctor said heart murmur? ☐ Yes ☒ No
10. Doctor said high blood pressure? ☐ Yes ☒ No
11. Family member died of heart problems or sudden unexplained death < 50? ☐ Yes ☒ No
12. Family Hx HCM, Marfan, ARVC, long-QT, short-QT, Brugada, CPVT? ☐ Yes ☒ No
13. Family pacemaker/ICD before age 50? ☐ Yes ☒ No

### Musculoskeletal
14. Stress fracture or bone injury? ☐ Yes ☒ No
15. Sprain/strain/swelling after injury? ☒ Yes — Right ankle sprain (02/2025), fully recovered, no residual symptoms

### Concussion
16. Ever had concussion/head injury? ☐ Yes ☒ No

### Mental Health
17. Feel stressed/under pressure? ☐ Yes ☒ No
18. Sad, hopeless, depressed, anxious? ☐ Yes ☒ No

**Athlete signature:** Tyler J. Doe · **Parent:** Jane A. Doe — 06/05/2026
`,

  "ppe-exam": `# Preparticipation Physical Evaluation — Physical Examination
**PPE Monograph, 5th Ed.**

---

- **Athlete:** Tyler J. Doe · DOB 04/22/2010 · Age 16
- **Date of Exam:** 06/10/2026 · **Examiner:** Robert M. Smith, MD

| System | Normal | Abnormal | Findings |
|---|---|---|---|
| Height / Weight | ☒ | | 5′11″, 165 lb, BMI 23.0 |
| BP / Pulse | ☒ | | 118/72, HR 64 regular |
| Vision | ☒ | | R 20/20, L 20/20 |
| Marfan stigmata | ☒ | | No arachnodactyly, no pectus, arm span < height |
| HEENT | ☒ | | Unremarkable |
| Heart auscultation | ☒ | | RRR, no murmur at rest or with Valsalva/standing |
| Lungs | ☒ | | CTA bilateral |
| Abdomen | ☒ | | No organomegaly |
| Skin | ☒ | | No HSV/impetigo/MRSA lesions |
| MSK (full screen) | ☒ | | Full ROM all joints; no laxity; negative anterior drawer R ankle |
| Neuro | ☒ | | Normal gait, coordination, reflexes |

**Signature:** Robert M. Smith, MD — 06/10/2026
`,

  "ppe-clear": `# Preparticipation Physical Evaluation — Clearance Form
**PPE Monograph, 5th Ed.**

---

- **Athlete:** Tyler J. Doe · DOB 04/22/2010
- **Sports:** Varsity Basketball, Track & Field

### Clearance Determination
☒ **Cleared for all sports without restriction**
☐ Cleared with recommendations for further evaluation or treatment
☐ Not cleared — pending further evaluation
☐ Not cleared for specified sports

Recommendations: Continue current conditioning. Encourage hydration, sleep hygiene, and sport-specific warm-up. Return for re-evaluation if any new cardiac symptoms (syncope, chest pain, exertional palpitations).

Concussion baseline (ImPACT) on file — 06/10/2026.

**Signature:** Robert M. Smith, MD — 06/10/2026 · Clearance valid 12 months.
`,

  // ============================================================
  // OCCUPATIONAL
  // ============================================================
  "osha-resp": `# OSHA Respirator Medical Evaluation Questionnaire
**29 CFR 1910.134 App C**

---

- **Employee:** Marco T. Russo · DOB 03/22/1980 · M
- **Employer:** Atlas Industrial Coatings, LLC
- **Job:** Spray Painter — solvent-based polyurethane coatings
- **Respirator type requested:** ☒ Half-mask APR with organic-vapor cartridges ☒ PAPR for confined-space work
- **Estimated use:** 6–8 hrs/day, 5 days/week

### Part A — Health History (employee)
1. Currently smoke? ☐ Yes ☒ No (quit 2018)
2. Heart attack, angina, stroke, hypertension? ☐ Yes ☒ No
3. Asthma, COPD, lung disease? ☐ Yes ☒ No
4. Claustrophobia / anxiety with respirator? ☐ Yes ☒ No
5. Diabetes, seizure, hearing/vision problems affecting respirator use? ☐ Yes ☒ No

### Part B — Provider Assessment
- BMI 27 · BP 124/78 · HR 72 · SpO₂ 99%
- Spirometry: FEV₁ 4.10 L (102%), FVC 5.05 L (98%), FEV₁/FVC 0.81 — normal
- No facial hair that would interfere with respirator seal
- Quantitative fit-test passed for proposed make/model

### Clearance
☒ **Cleared without restriction** for tight-fitting half-mask APR and PAPR use up to 12 hrs/shift.
Re-evaluation: every 2 years or per OSHA triggers (new symptoms, change in respirator type, employer concern).

**Examining Physician:** Helen K. Liu, MD — Occupational Medicine · NPI 6677889900 — 04/10/2026
`,

  "mcsa-5875": `# Medical Examination Report for Commercial Driver Fitness Determination
**Form MCSA-5875 · U.S. DOT / FMCSA**

---

- **Driver:** James P. Wilson · DOB 11/03/1975 · CDL # D400-5567-8901 (IL) · ☒ Interstate

### Health History (Driver Self-Report)
1. Head/brain injury, disorder? ☐ Yes ☒ No
2. Seizures, epilepsy? ☐ Yes ☒ No
3. Eye disorders / impaired vision? ☐ Yes ☒ No
4. Ear disorders / hearing loss? ☐ Yes ☒ No
5. Heart disease, MI, bypass? ☐ Yes ☒ No
6. Pacemaker, stents, implantable devices? ☐ Yes ☒ No
7. High blood pressure? ☒ Yes — Controlled on lisinopril 10 mg daily
8. Diabetes / elevated blood sugar? ☐ Yes ☒ No
9. Kidney disease, dialysis? ☐ Yes ☒ No
10. Sleep disorders, OSA, daytime sleepiness, snoring? ☐ Yes ☒ No
11. Stroke / TIA? ☐ Yes ☒ No
12. Chronic low back pain? ☐ Yes ☒ No
13. Regular alcohol/drug use? ☐ Yes ☒ No
14. Current medications: Lisinopril 10 mg daily

### Physical Examination
| Parameter | Result | Standard |
|---|---|---|
| Vision — distant | R 20/20, L 20/25, Both 20/20 | ☒ Meets |
| Vision — field | R 70°, L 70° | ☒ ≥ 70° each eye |
| Color recognition | Red, green, amber recognized | ☒ Meets |
| Hearing — whispered voice 5 ft | R pass, L pass | ☒ Meets |
| BP / Pulse | 132/82 HR 76 regular | ☒ Stage 1 HTN — 1-yr cert |
| Urinalysis | SG 1.020, pH 6.0, protein neg, blood neg, sugar neg | ☒ Normal |
| Height / Weight | 5′10″, 210 lb, BMI 30.1 | Noted |

### Determination
☒ **Qualified — Medical Examiner's Certificate issued for 1 year** (BP requires annual recheck)
- Restrictions: ☒ Wear corrective lenses
- Re-exam due: 04/15/2027

**Examiner:** Helen K. Liu, MD · NRCME #1234567890 — 04/15/2026
`,

  "mcsa-5876": `# Medical Examiner's Certificate
**Form MCSA-5876 · U.S. DOT / FMCSA**

---

This certifies that **James P. Wilson** (DOB 11/03/1975) was examined in accordance with FMCSA and found qualified under 49 CFR 391.41.

- **Date of Examination:** 04/15/2026
- **Certificate Expires:** 04/15/2027 (1 year — Stage 1 HTN monitoring)
- **Restrictions:** ☒ Wearing corrective lenses

- **Medical Examiner:** Helen K. Liu, MD · NRCME #1234567890
- **Address:** Springfield Occupational Health, 320 Industrial Pkwy, Springfield IL 62703
- **Phone:** (217) 555-0299

**Signature:** Helen K. Liu, MD — 04/15/2026
`,

  "faa-8500-8": `# Application for Airman Medical Certificate
**FAA Form 8500-8**

---

- **Applicant:** Rebecca L. Ramirez · DOB 06/15/1990 · F
- **Address:** 2120 Skyway Blvd., Phoenix, AZ 85008
- **Class requested:** ☒ Second-class (commercial)
- **Type of certificate held:** Commercial Pilot — Single & Multi-Engine Land, Instrument

### Medical History
- Current medications: Levothyroxine 75 mcg daily (Hashimoto thyroiditis, controlled — TSH 1.8)
- Allergies: NKDA
- Surgeries: Appendectomy 2008
- Substance use: None; no DUI/DWI; no drug-related convictions
- Mental health: No history of psychiatric hospitalization, suicidal ideation, or psychotropic medication
- Visits to health professionals in last 3 years: PCP annual; OB-GYN annual; endocrinology q6 months

### Examination (AME)
- BP 118/74 · HR 64 regular · BMI 22.4
- Vision: Distant 20/20 each eye; near 20/20 each eye; color vision normal (Ishihara)
- Hearing: Conversational voice 6 ft both ears
- ECG: Sinus rhythm, normal axis, no abnormalities
- Neurological: Intact
- Mental status: Alert, cooperative, appropriate

### Determination
☒ **Issued Second-Class Medical Certificate** valid 12 months for commercial privileges, 60 months for private/recreational privileges.
Conditions: Must wear/possess corrective lenses for near vision (presbyopia early).

**AME:** Steven J. McKenna, MD — Senior AME #4422 — 05/22/2026
`,

  "sf-78": `# Certificate of Medical Examination
**Standard Form 78 · U.S. Office of Personnel Management**

---

- **Applicant:** Diana K. Russell · SSN XXX-XX-7741 · DOB 02/19/1982
- **Position:** GS-13 Cybersecurity Engineer, DoD
- **Examining Facility:** Federal Occupational Health, Colorado Springs

### Examination
- BP 116/72 · HR 64 · BMI 23 · Vision 20/20 each eye corrected · Hearing within normal limits
- Cardio: RRR, no murmur · Pulm: clear · Neuro: intact · MSK: full ROM
- Mental status: alert, cooperative, no signs of acute psychiatric distress

### Functional Requirements of Position
- Sedentary work, occasional travel, no physical-defense duties
- Use of computer 8 hrs/day
- Telework eligible

### Determination
☒ **Medically qualified** for position requirements.
Reasonable accommodation: Adjustable workstation, ergonomic chair (mild lumbar strain history).

**Examiner:** Mark R. Allen, MD — 03/18/2026
`,

  "of-178": `# Certificate of Medical Examination
**Optional Form 178 · OPM (alternate)**

---

Same examination data as SF-78 used for a non-competitive federal appointment. Same applicant: Diana K. Russell, GS-13 Cybersecurity Engineer.

☒ Medically qualified for the duties of the position.
☒ No restrictions other than the noted reasonable accommodation.

**Examiner:** Mark R. Allen, MD — 03/18/2026
`,

  // ============================================================
  // HIPAA
  // ============================================================
  "hipaa-auth": `# Authorization for Use or Disclosure of Protected Health Information
**45 CFR § 164.508**

---

- **Patient:** Jane A. Doe · DOB 03/12/1968 · MRN HC-44521
- **Covered Entity Releasing PHI:** Springfield Cardiology Associates
- **Receiving Party:** Hartford Life Insurance, Underwriting Dept · 200 Asylum St., Hartford, CT 06103

### Information to be Released
- Cardiology office notes, 01/2024 – present
- All echocardiogram, ECG, Holter, stress-test, MRI reports
- Cardiac catheterization reports
- Current medication list

### Purpose
Underwriting of life insurance application # LF-2026-77845

### Specific Authorizations
☐ I specifically authorize release of mental health / psychotherapy notes — NOT included
☐ HIV/AIDS — NOT included
☐ Substance use treatment (42 CFR Part 2) — NOT included
☐ Genetic testing — NOT included

### Expiration
This authorization expires on **05/01/2027** or upon completion of underwriting, whichever comes first.

### Patient Rights
I may revoke this authorization at any time in writing, except to the extent action has been taken in reliance on it. I understand I may inspect or copy the PHI to be disclosed. I understand the receiving party may not be a covered entity and re-disclosure may not be HIPAA-protected.

**Signature:** Jane A. Doe — 05/01/2026
`,

  "hipaa-npp": `# Notice of Privacy Practices
**Effective Date: 01/01/2026 · Springfield Cardiology Associates**

---

THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.

### Uses & Disclosures Permitted Without Authorization
- **Treatment:** Sharing your information with other clinicians involved in your care.
- **Payment:** Submitting claims to your insurance.
- **Operations:** Quality review, training, accreditation.
- Required by law (court orders, public health, abuse reporting, FDA).

### Uses Requiring Your Authorization
- Marketing communications · Sale of PHI · Most psychotherapy notes

### Your Rights
- Inspect and copy your records (response within 30 days)
- Request amendment
- Request restrictions on certain uses and disclosures
- Receive a list of disclosures (accounting)
- Request confidential communications (alternative address/phone)
- Receive a paper copy of this notice
- File a complaint with this practice or with HHS OCR

### Contact
Privacy Officer: Linda Park, MBA · (217) 555-0210 · privacy@springfieldcardio.com
HHS Office for Civil Rights: 200 Independence Ave SW, Washington DC 20201 · 1-800-368-1019

We are required by law to maintain the privacy of PHI and to provide individuals with notice of our legal duties and privacy practices.
`,

  "hipaa-breach": `# Notification of Breach of Unsecured Protected Health Information
**45 CFR § 164.404**

---

**Date of this notice:** 06/01/2026
**To:** Jane A. Doe, 456 Oak Street, Springfield, IL 62704

Dear Ms. Doe,

We are writing to inform you of a recent incident that may have involved your protected health information (PHI).

### What Happened
On 05/14/2026, an unencrypted laptop assigned to a clinical staff member was stolen from a parked vehicle. On 05/18/2026 we determined the device contained certain patient information, including yours. The device was password-protected but not encrypted. There is no evidence to date that the information has been accessed or misused.

### Information Involved
- Name, date of birth, medical record number
- Diagnoses and visit dates
- ☒ No Social Security number, ☒ no financial account number, ☒ no driver's-license number

### Steps We Are Taking
- Reported the theft to law enforcement (Police Report #25-04412)
- Engaged a forensic vendor to monitor for misuse
- Provided two years of complimentary identity-protection monitoring through Equifax (enrollment code enclosed)
- Mandatory device-encryption deployed across all clinical devices

### Steps You Can Take
- Enroll in identity monitoring using the enclosed code (deadline 09/01/2026)
- Review your insurance Explanation of Benefits statements for unfamiliar services
- Place a fraud alert with the three credit bureaus

### For More Information
Privacy Officer: Linda Park, MBA · (217) 555-0210 · privacy@springfieldcardio.com

We sincerely apologize for this incident.

— Springfield Cardiology Associates
`,

  // ============================================================
  // END OF LIFE
  // ============================================================
  "ad-livingwill": `# Advance Directive / Living Will
**Illinois Living Will Act (755 ILCS 35)**

---

I, **Eleanor M. Whitfield** (DOB 03/05/1942), being of sound mind, willfully and voluntarily make this declaration to refuse life-sustaining treatment if I should have a terminal condition or a state of permanent unconsciousness.

### My Wishes
If I have a terminal condition or am permanently unconscious and unable to make decisions, I direct:

- **Cardiopulmonary resuscitation:** ☒ Do not attempt
- **Mechanical ventilation:** ☒ Do not provide; if started, withdraw
- **Artificial nutrition and hydration:** ☒ Withhold/withdraw; provide oral comfort feeding only as desired
- **Antibiotics:** ☒ Use only for comfort, not to prolong dying
- **Dialysis:** ☒ Do not initiate
- **Blood transfusions:** ☒ Comfort only
- **Hospital transfer:** ☒ Avoid unless needed for comfort

I direct that I be given full comfort care, including pain and symptom management, at all times.

### Specific Requests
- I wish to be at home or in a hospice setting at the end of life.
- My religious tradition (Episcopalian) supports natural death; I request the sacrament of last rites.
- Organ/tissue donation: ☒ Yes — please facilitate any usable donation.

**Declarant Signature:** Eleanor M. Whitfield — 04/10/2026
**Witness 1:** Catherine R. Bell (not a relative or beneficiary) — 04/10/2026
**Witness 2:** Joseph M. O'Connor (not a relative or beneficiary) — 04/10/2026
**Notarized:** Linda T. Marsh, Notary Public, IL — Commission expires 11/2028
`,

  "polst": `# Portable Medical Orders for Life-Sustaining Treatment (POLST)
**National POLST · Illinois POLST · Effective immediately by EMS/all providers**

---

- **Patient:** Eleanor M. Whitfield · DOB 03/05/1942 · F
- **Last 4 SSN:** 9087
- **Address:** 220 Lakeside Dr., Springfield, IL 62701

### Section A — Cardiopulmonary Resuscitation
☒ **Do Not Attempt Resuscitation / DNR** (if patient is pulseless and not breathing)

### Section B — Initial Treatment Orders
☒ **Comfort-Focused Treatment** — Relieve pain and suffering through any means. Use oxygen, suction, manual treatment of airway obstruction. Antibiotics only to promote comfort. Do NOT transfer to hospital for life-sustaining treatment — transfer only if comfort needs cannot be met in current location.

### Section C — Medically Assisted Nutrition
☒ **No artificial means of nutrition** — Offer food by mouth if desired and tolerated.

### Discussed With
☒ Patient (has capacity) · ☒ Health care agent: Margaret Whitfield-Hayes (daughter), (217) 555-0312

### Signatures
- **Physician:** Robert M. Smith, MD · NPI 1234567890 — 04/15/2026
- **Patient:** Eleanor M. Whitfield — 04/15/2026

Review date: 04/2027 or with any change in condition.
`,

  "hcpoa": `# Healthcare Power of Attorney / Healthcare Proxy
**Illinois Power of Attorney for Health Care**

---

I, **Eleanor M. Whitfield** (DOB 03/05/1942), appoint as my health-care agent:

### Primary Agent
- **Name:** Margaret Whitfield-Hayes
- **Relationship:** Daughter
- **Address:** 145 Maple Crest Dr., Naperville, IL 60540
- **Phone:** (217) 555-0312 (mobile) · (630) 555-0118 (home)

### Alternate Agent
- **Name:** Robert J. Whitfield
- **Relationship:** Son
- **Phone:** (312) 555-0445

### Powers Granted
My agent has full power to make any and all health-care decisions for me, including but not limited to:
- Consenting to or refusing any medical treatment
- Accessing my medical records (HIPAA authorization)
- Selecting and discharging physicians
- Authorizing admission to or discharge from any health-care facility
- Authorizing pain management
- Authorizing or withdrawing life-sustaining treatment consistent with my Advance Directive dated 04/10/2026

### Effective When
☒ Immediately, and to remain effective if I become unable to make my own decisions.

**Principal Signature:** Eleanor M. Whitfield — 04/10/2026
**Witness:** Catherine R. Bell — 04/10/2026
**Notary:** Linda T. Marsh, IL · 04/10/2026
`,

  "dnr": `# In-Hospital Do Not Resuscitate Order
**Springfield Memorial Hospital**

---

- **Patient:** Eleanor M. Whitfield · MRN 7788991 · DOB 03/05/1942
- **Diagnosis:** Stage IV pancreatic adenocarcinoma with hepatic metastases; functional status ECOG 3; hospice eligible.
- **Prognosis:** Estimated survival weeks to a few months.

### Order
☒ **DO NOT ATTEMPT RESUSCITATION** in the event of cardiopulmonary arrest. No chest compressions, no defibrillation, no intubation, no advanced cardiac life support.

All other appropriate care (comfort measures, symptom management, antibiotics if comfort-promoting, IV fluids if symptom-relieving) will continue per separate orders.

### Discussion Documented With
- Patient (full decision-making capacity confirmed) — 04/12/2026
- Health-care agent: Margaret Whitfield-Hayes (daughter)
- Family meeting attended by son R. J. Whitfield, palliative care RN, oncologist, chaplain.

**Ordering Physician:** Maya P. Singh, MD — Hospital Medicine · 04/12/2026
**Co-signed:** David R. Allen, MD — Hematology/Oncology · 04/12/2026
`,

  "ooh-dnr": `# Out-of-Hospital Do Not Resuscitate (EMS)
**Illinois Uniform DNR Order**

---

- **Patient:** Eleanor M. Whitfield · DOB 03/05/1942
- **Address:** 220 Lakeside Dr., Springfield, IL 62701

### Order
In the event of cardiopulmonary arrest occurring outside of a hospital setting, EMS personnel and other healthcare providers are directed to:

☒ Do NOT attempt cardiopulmonary resuscitation, chest compressions, defibrillation, endotracheal intubation, or advanced cardiac life support medications.
☒ Provide oxygen, suction, comfort measures, and pain control.
☒ Transport for comfort only if symptom relief cannot be achieved in the current setting.

This order is valid throughout the State of Illinois and complies with 210 ILCS 50/3.10.

**Physician:** Robert M. Smith, MD · NPI 1234567890 — 04/15/2026
**Patient:** Eleanor M. Whitfield — 04/15/2026
**Bracelet/ID issued:** ☒ Yes
`,

  // ============================================================
  // CLINICAL DOC STANDARDS
  // ============================================================
  "em-2021": `# Office/Outpatient E/M Documentation
**CMS 2021 E/M Guidelines · Office Visit Established Patient (99214)**

---

- **Patient:** Jane A. Doe · DOB 03/12/1968 · MRN HC-44521
- **Date of Service:** 05/01/2026 · **Place:** 11 (Office)
- **Provider:** Sarah Chen, MD — Cardiology
- **Code selected:** 99214 (moderate MDM OR 30–39 min total time)
- **Basis:** ☒ Medical Decision Making

### Subjective
59-year-old female with HFrEF (EF 25%), DM2, CKD-3b, returns 6 weeks after CHF admission. Reports gradual improvement; dyspnea at 2 blocks (was 1/2 block), no orthopnea, no PND, 2 lb weight gain since discharge, no chest pain.

### Objective
- BP 118/72 · HR 72 sinus · SpO₂ 96% RA · Weight 172 lb (+2)
- Lungs: crackles 1/4 bibasilar, improved
- CV: RRR, S3 absent, no JVD, no peripheral edema
- Labs today: BNP 380 (was 1240), K 4.2, Cr 1.6 (eGFR 38, stable)

### Assessment / Plan
1. **HFrEF, NYHA III** — improved. Continue GDMT. Increase furosemide to 60 mg AM, 40 mg noon for 1 week.
2. **DM2 with diabetic nephropathy** — A1c 7.4%. Continue metformin/insulin/dapagliflozin.
3. **CKD-3b** — stable. Avoid NSAIDs. Nephrology referral made.
4. **MDD** — coordinated with psychiatry; sertraline 200 mg.
5. **Atrial fibrillation paroxysmal** — apixaban 5 mg BID.

### MDM Analysis
- **Problems addressed:** 2 stable chronic illnesses + 1 chronic illness with exacerbation (HFrEF) = High
- **Data:** Independent review of echo, BMP today, BNP, hospital records, prior cardiology notes; independent historian (spouse); ordered repeat BMP, BNP in 1 week = Moderate
- **Risk:** Prescription drug management (apixaban, diuretic titration) = Moderate
- **Overall MDM:** Moderate

### Time (if used)
N/A — code selected on MDM.

**Provider:** Sarah Chen, MD — 05/01/2026 · Electronically signed.
`,

  "cpt-procedure": `# Procedure / Service Documentation
**AMA CPT · Procedure note**

---

- **Patient:** Walter J. Hughes · DOB 11/14/1948 · MRN PUL-3344
- **Date of Procedure:** 05/14/2026
- **Provider:** Helen K. Liu, MD — Pulmonology
- **CPT:** 31622 (bronchoscopy, diagnostic, with cell washing)
- **Indication:** Persistent right-upper-lobe consolidation 8 weeks despite full antibiotic course; r/o malignancy vs. NTM infection.
- **Consent:** Informed consent obtained; risks (bleeding, pneumothorax, infection, hypoxia) reviewed.
- **Anesthesia:** Moderate sedation (midazolam 2 mg + fentanyl 100 mcg IV) supervised; topical lidocaine.

### Findings
- Vocal cords mobile and intact.
- Trachea and main carina normal.
- Right tree: extrinsic compression of RUL apical-posterior segment with mucosal erythema and friability.
- Left tree: unremarkable.
- BAL × 60 mL from RUL apical segment — sent for cytology, AFB, fungal, bacterial culture, and cell count.
- Endobronchial biopsies × 3 from friable mucosa.

### Complications
None. SpO₂ 95–98% throughout. No bleeding requiring intervention.

### Disposition
Recovered in PACU 60 min; discharged with companion. Follow-up clinic 1 week for results.

**Provider:** Helen K. Liu, MD — 05/14/2026
`,

  "jc-medrec": `# Joint Commission Medical Record Standards Checklist
**The Joint Commission · IM.6 (Information Management)**

---

- **Facility:** Springfield Memorial Hospital
- **Encounter:** Doe, Jane A. · MRN 9988776 · Admission 05/28/2026 – 06/01/2026
- **Reviewer:** Patricia Lin, RN, BSN, CPHQ · Date 06/05/2026

### Required Elements
| # | Element | Compliant |
|---|---|---|
| 1 | Patient identification on every page | ☒ Yes |
| 2 | H&P completed within 24 h of admission | ☒ Yes — 05/28 18:00 |
| 3 | Informed consent for invasive procedures | ☒ Yes |
| 4 | Medication reconciliation on admit, transfer, discharge | ☒ Yes |
| 5 | Daily progress notes | ☒ Yes |
| 6 | Discharge summary completed within 30 days | ☒ Yes — 06/02 |
| 7 | Allergies documented and updated | ☒ Yes |
| 8 | Code status documented | ☒ Yes — Full code |
| 9 | Pain assessment with reassessment | ☒ Yes |
| 10 | Patient education documented | ☒ Yes |
| 11 | Verbal/telephone orders authenticated within 48 h | ☒ Yes |
| 12 | Restraints — provider order + monitoring | N/A |

**Outcome:** No deficiencies identified for this encounter.
`,

  "ccda": `# Continuity of Care Document (C-CDA R2.1)
**HL7 International · Standardized clinical document**

---

- **Patient:** Doe, Jane A. · DOB 03/12/1968 · Sex F · MRN HC-44521
- **Document type:** Continuity of Care Document (LOINC 34133-9)
- **Author:** Springfield Cardiology Associates · Custodian: Springfield Memorial Hospital
- **Created:** 06/02/2026

### Problems (active)
| ICD-10 | SNOMED CT | Problem |
|---|---|---|
| I50.22 | 88805009 | Chronic systolic heart failure |
| E11.65 | 44054006 | Type 2 diabetes mellitus with hyperglycemia |
| N18.32 | 433144002 | CKD Stage 3b |
| F33.1 | 36923009 | MDD recurrent, moderate |
| I48.0 | 426483005 | Paroxysmal atrial fibrillation |

### Medications
- Sacubitril/valsartan 97/103 mg PO BID (RxNorm 1656339)
- Carvedilol 25 mg PO BID
- Dapagliflozin 10 mg PO daily
- Furosemide 40 mg PO BID
- Apixaban 5 mg PO BID
- Insulin glargine 20 u SC qHS

### Allergies
NKDA — refuted 05/01/2026.

### Results (most recent)
| LOINC | Test | Value | Date |
|---|---|---|---|
| 30934-4 | NT-proBNP | 1240 → 380 pg/mL | 05/28 → 06/02/2026 |
| 4548-4 | HbA1c | 7.4 % | 05/01/2026 |
| 33914-3 | eGFR (CKD-EPI) | 38 mL/min/1.73 m² | 06/01/2026 |
| 18834-2 | LVEF (echo) | 25 % | 05/28/2026 |

### Encounters
Inpatient 05/28 – 06/01/2026 (acute decompensated HF, DRG 291).

### Care Team
Sarah Chen MD (Cardiology) · Robert M. Smith MD (PCP) · Lisa Park MD (Psychiatry) · Marcus Reed MD (Nephrology) · Patricia Lin RN (Care Coordinator)
`,

  "uscdi": `# USCDI v4 Data Class Inventory
**ONC (HHS) · 24-Mar-2024 Final**

---

**Source system:** Epic 2026 · **Tenant:** Springfield Memorial Hospital
**Patient:** Doe, Jane A. · MRN HC-44521

| USCDI Data Class | Captured | Vocabulary | Example |
|---|---|---|---|
| Patient demographics | ☒ | OMB / HL7 v3 | F, non-Hispanic White, English |
| Health concerns | ☒ | SNOMED | "Worried about falls" |
| Problems | ☒ | ICD-10, SNOMED | HFrEF, DM2, CKD-3b |
| Medications | ☒ | RxNorm | Sacubitril/valsartan 97/103 mg BID |
| Allergies & intolerances | ☒ | RxNorm, UNII | NKDA |
| Lab tests / Lab values | ☒ | LOINC, UCUM | NT-proBNP 380 pg/mL |
| Vital signs | ☒ | LOINC | BP 118/72 mmHg |
| Procedures | ☒ | CPT, ICD-10-PCS, SNOMED | Echocardiogram 93306 |
| Immunizations | ☒ | CVX | Influenza CVX 158 (2025-10) |
| Smoking status | ☒ | SNOMED | "Never smoker" |
| Care team members | ☒ | NPI, NUCC | Sarah Chen MD, Cardiology |
| Encounters | ☒ | HL7 v3 | Inpatient 05/28–06/01/2026 |
| Clinical notes | ☒ | LOINC | Discharge summary, H&P, progress notes |
| Diagnostic imaging | ☒ | LOINC, DICOM | Cardiac MRI 2026-05-10 |
| Goals | ☒ | SNOMED | "Walk to mailbox without dyspnea" |
| Health insurance information | ☒ | X12 | Medicare 1EG4-TE5-MK72 |
| Patient summary | ☒ | C-CDA | See companion C-CDA |
| Provenance | ☒ | FHIR Provenance | Authoring system + author identity |

**Interoperability target:** ☒ HL7 FHIR US Core 7.0.0 (2024) endpoint live.
`,

  // ============================================================
  // IMMIGRATION
  // ============================================================
  "i-693": `# Report of Medical Examination and Vaccination Record
**USCIS Form I-693 · Civil Surgeon designated by USCIS**

---

- **Applicant:** Maria F. Gutierrez · DOB 11/02/1995 · F
- **A-Number:** A 200 123 456 · Country of birth: Mexico
- **Address:** 1422 Vine St., San Antonio, TX 78201
- **Date of Examination:** 05/20/2026

### Part 1 — Medical History
- No history of communicable diseases of public-health significance
- No history of substance use disorder
- No history of mental disorder with harmful behavior

### Part 2 — Physical Examination
- General: well-nourished, well-developed adult female
- BP 110/68 · HR 72 · Height 5′4″ · Weight 138 lb
- No abnormal findings on cardiopulmonary, abdominal, neurological, dermatologic exam

### Part 3 — Communicable Diseases
| Disease | Method | Result | Date |
|---|---|---|---|
| Tuberculosis (≥ 2 yrs old) | IGRA (QuantiFERON-TB Gold Plus) | Negative | 05/12/2026 |
| Syphilis (≥ 18 yrs) | Treponemal IgG | Non-reactive | 05/12/2026 |
| Gonorrhea (≥ 18 yrs) | NAAT cervical | Negative | 05/12/2026 |
| Hansen's disease | Skin exam | No findings | 05/20/2026 |

### Part 4 — Class A / Class B Findings
☒ No Class A condition · ☒ No Class B condition

### Part 5 — Vaccinations (per CDC Technical Instructions)
| Vaccine | Status |
|---|---|
| MMR | 2 doses documented |
| Td/Tdap | Tdap 10/2022 — current |
| Varicella | Immune (serology positive) |
| Polio (IPV) | Childhood series — complete |
| Hepatitis B | 3-dose series — complete (titer positive) |
| Influenza (seasonal) | 10/2025 — current |
| COVID-19 | 2025–26 formulation — 11/2025 — current |
| Pneumococcal | Not indicated (age < 65, no risk factors) |
| Rotavirus | Not indicated (over age 8 months) |
| HPV | Series complete 2014 |
| Meningococcal | MenACWY 2014 booster |

☒ All age-appropriate vaccinations either administered or documented as immune/not indicated.

**Civil Surgeon:** Dr. Carlos R. Mendoza, MD · USCIS Designation #TX-CS-04412 · NPI 8899001122
**Address:** 900 Medical Plaza, San Antonio, TX 78229 · (210) 555-0118
**Signed:** 05/20/2026 · **Examination valid for I-485 filing within 2 years**
`,

  "ds-2054": `# Medical Examination for Immigrant or Refugee Applicant
**Form DS-2054 · U.S. Department of State**

---

- **Applicant:** Ahmed M. Khaled · DOB 06/10/1988 · M
- **Passport:** Egypt A12345678 · Visa class: IR-1 (spouse of U.S. citizen)
- **Country of examination:** Egypt · **Panel physician:** Dr. Hassan Z. Farouk · Cairo Panel Physician #EGY-007
- **Date of examination:** 04/18/2026 · **Location:** International Medical Center, Cairo

### Physical Examination
- General: well-appearing adult male
- BP 122/76 · HR 70 · Height 178 cm · Weight 78 kg
- HEENT, cardiopulmonary, abdominal, neurological, dermatologic exams unremarkable

### Mandatory Tests
| Test | Result |
|---|---|
| TB CXR (≥ 15 yrs) | Normal |
| IGRA / TST | Negative |
| Syphilis (RPR + Treponemal) | Non-reactive |
| Gonorrhea NAAT (≥ 18) | Negative |
| HIV (per current CDC TI) | Not required |

### Vaccinations
- MMR × 2 ☒ Tdap (10/2024) ☒ Varicella (immune, serology) ☒ IPV (childhood)
- HepB series complete ☒ Influenza (10/2025) ☒ COVID-19 (11/2025)

### Findings
☒ No Class A condition · ☒ No Class B condition · Cleared for immigration.

**Panel Physician Signature:** Hassan Z. Farouk, MD — 04/18/2026
`,

  "i-693-supp": `# I-693 Vaccination Supplement
**USCIS — Supplement to Form I-693**

---

- **Applicant:** Maria F. Gutierrez · DOB 11/02/1995
- **Civil Surgeon:** Dr. Carlos R. Mendoza, MD

### Additional Vaccines Administered Today (05/20/2026)
| Vaccine | Manufacturer | Lot # | Site | Provider |
|---|---|---|---|---|
| Td (booster) | Sanofi Pasteur | TD-2604 | Left deltoid IM | Mendoza |
| MMR (2nd dose, no titer) | Merck M-M-R II | MMR-7741 | Right deltoid SC | Mendoza |

### Contraindications / Deferrals
- None — patient not pregnant, not immunocompromised, no severe allergy to vaccine components.

### Series to be Completed Outside
- None — vaccine record now complete per CDC Technical Instructions.

**Civil Surgeon:** Carlos R. Mendoza, MD · USCIS #TX-CS-04412 — 05/20/2026
`,
};

export const getFormSample = (id: string): string | undefined =>
  FORM_SAMPLES[id];
