# MedVault-AI-Health-Assistant

AI-powered health record platform with:

- Real file upload to Supabase Storage
- Realtime records, timeline, reminders, and AI analysis updates
- Edge Function based report processing and AI insights

## Tech stack

- React + TypeScript + Vite
- Supabase (Postgres, Storage, Realtime, Edge Functions)

## Local app setup

1. Install dependencies

	npm install

2. Create environment file

	Copy .env.example to .env and fill values.

3. Start app

	npm run dev

## Required environment variables

Frontend .env values:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Edge Function secrets (set in Supabase project):

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY

## Database migrations

Migrations included:

- supabase/migrations/20260219141552_create_healthcare_platform_schema.sql
- supabase/migrations/20260407120000_create_core_health_tables.sql
- supabase/migrations/20260407124500_storage_and_realtime_policies.sql

Apply in one of these ways:

1. Supabase CLI (recommended)

	- Install CLI: npm install supabase --save-dev
	- Then run migration commands in your linked project.

2. Supabase SQL Editor

	- Run the SQL files in order listed above.

## Edge Functions to deploy

- supabase/functions/process-medical-record/index.ts
- supabase/functions/generate-health-analysis/index.ts

Deploy using Supabase CLI after linking your project.

## Realtime behavior implemented

- My Records subscribes to medical_records changes
- Record Detail subscribes to current record updates
- Health Timeline subscribes to health_timeline changes
- Care Reminders subscribes to care_reminders changes
- AI Health Analysis subscribes to ai_analyses changes

## Current mode

The project currently supports auth-deferred demo mode for rapid development.
Policies in 20260407124500_storage_and_realtime_policies.sql are intentionally permissive and must be hardened before production.

## Production hardening checklist

- Replace demo RLS policies with per-user ownership policies
- Enforce authenticated storage access
- Add AI request quotas and retry queue for failed processing
- Add audit logs for medical record processing events
