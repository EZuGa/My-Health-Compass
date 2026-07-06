
-- Patients: one record per person, owned by a Lovable user
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pid text NOT NULL,
  display_name text,
  dob date,
  sex text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, pid)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages patients" ON public.patients
  FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER patients_set_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper to check patient ownership without recursive RLS
CREATE OR REPLACE FUNCTION public.owns_patient(_patient_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = _patient_id AND owner_user_id = auth.uid()
  )
$$;

-- Observations: every extracted value lives here, routed to a section/box
CREATE TABLE public.patient_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  section text NOT NULL,
  box text NOT NULL,
  metric text NOT NULL,
  value_text text,
  value_num numeric,
  unit text,
  observed_at timestamptz NOT NULL DEFAULT now(),
  source_kind text,
  source_label text,
  setting text,
  note text,
  batch_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_observations_patient_observed_idx
  ON public.patient_observations (patient_id, observed_at DESC);
CREATE INDEX patient_observations_section_idx
  ON public.patient_observations (patient_id, section, observed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_observations TO authenticated;
GRANT ALL ON public.patient_observations TO service_role;
ALTER TABLE public.patient_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages observations" ON public.patient_observations
  FOR ALL TO authenticated
  USING (public.owns_patient(patient_id))
  WITH CHECK (public.owns_patient(patient_id));

CREATE TRIGGER patient_observations_set_updated_at
  BEFORE UPDATE ON public.patient_observations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Documents: original uploads / transcripts / summaries
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  source_kind text,
  source_label text,
  mime text,
  filename text,
  storage_path text,
  summary text,
  raw_text text,
  observation_count integer NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_documents_patient_occurred_idx
  ON public.patient_documents (patient_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_documents TO authenticated;
GRANT ALL ON public.patient_documents TO service_role;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages documents" ON public.patient_documents
  FOR ALL TO authenticated
  USING (public.owns_patient(patient_id))
  WITH CHECK (public.owns_patient(patient_id));

CREATE TRIGGER patient_documents_set_updated_at
  BEFORE UPDATE ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Toxins: ToxCheck saves
CREATE TABLE public.patient_toxins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  severity text,
  source text,
  note text,
  identified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_toxins_patient_idx
  ON public.patient_toxins (patient_id, identified_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_toxins TO authenticated;
GRANT ALL ON public.patient_toxins TO service_role;
ALTER TABLE public.patient_toxins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages toxins" ON public.patient_toxins
  FOR ALL TO authenticated
  USING (public.owns_patient(patient_id))
  WITH CHECK (public.owns_patient(patient_id));

CREATE TRIGGER patient_toxins_set_updated_at
  BEFORE UPDATE ON public.patient_toxins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add patient_id to existing nutrition_entries so nutrition rolls up under a patient too
ALTER TABLE public.nutrition_entries
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS nutrition_entries_patient_idx
  ON public.nutrition_entries (patient_id, occurred_at DESC);
