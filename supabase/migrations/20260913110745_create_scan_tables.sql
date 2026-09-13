/*
# Create scan tables for prescription and refill scanning

1. New Tables
- `scanned_prescriptions`: Stores metadata about each prescription scan event.
  Columns: id (uuid), scanned_at (timestamptz), notes (text).
- `prescription_medicines`: Stores each medicine extracted from a prescription scan.
  Columns: id (uuid), prescription_id (fk -> scanned_prescriptions), medication (text),
  amount (text), frequency (text), time_label (text), time (text), sort_order (int),
  added_to_doses (boolean).
- `scanned_refills`: Stores metadata about each refill scan event.
  Columns: id (uuid), scanned_at (timestamptz), medication (text), batch_number (text),
  notes (text), confirmed (boolean).

2. Security
- All tables have RLS enabled.
- All policies use `TO anon, authenticated` since this is a no-auth single-tenant app.
- `USING (true)` / `WITH CHECK (true)` is acceptable because the data is intentionally shared/public.

3. Notes
- `prescription_medicines` has a foreign key to `scanned_prescriptions` with ON DELETE CASCADE.
- `added_to_doses` tracks whether the medicine has been pushed into `dose_records` for daily tracking.
*/

CREATE TABLE IF NOT EXISTS scanned_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE scanned_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scanned_rx" ON scanned_prescriptions;
CREATE POLICY "anon_select_scanned_rx" ON scanned_prescriptions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scanned_rx" ON scanned_prescriptions;
CREATE POLICY "anon_insert_scanned_rx" ON scanned_prescriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scanned_rx" ON scanned_prescriptions;
CREATE POLICY "anon_update_scanned_rx" ON scanned_prescriptions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scanned_rx" ON scanned_prescriptions;
CREATE POLICY "anon_delete_scanned_rx" ON scanned_prescriptions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS prescription_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES scanned_prescriptions(id) ON DELETE CASCADE,
  medication text NOT NULL,
  amount text NOT NULL,
  frequency text NOT NULL,
  time_label text NOT NULL DEFAULT 'Morning',
  time text NOT NULL DEFAULT '08:00',
  sort_order integer NOT NULL DEFAULT 0,
  added_to_doses boolean NOT NULL DEFAULT false
);

ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rx_medicines" ON prescription_medicines;
CREATE POLICY "anon_select_rx_medicines" ON prescription_medicines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rx_medicines" ON prescription_medicines;
CREATE POLICY "anon_insert_rx_medicines" ON prescription_medicines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rx_medicines" ON prescription_medicines;
CREATE POLICY "anon_update_rx_medicines" ON prescription_medicines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rx_medicines" ON prescription_medicines;
CREATE POLICY "anon_delete_rx_medicines" ON prescription_medicines FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS scanned_refills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  medication text NOT NULL DEFAULT '',
  batch_number text NOT NULL DEFAULT '',
  notes text,
  confirmed boolean NOT NULL DEFAULT false
);

ALTER TABLE scanned_refills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scanned_refills" ON scanned_refills;
CREATE POLICY "anon_select_scanned_refills" ON scanned_refills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scanned_refills" ON scanned_refills;
CREATE POLICY "anon_insert_scanned_refills" ON scanned_refills FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scanned_refills" ON scanned_refills;
CREATE POLICY "anon_update_scanned_refills" ON scanned_refills FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scanned_refills" ON scanned_refills;
CREATE POLICY "anon_delete_scanned_refills" ON scanned_refills FOR DELETE
  TO anon, authenticated USING (true);
