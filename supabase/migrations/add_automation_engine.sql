CREATE TABLE automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  automation_type text not null,
  entity_type text,
  entity_id uuid,
  contact_name text,
  status text default 'success',
  message_sent text,
  error text,
  created_at timestamptz default now()
);

CREATE TABLE automation_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade unique,
  quote_followup_enabled bool default true,
  quote_followup_hours int default 48,
  quote_nudge_enabled bool default true,
  quote_expiry_enabled bool default true,
  invoice_reminder_enabled bool default true,
  invoice_due_reminder_enabled bool default true,
  invoice_overdue_days_1 int default 1,
  invoice_overdue_days_2 int default 3,
  invoice_overdue_days_3 int default 7,
  auto_invoice_on_complete bool default true,
  review_request_enabled bool default true,
  review_request_days int default 3,
  appointment_reminder_enabled bool default true,
  appointment_reminder_hours int default 24,
  reactivation_enabled bool default true,
  reactivation_days int default 180,
  created_at timestamptz default now()
);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_org_isolation" ON automation_runs
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_settings_org_isolation" ON automation_settings
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
