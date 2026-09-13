/*
# Create treatment history, sharing, and vitals tables (single-tenant, no auth)

1. New Tables
- `treatment_history`: Stores treatment sets (past and present) with prescribing doctor,
  date range, status, and condition treated. Each row is one treatment episode.
- `treatment_sharing`: Tracks which doctors each treatment is shared with.
  Has a `hidden` flag so the patient can hide a treatment from a doctor,
  but NOT from the prescribing doctor (enforced in app logic).
- `vitals`: Stores body metrics over time — weight, height, BMI, blood pressure, etc.

2. Security
- All tables have RLS enabled
- All policies use `TO anon, authenticated` since this is a no-auth single-tenant app
- `USING (true)` / `WITH CHECK (true)` is acceptable because the data is intentionally shared/public

3. Seed Data
- Inserts 6 treatment history records spanning past and present
- Inserts sharing records for each treatment with 2-3 doctors each
- Inserts 5 vitals records (weight, height, BMI, blood pressure, heart rate)
*/

CREATE TABLE IF NOT EXISTS treatment_history (
  id text PRIMARY KEY,
  treatment_name text NOT NULL,
  medication text NOT NULL,
  dosage text NOT NULL,
  condition_treated text NOT NULL,
  doctor_name text NOT NULL,
  doctor_specialty text NOT NULL,
  start_date text NOT NULL,
  end_date text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE treatment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_treatment_history" ON treatment_history;
CREATE POLICY "anon_select_treatment_history" ON treatment_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_treatment_history" ON treatment_history;
CREATE POLICY "anon_insert_treatment_history" ON treatment_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_treatment_history" ON treatment_history;
CREATE POLICY "anon_update_treatment_history" ON treatment_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_treatment_history" ON treatment_history;
CREATE POLICY "anon_delete_treatment_history" ON treatment_history FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS treatment_sharing (
  id text PRIMARY KEY,
  treatment_id text NOT NULL REFERENCES treatment_history(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  doctor_specialty text NOT NULL,
  is_prescribing_doctor boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE treatment_sharing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_treatment_sharing" ON treatment_sharing;
CREATE POLICY "anon_select_treatment_sharing" ON treatment_sharing FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_treatment_sharing" ON treatment_sharing;
CREATE POLICY "anon_insert_treatment_sharing" ON treatment_sharing FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_treatment_sharing" ON treatment_sharing;
CREATE POLICY "anon_update_treatment_sharing" ON treatment_sharing FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_treatment_sharing" ON treatment_sharing;
CREATE POLICY "anon_delete_treatment_sharing" ON treatment_sharing FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS vitals (
  id text PRIMARY KEY,
  vital_type text NOT NULL,
  value text NOT NULL,
  unit text NOT NULL,
  date_recorded text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vitals" ON vitals;
CREATE POLICY "anon_select_vitals" ON vitals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vitals" ON vitals;
CREATE POLICY "anon_insert_vitals" ON vitals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vitals" ON vitals;
CREATE POLICY "anon_update_vitals" ON vitals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vitals" ON vitals;
CREATE POLICY "anon_delete_vitals" ON vitals FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO treatment_history (id, treatment_name, medication, dosage, condition_treated, doctor_name, doctor_specialty, start_date, end_date, status, sort_order) VALUES
  ('th1', 'Type 2 Diabetes Management', 'Metformin 500mg', '2x Daily', 'Type 2 Diabetes', 'Dr. Aisha Okonkwo', 'Cardiology', 'Jan 15, 2024', NULL, 'active', 1),
  ('th2', 'Hypertension Treatment', 'Lisinopril 10mg', '1x Daily', 'High Blood Pressure', 'Dr. Aisha Okonkwo', 'Cardiology', 'Mar 3, 2024', NULL, 'active', 2),
  ('th3', 'Cholesterol Management', 'Atorvastatin 20mg', '1x Nightly', 'High Cholesterol', 'Dr. James Lee', 'Endocrinology', 'Jun 10, 2024', NULL, 'active', 3),
  ('th4', 'Daily Cardiovascular Care', 'Aspirin 81mg', '1x Daily', 'Cardiovascular Health', 'Dr. Aisha Okonkwo', 'Cardiology', 'Feb 1, 2024', NULL, 'active', 4),
  ('th5', 'Antibiotic Course', 'Amoxicillin 500mg', '3x Daily', 'Respiratory Infection', 'Dr. Sarah Chen', 'General Medicine', 'Dec 5, 2023', 'Dec 19, 2023', 'completed', 5),
  ('th6', 'Vitamin D Supplementation', 'Vitamin D3 2000 IU', '1x Daily', 'Vitamin D Deficiency', 'Dr. James Lee', 'Endocrinology', 'Aug 12, 2023', 'Feb 12, 2024', 'completed', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO treatment_sharing (id, treatment_id, doctor_name, doctor_specialty, is_prescribing_doctor, hidden, sort_order) VALUES
  ('ts1', 'th1', 'Dr. Aisha Okonkwo', 'Cardiology', true, false, 1),
  ('ts2', 'th1', 'Dr. James Lee', 'Endocrinology', false, false, 2),
  ('ts3', 'th2', 'Dr. Aisha Okonkwo', 'Cardiology', true, false, 1),
  ('ts4', 'th2', 'Dr. Sarah Chen', 'General Medicine', false, false, 2),
  ('ts5', 'th3', 'Dr. James Lee', 'Endocrinology', true, false, 1),
  ('ts6', 'th3', 'Dr. Aisha Okonkwo', 'Cardiology', false, false, 2),
  ('ts7', 'th4', 'Dr. Aisha Okonkwo', 'Cardiology', true, false, 1),
  ('ts8', 'th5', 'Dr. Sarah Chen', 'General Medicine', true, false, 1),
  ('ts9', 'th5', 'Dr. Aisha Okonkwo', 'Cardiology', false, true, 2),
  ('ts10', 'th6', 'Dr. James Lee', 'Endocrinology', true, false, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vitals (id, vital_type, value, unit, date_recorded, sort_order) VALUES
  ('v1', 'Body Weight', '78', 'kg', 'Sep 3, 2026', 1),
  ('v2', 'Height', '175', 'cm', 'Jan 15, 2024', 2),
  ('v3', 'BMI', '25.5', 'kg/m²', 'Sep 3, 2026', 3),
  ('v4', 'Blood Pressure', '128/82', 'mmHg', 'Sep 3, 2026', 4),
  ('v5', 'Resting Heart Rate', '72', 'bpm', 'Sep 3, 2026', 5)
ON CONFLICT (id) DO NOTHING;
