-- Mevcut hatalı tatil verisini temizle
DELETE FROM holidays;

-- 2025 Türkiye Resmi Tatilleri
INSERT INTO holidays (holiday_date, name) VALUES
  -- Sabit tatiller
  ('2025-01-01', 'Yılbaşı'),
  ('2025-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'),
  ('2025-05-01', 'Emek ve Dayanışma Bayramı'),
  ('2025-05-19', 'Atatürk''ü Anma Gençlik ve Spor Bayramı'),
  ('2025-07-15', 'Demokrasi ve Millî Birlik Günü'),
  ('2025-08-30', 'Zafer Bayramı'),
  ('2025-10-28', 'Cumhuriyet Bayramı'),
  ('2025-10-29', 'Cumhuriyet Bayramı'),
  -- Ramazan Bayramı 2025
  ('2025-03-29', 'Ramazan Bayramı Arifesi'),
  ('2025-03-30', 'Ramazan Bayramı 1. Günü'),
  ('2025-03-31', 'Ramazan Bayramı 2. Günü'),
  ('2025-04-01', 'Ramazan Bayramı 3. Günü'),
  -- Kurban Bayramı 2025
  ('2025-06-05', 'Kurban Bayramı Arifesi'),
  ('2025-06-06', 'Kurban Bayramı 1. Günü'),
  ('2025-06-07', 'Kurban Bayramı 2. Günü'),
  ('2025-06-08', 'Kurban Bayramı 3. Günü'),
  ('2025-06-09', 'Kurban Bayramı 4. Günü'),

-- 2026 Türkiye Resmi Tatilleri
  -- Sabit tatiller
  ('2026-01-01', 'Yılbaşı'),
  ('2026-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'),
  ('2026-05-01', 'Emek ve Dayanışma Bayramı'),
  ('2026-05-19', 'Atatürk''ü Anma Gençlik ve Spor Bayramı'),
  ('2026-07-15', 'Demokrasi ve Millî Birlik Günü'),
  ('2026-08-30', 'Zafer Bayramı'),
  ('2026-10-28', 'Cumhuriyet Bayramı'),
  ('2026-10-29', 'Cumhuriyet Bayramı'),
  -- Ramazan Bayramı 2026 (20-22 Mart)
  ('2026-03-19', 'Ramazan Bayramı Arifesi'),
  ('2026-03-20', 'Ramazan Bayramı 1. Günü'),
  ('2026-03-21', 'Ramazan Bayramı 2. Günü'),
  ('2026-03-22', 'Ramazan Bayramı 3. Günü'),
  -- Kurban Bayramı 2026 (27-30 Mayıs)
  ('2026-05-26', 'Kurban Bayramı Arifesi'),
  ('2026-05-27', 'Kurban Bayramı 1. Günü'),
  ('2026-05-28', 'Kurban Bayramı 2. Günü'),
  ('2026-05-29', 'Kurban Bayramı 3. Günü'),
  ('2026-05-30', 'Kurban Bayramı 4. Günü');
