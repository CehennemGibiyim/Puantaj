ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS email text;
