import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "zrunva.consent.v1";

type ConsentRecord = {
  signature: string;
  signedAt: string; // ISO
  version: 1;
};

function loadConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed?.signature || !parsed?.signedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsentLocal(rec: ConsentRecord) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* ignore */
  }
}

export function ConsentGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadConsent();
      if (local) {
        if (!cancelled) {
          setConsent(local);
          setReady(true);
        }
        // Best-effort: mirror to user metadata so future devices skip the gate.
        try {
          const { data } = await supabase.auth.getUser();
          const meta = data.user?.user_metadata as { consent?: ConsentRecord } | undefined;
          if (data.user && !meta?.consent) {
            await supabase.auth.updateUser({ data: { consent: local } });
          }
        } catch {
          /* ignore */
        }
        return;
      }
      // No local record — check server-side user metadata.
      try {
        const { data } = await supabase.auth.getUser();
        const meta = data.user?.user_metadata as { consent?: ConsentRecord } | undefined;
        if (meta?.consent?.signature && meta.consent.signedAt) {
          saveConsentLocal(meta.consent);
          if (!cancelled) setConsent(meta.consent);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  if (!consent) {
    const canSign = agreed && signature.trim().length >= 2;
    const onSign = (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSign) return;
      const rec: ConsentRecord = {
        signature: signature.trim(),
        signedAt: new Date().toISOString(),
        version: 1,
      };
      saveConsentLocal(rec);
      setConsent(rec);
      // Persist to the user's account so future sessions/devices skip the gate.
      supabase.auth.updateUser({ data: { consent: rec } }).catch(() => {
        /* ignore */
      });
    };

    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <article className="rounded-xl border border-foreground/20 bg-background p-8 shadow-xl">
            <header className="mb-6 border-b border-foreground/15 pb-4">
              <h1 className="text-2xl font-bold">
                Informed Consent for Electronic Health Data Access, Aggregation, and Storage
              </h1>
              <p className="mt-1 text-sm opacity-80">ZRUNVA Health Passport Application</p>
            </header>

            <div className="space-y-5 text-[14px] leading-relaxed">
              <p>
                By signing below, I, the undersigned patient (or authorized legal representative),
                voluntarily and knowingly consent to the following:
              </p>

              <section>
                <h2 className="font-bold">1. Authorization to Access and Aggregate Health Data</h2>
                <p>
                  I authorize ZRUNVA Health Passport ("the App") to electronically access, retrieve,
                  compile, and organize my protected health information ("PHI") from third-party
                  applications, electronic health record systems, patient portals, wearable devices,
                  and any other digitally connected health data sources that I designate. This
                  authorization is granted pursuant to the Health Insurance Portability and
                  Accountability Act of 1996 ("HIPAA"), 45 C.F.R. § 164.508, the 21st Century Cures
                  Act (Pub. L. 114-255), and applicable state privacy laws.
                </p>
              </section>

              <section>
                <h2 className="font-bold">2. Categories of Information Accessed</h2>
                <p>
                  Data accessed may include, but is not limited to: medical records, diagnoses,
                  medications, laboratory results, imaging reports, immunization records, vital
                  signs, biometric data from wearable devices, allergies, surgical history, mental
                  health records (where permitted by law), and any other health-related data stored
                  in connected applications.
                </p>
              </section>

              <section>
                <h2 className="font-bold">3. Purpose</h2>
                <p>
                  The sole purpose of this data aggregation is to create a unified, patient-controlled
                  personal health record ("Health Passport") within the App for the patient's own
                  use, portability, and voluntary sharing with healthcare providers of the patient's
                  choosing.
                </p>
              </section>

              <section>
                <h2 className="font-bold">4. Patient Rights and Protections</h2>
                <p>
                  <strong>Revocability.</strong> This consent may be revoked at any time, in writing
                  or electronically through the App, effective upon receipt. Revocation shall not
                  affect data actions taken prior to receipt of revocation.
                </p>
                <p>
                  <strong>Voluntariness.</strong> This consent is entirely voluntary. No treatment,
                  payment, enrollment, or eligibility for benefits may be conditioned upon signing
                  this authorization.
                </p>
                <p>
                  <strong>Right to Access and Delete.</strong> I retain the right to access, download,
                  correct, and request deletion of all my data stored within the App, consistent with
                  HIPAA (45 C.F.R. § 164.524), the California Consumer Privacy Act ("CCPA," Cal. Civ.
                  Code § 1798.100 et seq.), and any applicable state data privacy statutes.
                </p>
                <p>
                  <strong>Data Minimization.</strong> The App shall collect only the minimum necessary
                  information required to fulfill the stated purpose.
                </p>
              </section>

              <section>
                <h2 className="font-bold">5. Data Security and Non-Disclosure</h2>
                <p>
                  The App shall maintain administrative, technical, and physical safeguards consistent
                  with HIPAA Security Rule standards (45 C.F.R. §§ 164.302–164.318). My PHI shall not
                  be sold, shared with, or disclosed to any third party without my separate, explicit,
                  written authorization, except as required by law.
                </p>
              </section>

              <section>
                <h2 className="font-bold">6. Limitations and Disclaimers</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    The App is not a medical device, does not provide medical advice, and is not a
                    substitute for professional clinical judgment.
                  </li>
                  <li>
                    Data accuracy depends on the source systems; the App does not independently
                    verify clinical data.
                  </li>
                  <li>
                    Once data is transmitted to the App, it may no longer be covered by the
                    originating entity's HIPAA protections if the App operates as a non-covered
                    entity under HIPAA. I acknowledge and accept this limitation.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold">7. Effective Period</h2>
                <p>
                  This authorization shall remain in effect from the date and time of signature below
                  and shall continue uninterrupted until the App is deactivated or this consent is
                  revoked by me (in writing or electronically through the App). This is a one-time
                  signature mandate; no renewal is required while the App remains active.
                </p>
              </section>

              <section>
                <h2 className="font-bold">8. Acknowledgment</h2>
                <p>
                  I have read and understand this consent. I have had the opportunity to ask
                  questions. I understand the risks, benefits, and limitations described herein. I
                  execute this authorization freely and voluntarily.
                </p>
              </section>
            </div>

            <form onSubmit={onSign} className="mt-8 border-t border-foreground/15 pt-6 space-y-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read, understood, and agree to the terms of this Informed Consent.
                </span>
              </label>

              <div>
                <label className="block text-sm font-bold mb-1" htmlFor="consent-signature">
                  Type your full legal name as signature
                </label>
                <input
                  id="consent-signature"
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Full legal name"
                  className="w-full rounded-md border border-foreground/25 bg-background px-3 py-2 text-base [font-family:'Italianno',cursive] text-2xl"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs opacity-70">
                  Date of signature: {new Date().toLocaleString()}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canSign}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  Sign &amp; Activate App
                </button>
              </div>
            </form>
          </article>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function getConsentRecord(): ConsentRecord | null {
  return loadConsent();
}

export function revokeConsent() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}
