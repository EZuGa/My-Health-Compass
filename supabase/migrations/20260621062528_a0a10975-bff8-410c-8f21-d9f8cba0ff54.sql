CREATE TABLE public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual','photo','voice','import','other')),
  calories numeric not null default 0,
  carbs_g numeric,
  sugar_g numeric,
  sat_fat_g numeric,
  sodium_mg numeric,
  items jsonb,
  totals jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_entries TO authenticated;
GRANT ALL ON public.nutrition_entries TO service_role;

ALTER TABLE public.nutrition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own nutrition entries"
  ON public.nutrition_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own nutrition entries"
  ON public.nutrition_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own nutrition entries"
  ON public.nutrition_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own nutrition entries"
  ON public.nutrition_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX nutrition_entries_user_date_idx
  ON public.nutrition_entries (user_id, occurred_at DESC);

CREATE TRIGGER nutrition_entries_set_updated_at
  BEFORE UPDATE ON public.nutrition_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();