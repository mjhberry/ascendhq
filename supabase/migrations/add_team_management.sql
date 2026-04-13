-- Invitation system
CREATE TABLE invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'technician',
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_org_isolation" ON invitations
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Extended profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text default 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color text default '#3b6cb0';
