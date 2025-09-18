/*
  # Create evaluations (beoordelingen) table

  1. New Tables
    - `evaluations`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, references submissions)
      - `evaluator_id` (uuid, references profiles)
      - `evaluation_date` (timestamptz)
      - `scores` (jsonb)
      - `total_score` (numeric)
      - `comments` (text)
      - `legal_check_completed` (boolean)
      - `bias_check_declared` (boolean)
      - `recommendation` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `evaluations` table
    - Add policies for evaluators and organization members
*/

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluation_date timestamptz DEFAULT now(),
  scores jsonb DEFAULT '{}'::jsonb,
  total_score numeric(5,2),
  comments text,
  legal_check_completed boolean DEFAULT false,
  bias_check_declared boolean DEFAULT false,
  recommendation text CHECK (recommendation IN ('gunnen', 'afwijzen', 'nadere-beoordeling')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for evaluations
CREATE POLICY "Organization members can view evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN submissions ON submissions.id = evaluations.submission_id
      JOIN tenders ON tenders.id = submissions.tender_id
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = tenders.organization_id
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Evaluators can manage their own evaluations"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (
    evaluator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();