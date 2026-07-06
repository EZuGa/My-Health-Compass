import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { IngestionHub } from "@/components/IngestionHub";


export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({
    meta: [{ title: "Data Connections — The Health Passport" }],
  }),
  component: Connections,
});

type Setting = "Inpatient" | "Outpatient";
type BoxId = "heart" | "metabolic" | "fitness" | "sleep" | "mind" | "exposures";

type Source = {
  id: string;
  name: string;
  vendor: string;
  category: string;
  setting: Setting;
  status: string; // FDA / regulatory note
  evidence: string;
  feeds: BoxId[]; // which Health Passport boxes this powers
  protocol: string; // how integration would actually work
};

const BOX_LABEL: Record<BoxId, string> = {
  heart: "Heart & Circulation",
  metabolic: "Metabolism",
  fitness: "Fitness & Movement",
  sleep: "Sleep",
  mind: "Mind",
  exposures: "Exposures & Micronutrients",
};

const SOURCES: Source[] = [
  // ─── Prescription Digital Therapeutics ────────────────────────────
  {
    id: "reset",
    name: "reSET / reSET-O",
    vendor: "Pear Therapeutics",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo / 510(k) (Pear ceased ops 2023)",
    evidence: "RCT-based; 74% 12-week retention, 62% abstinence",
    feeds: ["mind"],
    protocol: "Vendor API (deprecated) — historical data via FHIR export",
  },
  {
    id: "somryst",
    name: "Somryst",
    vendor: "Pear Therapeutics",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (CBT-I for chronic insomnia)",
    evidence: "Pivotal RCT for sleep efficiency",
    feeds: ["sleep", "mind"],
    protocol: "FHIR Observation export",
  },
  {
    id: "endeavorrx",
    name: "EndeavorRx",
    vendor: "Akili Interactive",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (ADHD ages 8–12)",
    evidence: "RCT — attention improvement",
    feeds: ["mind"],
    protocol: "Akili partner API",
  },
  {
    id: "freespira",
    name: "Freespira",
    vendor: "Freespira",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (PTSD, panic disorder)",
    evidence: "Capnometry biofeedback trials",
    feeds: ["mind", "heart"],
    protocol: "Vendor REST API",
  },
  {
    id: "bluestar",
    name: "BlueStar / BlueStar Rx",
    vendor: "WellDoc",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA 510(k) (Type 2 diabetes)",
    evidence: "RCT HbA1c reduction",
    feeds: ["metabolic"],
    protocol: "WellDoc FHIR API",
  },
  {
    id: "livongo",
    name: "Livongo (Teladoc)",
    vendor: "Teladoc Health",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA 510(k) CGM component",
    evidence: "Real-world HbA1c reduction",
    feeds: ["metabolic", "heart"],
    protocol: "Teladoc partner API",
  },
  {
    id: "tidepool",
    name: "Tidepool Loop",
    vendor: "Tidepool",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA 510(k) AID app (T1D)",
    evidence: "Open-source automated insulin delivery",
    feeds: ["metabolic"],
    protocol: "Tidepool REST API + OAuth",
  },

  // ─── ECG / Arrhythmia wearables ───────────────────────────────────
  {
    id: "apple-watch",
    name: "Apple Watch (Series 4+)",
    vendor: "Apple",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA 510(k) K213971 (PPG), K201525 (ECG)",
    evidence: "Apple Heart Study 419,297 pts; PPV 84%",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "HealthKit (requires native iOS companion) → FHIR push",
  },
  {
    id: "fitbit",
    name: "Fitbit Sense",
    vendor: "Google / Fitbit",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA 510(k) K200948",
    evidence: "Fitbit Heart Study",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "Fitbit Web API (OAuth 2.0)",
  },
  {
    id: "samsung-watch",
    name: "Samsung Galaxy Watch 2/3",
    vendor: "Samsung",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA-cleared ECG spot-check",
    evidence: "ECG snapshots; BP feature requires 28-day recal.",
    feeds: ["heart", "fitness"],
    protocol: "Samsung Health SDK",
  },
  {
    id: "withings",
    name: "Withings ScanWatch",
    vendor: "Withings",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA 510(k) K201456",
    evidence: "AF detection + SpO₂",
    feeds: ["heart", "sleep"],
    protocol: "Withings API (OAuth 2.0)",
  },
  {
    id: "verily",
    name: "Verily Study Watch",
    vendor: "Google Verily",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA 510(k) K182456",
    evidence: "Research-grade",
    feeds: ["heart", "fitness"],
    protocol: "Verily research portal",
  },
  {
    id: "kardia",
    name: "KardiaMobile (6L/1L)",
    vendor: "AliveCor",
    category: "ECG / AF Wearable",
    setting: "Outpatient",
    status: "FDA 510(k) K211668",
    evidence: "PPV 87–94% for AF detection",
    feeds: ["heart"],
    protocol: "Kardia API (OAuth)",
  },

  // ─── Continuous Glucose Monitors ──────────────────────────────────
  {
    id: "libre2",
    name: "FreeStyle Libre 2",
    vendor: "Abbott",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM (ages ≥4)",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "LibreView API",
  },
  {
    id: "libre3",
    name: "FreeStyle Libre 3",
    vendor: "Abbott",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM (ages ≥2)",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "LibreView API",
  },
  {
    id: "dexcom-g6",
    name: "Dexcom G6",
    vendor: "Dexcom",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM (ages ≥2)",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "Dexcom Developer API (OAuth)",
  },
  {
    id: "dexcom-g7",
    name: "Dexcom G7",
    vendor: "Dexcom",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "Dexcom Developer API (OAuth)",
  },
  {
    id: "eversense",
    name: "Eversense E3",
    vendor: "Senseonics",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM (180-day implant)",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "Eversense DMS export",
  },
  {
    id: "guardian4",
    name: "Guardian 4",
    vendor: "Medtronic",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA Class II iCGM",
    evidence: "Non-adjunctive dosing",
    feeds: ["metabolic"],
    protocol: "CareLink API",
  },

  // ─── Evidence-based wellness apps ─────────────────────────────────
  {
    id: "mysugr",
    name: "mySugr",
    vendor: "Roche",
    category: "Diabetes App",
    setting: "Outpatient",
    status: "FDA Class II",
    evidence: "Integrated with Accu-Chek meters",
    feeds: ["metabolic"],
    protocol: "Roche RocheDiabetes API",
  },
  {
    id: "diabeo",
    name: "Diabeo",
    vendor: "Sanofi / Voluntis",
    category: "Diabetes App",
    setting: "Outpatient",
    status: "CE-marked; RCT evidence",
    evidence: "HbA1c reduction RCTs",
    feeds: ["metabolic"],
    protocol: "Voluntis Theraxium API",
  },
  {
    id: "calm",
    name: "Calm / Headspace",
    vendor: "Calm, Inc. / Headspace Health",
    category: "Wellness App (non-FDA)",
    setting: "Outpatient",
    status: "Wellness category (not FDA-regulated)",
    evidence: "Multiple RCTs — reduced stress/anxiety",
    feeds: ["mind", "sleep"],
    protocol: "Calm/Headspace partner API",
  },
  {
    id: "cbti",
    name: "CBT-i Coach",
    vendor: "US VA / DoD",
    category: "Wellness App (non-FDA)",
    setting: "Outpatient",
    status: "Government-issued, not FDA-regulated",
    evidence: "Evidence-based CBT-I content",
    feeds: ["sleep", "mind"],
    protocol: "Manual export / FHIR Observation",
  },

  // ─── EMR / Inpatient ─────────────────────────────────────────────
  {
    id: "epic",
    name: "Epic (MyChart / Hyperspace)",
    vendor: "Epic Systems",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR — SMART-on-FHIR R4",
    evidence: "Source of truth for hospitalizations, labs, meds, procedures",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "SMART-on-FHIR R4 + OAuth 2.0 (USCDI v3)",
  },
  {
    id: "cerner",
    name: "Oracle Cerner",
    vendor: "Oracle Health",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR — SMART-on-FHIR R4",
    evidence: "Discharge summaries, in-hospital meds, procedures",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "Cerner FHIR (Bulk Data Access)",
  },
  {
    id: "athena",
    name: "athenahealth",
    vendor: "athenahealth",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR",
    evidence: "Encounters, labs, problem list",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "athenaNet FHIR API",
  },
  {
    id: "meditech",
    name: "MEDITECH Expanse",
    vendor: "MEDITECH",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR — FHIR R4",
    evidence: "Inpatient orders, results, discharge",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "MEDITECH Greenfield FHIR API",
  },
  {
    id: "allscripts",
    name: "Veradigm (Allscripts)",
    vendor: "Veradigm",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR",
    evidence: "Ambulatory + inpatient records",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "Veradigm Unity / FHIR API",
  },
  {
    id: "nextgen",
    name: "NextGen Healthcare",
    vendor: "NextGen",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR",
    evidence: "Ambulatory specialty records",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "NextGen FHIR API",
  },
  {
    id: "eclinicalworks",
    name: "eClinicalWorks",
    vendor: "eClinicalWorks",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR",
    evidence: "Encounter notes, labs, prescriptions",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "eCW FHIR R4 API",
  },
  {
    id: "greenway",
    name: "Greenway Health (Intergy)",
    vendor: "Greenway",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Certified EHR",
    evidence: "Ambulatory records",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "Greenway FHIR API",
  },
  {
    id: "vista",
    name: "VA VistA / Cerner Millennium (VA)",
    vendor: "U.S. Dept. of Veterans Affairs",
    category: "Hospital EMR",
    setting: "Inpatient",
    status: "Federal EHR",
    evidence: "Veterans care records",
    feeds: ["heart", "metabolic", "fitness", "mind", "exposures"],
    protocol: "VA Lighthouse FHIR API",
  },

  // ─── Patient Portals ─────────────────────────────────────────────
  {
    id: "mychart",
    name: "MyChart",
    vendor: "Epic Systems",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Most-used U.S. patient portal",
    evidence: "Visit notes, labs, after-visit summaries, messaging, meds",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "MyChart SMART-on-FHIR + OAuth 2.0 (per-user)",
  },
  {
    id: "followmyhealth",
    name: "FollowMyHealth",
    vendor: "Veradigm",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Cross-provider patient portal",
    evidence: "Aggregated records from multiple practices",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "FollowMyHealth FHIR + OAuth",
  },
  {
    id: "healow",
    name: "healow",
    vendor: "eClinicalWorks",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Patient app for eCW practices",
    evidence: "Appointments, labs, meds, vitals tracking",
    feeds: ["heart", "metabolic", "fitness", "exposures"],
    protocol: "healow FHIR + OAuth",
  },
  {
    id: "athenapatient",
    name: "athenaPatient",
    vendor: "athenahealth",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Patient app for athenahealth practices",
    evidence: "Records, results, messaging",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "athena FHIR + OAuth",
  },
  {
    id: "nextgen-patient",
    name: "NextGen Patient Portal",
    vendor: "NextGen",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Patient portal",
    evidence: "Records, results",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "NextGen FHIR + OAuth",
  },
  {
    id: "myhealthevet",
    name: "My HealtheVet",
    vendor: "U.S. Dept. of Veterans Affairs",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "VA patient portal",
    evidence: "Veterans health records, meds, appts",
    feeds: ["heart", "metabolic", "fitness", "mind", "exposures"],
    protocol: "VA Lighthouse Patient API + OAuth",
  },
  {
    id: "kp-app",
    name: "Kaiser Permanente app",
    vendor: "Kaiser Permanente",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Integrated payer–provider portal",
    evidence: "KP records, labs, e-visits, pharmacy",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "KP FHIR + OAuth (KP members only)",
  },
  {
    id: "one-medical",
    name: "One Medical",
    vendor: "One Medical (Amazon)",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Membership primary care portal",
    evidence: "Primary care visits, labs, messages",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "One Medical API + OAuth",
  },
  {
    id: "teladoc",
    name: "Teladoc",
    vendor: "Teladoc Health",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Telehealth visit records",
    evidence: "Virtual visit notes, e-prescriptions",
    feeds: ["heart", "metabolic", "mind", "exposures"],
    protocol: "Teladoc FHIR / partner API",
  },
  {
    id: "amwell",
    name: "Amwell",
    vendor: "American Well",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Telehealth visit records",
    evidence: "Virtual visit notes",
    feeds: ["heart", "mind", "exposures"],
    protocol: "Amwell partner API",
  },
  {
    id: "mdlive",
    name: "MDLIVE",
    vendor: "Evernorth (Cigna)",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Telehealth visit records",
    evidence: "Virtual visit notes",
    feeds: ["heart", "mind", "exposures"],
    protocol: "MDLIVE partner API",
  },
  {
    id: "doctorondemand",
    name: "Doctor On Demand",
    vendor: "Included Health",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Telehealth visit records",
    evidence: "Virtual visit notes",
    feeds: ["heart", "mind", "exposures"],
    protocol: "DoD partner API",
  },
  {
    id: "carequality",
    name: "Carequality / CommonWell",
    vendor: "Carequality / CommonWell",
    category: "Patient Portal",
    setting: "Outpatient",
    status: "Cross-network health record exchange",
    evidence: "Pulls records from any participating provider",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "IHE XCA / FHIR Bulk Data",
  },

  // ─── Apple/Google health aggregators ──────────────────────────────
  {
    id: "apple-health",
    name: "Apple Health (HealthKit)",
    vendor: "Apple",
    category: "Health aggregator",
    setting: "Outpatient",
    status: "iOS system health store",
    evidence: "Aggregates wearables, apps, clinical records",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "Native iOS HealthKit (companion app)",
  },
  {
    id: "google-fit",
    name: "Google Health Connect",
    vendor: "Google",
    category: "Health aggregator",
    setting: "Outpatient",
    status: "Android system health store",
    evidence: "Aggregates Android wearables and apps",
    feeds: ["heart", "metabolic", "fitness", "sleep", "exposures"],
    protocol: "Native Android Health Connect API",
  },
  {
    id: "samsung-health",
    name: "Samsung Health",
    vendor: "Samsung",
    category: "Health aggregator",
    setting: "Outpatient",
    status: "Samsung ecosystem health store",
    evidence: "Steps, HR, sleep, body composition",
    feeds: ["heart", "fitness", "sleep", "metabolic"],
    protocol: "Samsung Health Data SDK",
  },

  // ─── Wearables / fitness apps (extra) ─────────────────────────────
  {
    id: "oura",
    name: "Oura Ring",
    vendor: "Oura",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "Sleep stages, HRV, temperature, readiness",
    feeds: ["sleep", "heart", "fitness"],
    protocol: "Oura Cloud API + OAuth",
  },
  {
    id: "whoop",
    name: "Whoop",
    vendor: "Whoop",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "Strain, recovery, HRV, sleep",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "Whoop API + OAuth",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    vendor: "Garmin",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "Activity, HR, VO2max, sleep, stress",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "Garmin Health API + OAuth",
  },
  {
    id: "polar",
    name: "Polar",
    vendor: "Polar Electro",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "HR, HRV, training load",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "Polar AccessLink API + OAuth",
  },
  {
    id: "coros",
    name: "COROS",
    vendor: "COROS",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "Endurance metrics, sleep",
    feeds: ["heart", "fitness", "sleep"],
    protocol: "COROS Open API",
  },
  {
    id: "suunto",
    name: "Suunto",
    vendor: "Suunto",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer wearable",
    evidence: "Activity, HR, dive metrics",
    feeds: ["fitness", "heart"],
    protocol: "Suunto Partner API",
  },
  {
    id: "biostrap",
    name: "Biostrap",
    vendor: "Biostrap",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "PPG-based wearable",
    evidence: "HRV, SpO2, sleep",
    feeds: ["heart", "sleep"],
    protocol: "Biostrap API + OAuth",
  },
  {
    id: "eight-sleep",
    name: "Eight Sleep Pod",
    vendor: "Eight Sleep",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Smart mattress / sleep tracker",
    evidence: "Sleep stages, HR, HRV, temperature",
    feeds: ["sleep", "heart"],
    protocol: "Eight Sleep API",
  },
  {
    id: "muse",
    name: "Muse EEG headband",
    vendor: "InteraXon",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "Consumer EEG",
    evidence: "Meditation, sleep EEG",
    feeds: ["mind", "sleep"],
    protocol: "Muse Direct / partner API",
  },
  {
    id: "empatica",
    name: "Empatica EmbracePlus",
    vendor: "Empatica",
    category: "Wearable / fitness",
    setting: "Outpatient",
    status: "FDA-cleared (seizure detection)",
    evidence: "EDA, HR, temperature, seizure alerts",
    feeds: ["mind", "heart"],
    protocol: "Empatica Cloud API",
  },

  // ─── BP / cardiac home devices ────────────────────────────────────
  {
    id: "omron",
    name: "Omron Connect",
    vendor: "Omron",
    category: "Home cardiac device",
    setting: "Outpatient",
    status: "FDA-cleared home BP cuffs",
    evidence: "Home BP and HR readings",
    feeds: ["heart"],
    protocol: "Omron Connect API",
  },
  {
    id: "qardio",
    name: "Qardio",
    vendor: "Qardio",
    category: "Home cardiac device",
    setting: "Outpatient",
    status: "FDA-cleared BP / ECG / scale",
    evidence: "Home BP, ECG, weight",
    feeds: ["heart", "metabolic"],
    protocol: "Qardio API + OAuth",
  },
  {
    id: "ihealth",
    name: "iHealth",
    vendor: "iHealth Labs",
    category: "Home cardiac device",
    setting: "Outpatient",
    status: "FDA-cleared BP, glucose, oximeter",
    evidence: "BP, SpO2, glucose, weight",
    feeds: ["heart", "metabolic"],
    protocol: "iHealth Cloud API",
  },
  {
    id: "zio",
    name: "iRhythm Zio Patch",
    vendor: "iRhythm",
    category: "Home cardiac device",
    setting: "Outpatient",
    status: "FDA 510(k) ambulatory ECG",
    evidence: "Long-term arrhythmia monitoring",
    feeds: ["heart"],
    protocol: "iRhythm physician report PDF / FHIR",
  },
  {
    id: "biobeat",
    name: "Biobeat",
    vendor: "Biobeat",
    category: "Home cardiac device",
    setting: "Outpatient",
    status: "FDA-cleared cuffless BP",
    evidence: "Continuous BP, HR, SpO2",
    feeds: ["heart"],
    protocol: "Biobeat Cloud API",
  },

  // ─── Nutrition / activity apps ────────────────────────────────────
  {
    id: "myfitnesspal",
    name: "MyFitnessPal",
    vendor: "MyFitnessPal",
    category: "Nutrition / activity app",
    setting: "Outpatient",
    status: "Consumer nutrition log",
    evidence: "Daily macros, calories, exercise",
    feeds: ["metabolic", "exposures", "fitness"],
    protocol: "MyFitnessPal API + OAuth",
  },
  {
    id: "cronometer",
    name: "Cronometer",
    vendor: "Cronometer",
    category: "Nutrition / activity app",
    setting: "Outpatient",
    status: "Consumer nutrition log (micronutrient detail)",
    evidence: "Macros + micronutrients",
    feeds: ["metabolic", "exposures"],
    protocol: "Cronometer Gold API",
  },
  {
    id: "strava",
    name: "Strava",
    vendor: "Strava",
    category: "Nutrition / activity app",
    setting: "Outpatient",
    status: "Consumer activity tracker",
    evidence: "Runs, rides, workouts, HR",
    feeds: ["fitness", "heart"],
    protocol: "Strava API + OAuth",
  },
  {
    id: "peloton",
    name: "Peloton",
    vendor: "Peloton Interactive",
    category: "Nutrition / activity app",
    setting: "Outpatient",
    status: "Connected fitness platform",
    evidence: "Workouts, HR, output",
    feeds: ["fitness", "heart"],
    protocol: "Peloton API",
  },
  {
    id: "hevy",
    name: "Hevy / Strong",
    vendor: "Hevy / Strong",
    category: "Nutrition / activity app",
    setting: "Outpatient",
    status: "Strength training log",
    evidence: "Sets, reps, volume",
    feeds: ["fitness"],
    protocol: "App export / API",
  },

  // ─── Mental health apps (extra) ───────────────────────────────────
  {
    id: "headspace",
    name: "Headspace",
    vendor: "Headspace Health",
    category: "Mental-health app",
    setting: "Outpatient",
    status: "Meditation / CBT content",
    evidence: "Session frequency, mood",
    feeds: ["mind"],
    protocol: "Headspace partner API",
  },
  {
    id: "daylio",
    name: "Daylio",
    vendor: "Daylio",
    category: "Mental-health app",
    setting: "Outpatient",
    status: "Mood tracker",
    evidence: "Daily mood + activities",
    feeds: ["mind"],
    protocol: "Daylio CSV export",
  },
  {
    id: "bearable",
    name: "Bearable",
    vendor: "Bearable",
    category: "Mental-health app",
    setting: "Outpatient",
    status: "Symptom / mood / med tracker",
    evidence: "Self-reported symptoms, meds, mood",
    feeds: ["mind", "exposures"],
    protocol: "Bearable CSV export",
  },

  // ─── Additional Prescription Digital Therapeutics ─────────────────
  {
    id: "mahana",
    name: "Mahana IBS",
    vendor: "Mahana Therapeutics",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA 510(k) (CBT for IBS)",
    evidence: "RCT-based symptom reduction",
    feeds: ["mind", "metabolic"],
    protocol: "Mahana partner API",
  },
  {
    id: "nightware",
    name: "NightWare",
    vendor: "NightWare",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (PTSD nightmares, Apple Watch)",
    evidence: "Trial data — nightmare reduction",
    feeds: ["mind", "sleep"],
    protocol: "NightWare HIPAA API",
  },
  {
    id: "rejoyn",
    name: "Rejoyn",
    vendor: "Otsuka / Click Therapeutics",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (adjunctive MDD)",
    evidence: "Pivotal RCT — depression symptom reduction",
    feeds: ["mind"],
    protocol: "Click Therapeutics partner API",
  },
  {
    id: "luminopia",
    name: "Luminopia One",
    vendor: "Luminopia",
    category: "Prescription Digital Therapeutic",
    setting: "Outpatient",
    status: "FDA De Novo (amblyopia)",
    evidence: "Pivotal RCT — visual acuity",
    feeds: ["mind"],
    protocol: "Luminopia partner API",
  },

  // ─── CGM (extra) ──────────────────────────────────────────────────
  {
    id: "stelo",
    name: "Dexcom Stelo",
    vendor: "Dexcom",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA-cleared OTC CGM (non-diabetic)",
    evidence: "Glucose trends for metabolic health",
    feeds: ["metabolic"],
    protocol: "Dexcom Stelo API",
  },
  {
    id: "lingo",
    name: "Abbott Lingo",
    vendor: "Abbott",
    category: "Continuous Glucose Monitor",
    setting: "Outpatient",
    status: "FDA-cleared OTC CGM (wellness)",
    evidence: "Glucose patterns",
    feeds: ["metabolic"],
    protocol: "Abbott Lingo API",
  },

  // ─── Pharmacy ─────────────────────────────────────────────────────
  {
    id: "surescripts",
    name: "Surescripts Medication History",
    vendor: "Surescripts",
    category: "Pharmacy",
    setting: "Outpatient",
    status: "National e-prescription network",
    evidence: "Dispensed-medication history across pharmacies",
    feeds: ["exposures", "metabolic", "heart", "mind"],
    protocol: "Surescripts API (provider-side)",
  },
  {
    id: "goodrx",
    name: "GoodRx",
    vendor: "GoodRx",
    category: "Pharmacy",
    setting: "Outpatient",
    status: "Prescription-fill tracker",
    evidence: "Pharmacy fills + pricing",
    feeds: ["exposures"],
    protocol: "GoodRx partner API",
  },

  // ─── Lab / imaging direct-to-patient ──────────────────────────────
  {
    id: "labcorp",
    name: "Labcorp Patient",
    vendor: "Labcorp",
    category: "Lab / imaging",
    setting: "Outpatient",
    status: "Direct lab results to patient",
    evidence: "Outpatient lab panels",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "Labcorp Patient API",
  },
  {
    id: "quest",
    name: "Quest MyQuest",
    vendor: "Quest Diagnostics",
    category: "Lab / imaging",
    setting: "Outpatient",
    status: "Direct lab results to patient",
    evidence: "Outpatient lab panels",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "Quest MyQuest API",
  },
  {
    id: "23andme",
    name: "23andMe",
    vendor: "23andMe",
    category: "Lab / imaging",
    setting: "Outpatient",
    status: "Consumer genomics",
    evidence: "Pharmacogenomic + risk variants",
    feeds: ["exposures", "heart", "metabolic"],
    protocol: "23andMe Personal Genome API",
  },


  {
    id: "manual",
    name: "Manual entry",
    vendor: "Patient",
    category: "Patient-supplied",
    setting: "Outpatient",
    status: "Self-report",
    evidence: "Subjective; useful for symptoms, adherence",
    feeds: ["heart", "metabolic", "fitness", "sleep", "mind", "exposures"],
    protocol: "Built-in form (already available)",
  },
  {
    id: "voice",
    name: "Voice note → transcript",
    vendor: "Patient",
    category: "Patient-supplied",
    setting: "Outpatient",
    status: "Self-report",
    evidence: "Captures HPI, ROS, symptom logs",
    feeds: ["mind", "exposures"],
    protocol: "Browser MediaRecorder → STT (Lovable AI Gateway)",
  },
  {
    id: "scan",
    name: "Uploaded document / scan",
    vendor: "Patient",
    category: "Patient-supplied",
    setting: "Outpatient",
    status: "OCR + structured extraction",
    evidence: "Outside lab reports, imaging, prescriptions",
    feeds: ["heart", "metabolic", "exposures"],
    protocol: "Upload → OCR → LLM extractor (Lovable AI)",
  },
];

const STORAGE_KEY = "hp-connections-v1";

function useConnected() {
  const [set, setSet] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSet(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(set));
    } catch {}
  }, [set]);
  return [set, setSet] as const;
}

function Connections() {
  const [connected, setConnected] = useConnected();
  const toggle = (id: string) =>
    setConnected((c) => ({ ...c, [id]: !c[id] }));

  const byCategory = SOURCES.reduce<Record<string, Source[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const allConnected = connectedCount === SOURCES.length;

  const connectAll = () => {
    const next: Record<string, boolean> = {};
    for (const s of SOURCES) next[s.id] = true;
    setConnected(next);
  };
  const disconnectAll = () => {
    if (!confirm("Disconnect every source?")) return;
    setConnected({});
  };

  return (
    <AppShell>
      <Link to="/" className="text-xs uppercase tracking-[0.22em] font-extrabold underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-serif text-4xl font-black">Data Connections</h1>
      <p className="mt-2 max-w-4xl font-semibold leading-relaxed">
        Every FDA-cleared device, prescription digital therapeutic, hospital EMR, and
        patient-supplied source that can populate this passport — mapped to the Health
        Passport box it feeds. Connect a source to route its data into the matching
        Inpatient / Outpatient / Lifetime stream on the Clinical Timeline.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={allConnected ? disconnectAll : connectAll}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-extrabold ${
            allConnected
              ? "bg-foreground text-background"
              : "bg-[#d9ccef] text-foreground"
          }`}
        >
          {allConnected ? "Disconnect all" : `Connect all ${SOURCES.length} sources`}
        </button>
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
          {connectedCount} of {SOURCES.length} sources connected
        </span>
      </div>

      <div className="mt-6">
        <IngestionHub />
      </div>


      <div className="mt-6 flex flex-col gap-8">
        {Object.entries(byCategory).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="font-serif text-2xl font-black border-b border-foreground/40 pb-1">
              {cat}
            </h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
              {items.map((s) => {
                const on = !!connected[s.id];
                return (
                  <article key={s.id} className="cloud-panel p-4 flex flex-col h-full">
                    <header className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg font-black leading-tight">
                        {s.name}
                      </h3>
                      <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold opacity-70">
                        {s.setting}
                      </span>
                    </header>
                    <div className="text-[11px] font-bold opacity-80">{s.vendor}</div>
                    <div className="mt-2 text-[12px] font-semibold leading-snug">
                      <span className="font-black uppercase tracking-wider text-[10px]">
                        Status:
                      </span>{" "}
                      {s.status}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold leading-snug">
                      <span className="font-black uppercase tracking-wider text-[10px]">
                        Evidence:
                      </span>{" "}
                      {s.evidence}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold leading-snug">
                      <span className="font-black uppercase tracking-wider text-[10px]">
                        Integration:
                      </span>{" "}
                      {s.protocol}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {s.feeds.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-[color:var(--mint)]"
                        >
                          {BOX_LABEL[b]}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-80">
                        {on ? "● Connected" : "○ Not connected"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold ${
                          on
                            ? "bg-foreground text-background"
                            : "bg-[#ffc2d2] text-foreground"
                        }`}
                      >
                        {on ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 max-w-4xl text-xs font-semibold opacity-70 leading-relaxed">
        Note on scope: real two-way integrations with hospital EMRs (SMART-on-FHIR / OAuth),
        Apple HealthKit (native iOS companion), CGM vendor APIs (Dexcom, Abbott, Medtronic),
        and PDT vendor APIs each require provider-side credentials, BAA / HIPAA agreements,
        and in some cases native mobile code. The Connect buttons above register a source as
        active in this passport — wiring each vendor's live data feed is enabled once those
        credentials are added under Lovable Cloud secrets.
      </p>
    </AppShell>
  );
}
