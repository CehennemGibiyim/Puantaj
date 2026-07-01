-- Departmanlar tablosu
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  manager_name text,
  created_at timestamptz DEFAULT now()
);

-- Personel tablosu
CREATE TABLE personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Puantaj kayıtları
CREATE TABLE timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid REFERENCES personnel(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('G', 'G2', 'N', 'N2', 'İ', 'R', 'ÜY', 'B', 'B2', '')),
  hours_worked numeric(4,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(personnel_id, entry_date)
);

-- Resmi tatiller
CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS etkinleştirme
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- RLS politikaları (public okuma/yazma - basit kullanım için)
CREATE POLICY "public_read_departments" ON departments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_write_departments" ON departments FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "public_read_personnel" ON personnel FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_write_personnel" ON personnel FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "public_read_timesheet" ON timesheet_entries FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_write_timesheet" ON timesheet_entries FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "public_read_holidays" ON holidays FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public_write_holidays" ON holidays FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Örnek departman
INSERT INTO departments (name, manager_name) VALUES 
  ('CERRAHİ 1-2', 'NECLA YILDIZ');

-- Örnek personel
INSERT INTO personnel (name, department_id) 
SELECT p.name, d.id FROM departments d, (
  VALUES 
    ('BURHAN YILDIRIM'),
    ('AZAM ALTUN'),
    ('MUSTAFA UYGUR'),
    ('ÖMER AKBIYIK'),
    ('EMRAH ALPASLAN'),
    ('UYGUR AKSU'),
    ('ECE GÖREN')
) AS p(name)
WHERE d.name = 'CERRAHİ 1-2';

-- Örnek izin girişleri
INSERT INTO timesheet_entries (personnel_id, entry_date, shift_type, hours_worked)
SELECT p.id, '2026-06-01'::date + i, 'İ', 0
FROM personnel p
CROSS JOIN generate_series(0, 4) AS i
WHERE p.name = 'AZAM ALTUN';

-- Haziran 2026 bayramı
INSERT INTO holidays (holiday_date, name) VALUES 
  ('2026-06-19', 'Kurban Bayramı');
