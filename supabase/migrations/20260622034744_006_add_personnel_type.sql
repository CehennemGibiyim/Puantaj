ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS personnel_type text NOT NULL DEFAULT 'MEMUR'
  CHECK (personnel_type IN ('ISCI', 'MEMUR'));
