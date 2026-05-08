-- Demo policies for no-auth development mode.
-- Tighten these policies before production rollout.

insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', false)
on conflict (id) do nothing;

alter table if exists public.medical_records enable row level security;
alter table if exists public.health_timeline enable row level security;
alter table if exists public.care_reminders enable row level security;
alter table if exists public.ai_analyses enable row level security;

drop policy if exists "demo medical_records full access" on public.medical_records;
create policy "demo medical_records full access"
on public.medical_records
for all
using (true)
with check (true);

drop policy if exists "demo health_timeline full access" on public.health_timeline;
create policy "demo health_timeline full access"
on public.health_timeline
for all
using (true)
with check (true);

drop policy if exists "demo care_reminders full access" on public.care_reminders;
create policy "demo care_reminders full access"
on public.care_reminders
for all
using (true)
with check (true);

drop policy if exists "demo ai_analyses full access" on public.ai_analyses;
create policy "demo ai_analyses full access"
on public.ai_analyses
for all
using (true)
with check (true);

drop policy if exists "demo storage read" on storage.objects;
create policy "demo storage read"
on storage.objects
for select
using (bucket_id = 'medical-records');

drop policy if exists "demo storage insert" on storage.objects;
create policy "demo storage insert"
on storage.objects
for insert
with check (bucket_id = 'medical-records');

drop policy if exists "demo storage update" on storage.objects;
create policy "demo storage update"
on storage.objects
for update
using (bucket_id = 'medical-records')
with check (bucket_id = 'medical-records');

drop policy if exists "demo storage delete" on storage.objects;
create policy "demo storage delete"
on storage.objects
for delete
using (bucket_id = 'medical-records');
