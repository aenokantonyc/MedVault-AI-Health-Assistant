-- Core data tables for non-auth-first product flows.
-- user_id is text intentionally so demo/non-auth mode works now; it can map to auth.uid() later.

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_name text not null,
  file_type text not null,
  record_type text not null default 'General',
  storage_path text,
  upload_date timestamptz not null default now(),
  disease text,
  doctor text,
  hospital text,
  medicine text,
  lab_value text,
  extracted_payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'uploaded',
  is_processed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_timeline (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_date timestamptz not null default now(),
  event_type text not null,
  title text not null,
  description text,
  record_id uuid references public.medical_records(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.care_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  reminder_type text not null,
  title text not null,
  description text,
  reminder_time text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  medical_record_id uuid references public.medical_records(id) on delete set null,
  summary text not null,
  risk text not null,
  recommendations text[] not null default '{}'::text[],
  model_name text,
  confidence numeric(5,2),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_medical_records_user_upload_date
  on public.medical_records(user_id, upload_date desc);

create index if not exists idx_timeline_user_event_date
  on public.health_timeline(user_id, event_date desc);

create index if not exists idx_reminders_user_created_at
  on public.care_reminders(user_id, created_at desc);

create index if not exists idx_ai_analyses_user_generated_at
  on public.ai_analyses(user_id, generated_at desc);
