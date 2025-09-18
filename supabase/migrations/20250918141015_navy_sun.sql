/*
  # Create tenders (aanbestedingen) table

  1. New Tables
    - `tenders`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `title` (text, not null)
      - `description` (text)
      - `type` (text, not null)
      - `status` (text, not null)
      - `progress_percentage` (integer, default 0)
      - `current_step` (text)
      - `next_step` (text)
      - `threshold_value` (bigint)
      - `estimated_value` (bigint)
      - `publication_date` (timestamptz)
      - `closing_date` (timestamptz)
      - `award_criteria` (jsonb)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `tenders` table
    - Add policies for organization members to access their tenders
*/

CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('openbaar', 'niet-openbaar', 'concurrentiegerichte-dialoog', 'onderhandelingsprocedure')),
  status text NOT NULL CHECK (status IN ('voorbereiding', 'concept', 'gepubliceerd', 'actief', 'gesloten', 'in-beoordeling', 'beoordeeld', 'juridisch-getoetst', 'gegund', 'afgerond')) DEFAULT 'voorbereiding',
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step text,
  next_step text,
  threshold_value bigint,
  estimated_value bigint,
  publication_date timestamptz,
  closing_date timestamptz,
  award_criteria jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Policies for tenders
CREATE POLICY "Organization members can view their tenders"
  ON tenders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = tenders.organization_id
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Procurement officers and admins can manage tenders"
  ON tenders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = tenders.organization_id
      AND profiles.role IN ('admin', 'procurement_officer')
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();