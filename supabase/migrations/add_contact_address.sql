ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country text default 'US';
