/*
  # Create document_analyses table

  1. New Tables
    - `document_analyses`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `checklist_id` (text)
      - `checklist_results` (jsonb)
      - `compliance_score` (integer)
      - `risk_level` (text)
      - `recommendations` (jsonb)
      - `missing_requirements` (jsonb)
      - `inconsistencies` (jsonb)
      - `analyzed_at` (timestamptz)
      - `analyst` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `document_analyses` table
    - Add policies for organization members to access analyses
*/

CREATE TABLE IF NOT EXISTS document_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  checklist_id text NOT NULL,
  checklist_results jsonb DEFAULT '[]'::jsonb,
  compliance_score integer CHECK (compliance_score >= 0 AND compliance_score <= 100),
  risk_level text CHECK (risk_level IN ('laag', 'middel', 'hoog', 'kritiek')),
  recommendations jsonb DEFAULT '[]'::jsonb,
  missing_requirements jsonb DEFAULT '[]'::jsonb,
  inconsistencies jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamptz DEFAULT now(),
  analyst text NOT NULL,
  status text CHECK (status IN ('concept', 'reviewed', 'approved')) DEFAULT 'concept',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for document_analyses
CREATE POLICY "Organization members can view document analyses"
  ON document_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN documents ON documents.id = document_analyses.document_id
      LEFT JOIN tenders ON tenders.id = documents.tender_id
      WHERE profiles.id = auth.uid()
      AND (
        documents.type IN ('wetgeving', 'jurisprudentie') OR
        tenders.organization_id = profiles.organization_id
      )
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Jurists and admins can manage document analyses"
  ON document_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'jurist')
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_document_analyses_updated_at
  BEFORE UPDATE ON document_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();