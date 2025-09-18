/*
  # Create documents table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `type` (text, not null)
      - `content` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `metadata` (jsonb)
      - `embeddings` (vector)
      - `tender_id` (uuid, references tenders)
      - `uploaded_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `documents` table
    - Add policies for organization members to access documents
*/

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('wetgeving', 'jurisprudentie', 'checklist', 'template', 'bestek', 'inzending', 'bijlage')),
  content text,
  file_path text,
  file_size bigint,
  mime_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  embeddings vector(1536), -- OpenAI embedding dimension
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Organization members can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    -- Public legal documents
    type IN ('wetgeving', 'jurisprudentie') OR
    -- Organization-specific documents
    EXISTS (
      SELECT 1 FROM profiles
      JOIN tenders ON tenders.organization_id = profiles.organization_id
      WHERE profiles.id = auth.uid()
      AND (tenders.id = documents.tender_id OR documents.tender_id IS NULL)
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Users can upload documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_active = true
    )
  );

CREATE POLICY "Document owners and admins can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS documents_embeddings_idx ON documents USING ivfflat (embeddings vector_cosine_ops);