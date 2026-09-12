/*
# Create DoseTrace data tables (single-tenant, no auth)

1. New Tables
- `dose_records`: Tracks the user's daily medicine doses with status (taken/missed/upcoming)
- `consent_settings`: Single-row table storing the user's privacy/sharing choices
- `family_members`: Stores family member profiles with health overview data
- `family_doses`: Per-member daily medicine doses
- `family_prescriptions`: Per-member prescription records with supply tracking
- `family_labs`: Per-member lab results

2. Security
- All tables have RLS enabled
- All policies use `TO anon, authenticated` since this is a no-auth single-tenant app
- `USING (true)` / `WITH CHECK (true)` is acceptable because the data is intentionally shared/public

3. Seed Data
- Inserts initial dose records matching the app's current hardcoded data
- Inserts a single consent_settings row with defaults
- Inserts all four family members with their doses, prescriptions, and labs
*/

-- Dose records for the primary user
CREATE TABLE IF NOT EXISTS dose_records (
  id text PRIMARY KEY,
  medication text NOT NULL,
  amount text NOT NULL,
  time text NOT NULL,
  time_label text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_doses" ON dose_records;
CREATE POLICY "anon_select_doses" ON dose_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_doses" ON dose_records;
CREATE POLICY "anon_insert_doses" ON dose_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_doses" ON dose_records;
CREATE POLICY "anon_update_doses" ON dose_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_doses" ON dose_records;
CREATE POLICY "anon_delete_doses" ON dose_records FOR DELETE
  TO anon, authenticated USING (true);

-- Consent settings (single row)
CREATE TABLE IF NOT EXISTS consent_settings (
  id text PRIMARY KEY DEFAULT 'default',
  biometrics boolean NOT NULL DEFAULT true,
  rx boolean NOT NULL DEFAULT true,
  history boolean NOT NULL DEFAULT false
);

ALTER TABLE consent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_consents" ON consent_settings;
CREATE POLICY "anon_select_consents" ON consent_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_consents" ON consent_settings;
CREATE POLICY "anon_insert_consents" ON consent_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_consents" ON consent_settings;
CREATE POLICY "anon_update_consents" ON consent_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Family members
CREATE TABLE IF NOT EXISTS family_members (
  id text PRIMARY KEY,
  name text NOT NULL,
  relation text NOT NULL,
  age integer NOT NULL,
  conditions text[] NOT NULL DEFAULT '{}',
  medicines integer NOT NULL DEFAULT 0,
  adherence integer NOT NULL DEFAULT 100,
  last_checkup text NOT NULL,
  status text NOT NULL DEFAULT 'good',
  heart_rate integer NOT NULL,
  next_appointment text NOT NULL,
  blood_group text NOT NULL,
  clinic text NOT NULL
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_family" ON family_members;
CREATE POLICY "anon_select_family" ON family_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_family" ON family_members;
CREATE POLICY "anon_insert_family" ON family_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_family" ON family_members;
CREATE POLICY "anon_update_family" ON family_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_family" ON family_members;
CREATE POLICY "anon_delete_family" ON family_members FOR DELETE
  TO anon, authenticated USING (true);

-- Family doses
CREATE TABLE IF NOT EXISTS family_doses (
  id text PRIMARY KEY,
  member_id text NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  medication text NOT NULL,
  amount text NOT NULL,
  time text NOT NULL,
  time_label text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE family_doses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_family_doses" ON family_doses;
CREATE POLICY "anon_select_family_doses" ON family_doses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_family_doses" ON family_doses;
CREATE POLICY "anon_insert_family_doses" ON family_doses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_family_doses" ON family_doses;
CREATE POLICY "anon_update_family_doses" ON family_doses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_family_doses" ON family_doses;
CREATE POLICY "anon_delete_family_doses" ON family_doses FOR DELETE
  TO anon, authenticated USING (true);

-- Family prescriptions
CREATE TABLE IF NOT EXISTS family_prescriptions (
  id text PRIMARY KEY,
  member_id text NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  dose text NOT NULL,
  days_remaining integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'Active',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE family_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_family_rx" ON family_prescriptions;
CREATE POLICY "anon_select_family_rx" ON family_prescriptions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_family_rx" ON family_prescriptions;
CREATE POLICY "anon_insert_family_rx" ON family_prescriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_family_rx" ON family_prescriptions;
CREATE POLICY "anon_update_family_rx" ON family_prescriptions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_family_rx" ON family_prescriptions;
CREATE POLICY "anon_delete_family_rx" ON family_prescriptions FOR DELETE
  TO anon, authenticated USING (true);

-- Family labs
CREATE TABLE IF NOT EXISTS family_labs (
  id text PRIMARY KEY,
  member_id text NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'Normal',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE family_labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_family_labs" ON family_labs;
CREATE POLICY "anon_select_family_labs" ON family_labs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_family_labs" ON family_labs;
CREATE POLICY "anon_insert_family_labs" ON family_labs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_family_labs" ON family_labs;
CREATE POLICY "anon_update_family_labs" ON family_labs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_family_labs" ON family_labs;
CREATE POLICY "anon_delete_family_labs" ON family_labs FOR DELETE
  TO anon, authenticated USING (true);

-- Seed dose_records
INSERT INTO dose_records (id, medication, amount, time, time_label, status, sort_order) VALUES
  ('d1', 'Metformin', '500mg', '08:00', 'Morning', 'taken', 1),
  ('d2', 'Lisinopril', '10mg', '08:00', 'Morning', 'taken', 2),
  ('d3', 'Aspirin', '81mg', '08:00', 'Morning', 'taken', 3),
  ('d4', 'Metformin', '500mg', '20:00', 'Evening', 'missed', 4),
  ('d5', 'Atorvastatin', '20mg', '22:00', 'Night', 'upcoming', 5)
ON CONFLICT (id) DO NOTHING;

-- Seed consent_settings
INSERT INTO consent_settings (id, biometrics, rx, history) VALUES
  ('default', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- Seed family members
INSERT INTO family_members (id, name, relation, age, conditions, medicines, adherence, last_checkup, status, heart_rate, next_appointment, blood_group, clinic) VALUES
  ('f1', 'Margaret M.', 'Mother', 68, ARRAY['Type 2 Diabetes', 'High Blood Pressure'], 4, 85, 'Aug 28, 2026', 'attention', 76, 'Sep 25, 2026', 'A+', 'Family Care Clinic'),
  ('f2', 'Robert M.', 'Father', 71, ARRAY['High Blood Pressure'], 2, 100, 'Sep 2, 2026', 'good', 68, 'Oct 15, 2026', 'O+', 'Heart Care Center'),
  ('f3', 'Sarah M.', 'Sister', 34, ARRAY['Asthma'], 1, 90, 'Jul 10, 2026', 'good', 72, 'Nov 5, 2026', 'B+', 'City Health Clinic'),
  ('f4', 'Ethan M.', 'Brother', 29, ARRAY[]::text[], 0, 100, 'Sep 8, 2026', 'good', 65, 'Dec 1, 2026', 'O-', 'City Health Clinic')
ON CONFLICT (id) DO NOTHING;

-- Seed family doses
INSERT INTO family_doses (id, member_id, medication, amount, time, time_label, status, sort_order) VALUES
  ('m1d1', 'f1', 'Metformin', '500mg', '08:00', 'Morning', 'taken', 1),
  ('m1d2', 'f1', 'Metformin', '500mg', '20:00', 'Evening', 'missed', 2),
  ('m1d3', 'f1', 'Lisinopril', '10mg', '08:00', 'Morning', 'taken', 3),
  ('m1d4', 'f1', 'Glipizide', '5mg', '08:00', 'Morning', 'taken', 4),
  ('m1d5', 'f1', 'Atorvastatin', '20mg', '22:00', 'Night', 'upcoming', 5),
  ('m2d1', 'f2', 'Lisinopril', '20mg', '08:00', 'Morning', 'taken', 1),
  ('m2d2', 'f2', 'Amlodipine', '5mg', '08:00', 'Morning', 'taken', 2),
  ('m3d1', 'f3', 'Albuterol', '90mcg', 'As needed', 'Day', 'upcoming', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed family prescriptions
INSERT INTO family_prescriptions (id, member_id, name, dose, days_remaining, status, sort_order) VALUES
  ('rx1', 'f1', 'Metformin 500mg', '2x Daily', 12, 'Active', 1),
  ('rx2', 'f1', 'Lisinopril 10mg', '1x Daily', 5, 'Refill needed', 2),
  ('rx3', 'f1', 'Glipizide 5mg', '1x Daily', 20, 'Active', 3),
  ('rx4', 'f1', 'Atorvastatin 20mg', '1x Nightly', 15, 'Active', 4),
  ('rx5', 'f2', 'Lisinopril 20mg', '1x Daily', 18, 'Active', 1),
  ('rx6', 'f2', 'Amlodipine 5mg', '1x Daily', 22, 'Active', 2),
  ('rx7', 'f3', 'Albuterol Inhaler 90mcg', 'As needed', 30, 'Active', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed family labs
INSERT INTO family_labs (id, member_id, name, value, reference, status, sort_order) VALUES
  ('lab1', 'f1', 'HbA1c', '7.2%', 'Ref: < 7.0% · Aug 28, 2026', 'Borderline', 1),
  ('lab2', 'f1', 'Fasting Glucose', '128 mg/dL', 'Ref: 70–99 · Aug 28, 2026', 'Borderline', 2),
  ('lab3', 'f1', 'LDL Cholesterol', '95 mg/dL', 'Ref: < 100 · Aug 28, 2026', 'Normal', 3),
  ('lab4', 'f2', 'LDL Cholesterol', '82 mg/dL', 'Ref: < 100 · Sep 2, 2026', 'Normal', 1),
  ('lab5', 'f2', 'Creatinine', '1.0 mg/dL', 'Ref: 0.7–1.2 · Sep 2, 2026', 'Normal', 2),
  ('lab6', 'f3', 'Spirometry FEV1', '2.8 L', 'Ref: > 2.5 · Jul 10, 2026', 'Normal', 1),
  ('lab7', 'f4', 'Complete Blood Count', 'Normal', 'Ref: All normal · Sep 8, 2026', 'Normal', 1)
ON CONFLICT (id) DO NOTHING;
