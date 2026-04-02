ALTER TABLE quotes ADD COLUMN IF NOT EXISTS token text unique default encode(gen_random_bytes(32), 'hex');
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_name text;
