/*
  # Create legal_reviews (juridische toetsingen) table

  1. New Tables
    - `legal_reviews`
      - `id` (uuid, primary key)
      - `tender_id` (uuid, references tenders)
      - `reviewer_id` (uuid, references profiles)
      - `review_date` (timestamptz)
      - `compliance_status` (text)
      - `findings` (jsonb)
      - `risks` (jsonb)
      - `action_points` (jsonb)
      - `requires_specialist` (boolean)
      - `specialist_reason` (text)
      - `comments` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `legal_reviews` table
    - Add policies for jurists and organization members
*/

CREATE TABLE IF NOT EXISTS legal_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_date timestamptz DEFAULT now(),
  compliance_status text CHECK (compliance_status IN ('compliant', 'niet-compliant', 'onduidelijk')) DEFAULT 'onduidelijk',
  findings jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  action_points jsonb DEFAULT '[]'::jsonb,
  requires_specialist boolean DEFAULT false,
  specialist_reason text,
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for legal_reviews
CREATE POLICY "Organization members can view legal reviews"
  ON legal_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN tenders ON tenders.organization_id = profiles.organization_id
      WHERE profiles.id = auth.uid()
      AND tenders.id = legal_reviews.tender_id
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Jurists and admins can manage legal reviews"
  ON legal_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN tenders ON tenders.organization_id = profiles.organization_id
      WHERE profiles.id = auth.uid()
      AND tenders.id = legal_reviews.tender_id
      AND profiles.role IN ('admin', 'jurist')
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_legal_reviews_updated_at
  BEFORE UPDATE ON legal_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();