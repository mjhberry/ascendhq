-- Add quotes table
CREATE TABLE quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  description text,
  status text default 'draft',
  line_items jsonb default '[]',
  subtotal numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  valid_until timestamptz,
  accepted_at timestamptz,
  job_id uuid references jobs(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Migrate existing job statuses to pipeline stages
UPDATE jobs SET status = 'accepted'    WHERE status IN ('new', 'scheduled');
UPDATE jobs SET status = 'complete'    WHERE status = 'review';
-- 'in_progress' and 'complete' are unchanged
-- 'cancelled' is preserved for historical records
