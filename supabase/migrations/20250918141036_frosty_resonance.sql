/*
  # Create submissions (inzendingen) table

  1. New Tables
    - `submissions`
      - `id` (uuid, primary key)
      - `tender_id` (uuid, references tenders)
      - `company_name` (text, not null)
      - `company_kvk` (text, not null)
      - `contact_email` (text, not null)
      - `contact_phone` (text)
      - `submission_date` (timestamptz)
      - `status` (text, not null)
      - `documents` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `submissions` table
    - Add policies for organization members to view submissions for their tenders
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_kvk text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  submission_date timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('ingediend', 'in-behandeling', 'goedgekeurd', 'afgewezen', 'gegund')) DEFAULT 'ingediend',
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
CREATE POLICY "Organization members can view submissions for their tenders"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN tenders ON tenders.organization_id = profiles.organization_id
      WHERE profiles.id = auth.uid()
      AND tenders.id = submissions.tender_id
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Procurement officers and admins can manage submissions"
  ON submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN tenders ON tenders.organization_id = profiles.organization_id
      WHERE profiles.id = auth.uid()
      AND tenders.id = submissions.tender_id
      AND profiles.role IN ('admin', 'procurement_officer')
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();