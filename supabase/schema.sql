-- AscendHQ Database Schema
-- Run this in your Supabase SQL editor

-- Core multi-tenancy
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  category text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  full_name text,
  email text,
  role text default 'owner',
  avatar_url text,
  created_at timestamptz default now()
);

-- CRM
create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  type text default 'residential',
  status text default 'active',
  notes text,
  last_contact_at timestamptz,
  lifetime_value numeric default 0,
  created_at timestamptz default now()
);

-- Jobs
create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  description text,
  status text default 'new',
  priority text default 'normal',
  assigned_to uuid references profiles(id) on delete set null,
  value numeric default 0,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Billing
create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  number text not null,
  status text default 'draft',
  subtotal numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric default 0,
  total numeric default 0,
  created_at timestamptz default now()
);

-- Schedule
create table appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  name text not null,
  type text,
  storage_path text,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- Marketing / Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text,
  service text,
  status text default 'new',
  value numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- AI Activity log
create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  module text,
  prompt text,
  response text,
  tokens_used int,
  created_at timestamptz default now()
);

-- Automations
create table automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger text not null,
  status text default 'active',
  run_count int default 0,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- =====================
-- Row Level Security
-- =====================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table jobs enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table appointments enable row level security;
alter table documents enable row level security;
alter table leads enable row level security;
alter table ai_logs enable row level security;
alter table automations enable row level security;

-- Helper function to get current user's org_id
create or replace function get_user_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Profiles: users can see/update their own profile
create policy "profiles_own" on profiles
  for all using (id = auth.uid());

-- Organizations: users can see their own org
create policy "organizations_own" on organizations
  for all using (id = get_user_org_id());

-- All other tables: org isolation
create policy "contacts_org_isolation" on contacts
  for all using (org_id = get_user_org_id());

create policy "jobs_org_isolation" on jobs
  for all using (org_id = get_user_org_id());

create policy "invoices_org_isolation" on invoices
  for all using (org_id = get_user_org_id());

create policy "invoice_items_org_isolation" on invoice_items
  for all using (org_id = get_user_org_id());

create policy "appointments_org_isolation" on appointments
  for all using (org_id = get_user_org_id());

create policy "documents_org_isolation" on documents
  for all using (org_id = get_user_org_id());

create policy "leads_org_isolation" on leads
  for all using (org_id = get_user_org_id());

create policy "ai_logs_org_isolation" on ai_logs
  for all using (org_id = get_user_org_id());

create policy "automations_org_isolation" on automations
  for all using (org_id = get_user_org_id());
