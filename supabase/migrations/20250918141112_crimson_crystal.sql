/*
  # Insert initial data

  1. Organizations
    - Demo gemeente
    - Demo provincie

  2. Demo users (profiles will be created via auth trigger)
    - Admin user
    - Jurist user  
    - Procurement officer user

  3. Demo tender data
*/

-- Insert demo organizations
INSERT INTO organizations (id, name, type, kvk_number, contact_email, contact_phone, address) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Gemeente Amsterdam',
    'gemeente',
    '12345678',
    'info@amsterdam.nl',
    '020-5544332',
    '{"street": "Amstel 1", "city": "Amsterdam", "postal_code": "1011 PN", "country": "Nederland"}'::jsonb
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002', 
    'Provincie Noord-Holland',
    'provincie',
    '87654321',
    'info@noord-holland.nl',
    '023-5142000',
    '{"street": "Dreef 3", "city": "Haarlem", "postal_code": "2012 HM", "country": "Nederland"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Note: Demo users will need to be created through Supabase Auth
-- The profiles will be automatically created via the trigger
-- You can create them manually in the Supabase dashboard:
-- 1. admin@demo.nl (password: admin123) - role: admin
-- 2. jurist@demo.nl (password: jurist123) - role: jurist  
-- 3. inkoper@demo.nl (password: inkoper123) - role: procurement_officer

-- Insert demo tender (will be created after users exist)
-- This is commented out as it requires existing user profiles
/*
INSERT INTO tenders (
  id,
  organization_id,
  title,
  description,
  type,
  status,
  progress_percentage,
  current_step,
  next_step,
  threshold_value,
  estimated_value,
  publication_date,
  closing_date,
  award_criteria,
  created_by
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  'IT-infrastructuur modernisering',
  'Vernieuwing van de complete IT-infrastructuur voor de gemeente',
  'openbaar',
  'actief',
  45,
  'Inschrijvingen ontvangen',
  'Sluitingsdatum afwachten',
  221000,
  450000,
  '2024-01-15'::timestamptz,
  '2024-02-15'::timestamptz,
  '[
    {"id": "prijs", "naam": "Prijs", "wegingsfactor": 40, "type": "prijs"},
    {"id": "kwaliteit", "naam": "Kwaliteit", "wegingsfactor": 30, "type": "kwaliteit"},
    {"id": "technisch", "naam": "Technische aspecten", "wegingsfactor": 20, "type": "technisch"},
    {"id": "duurzaamheid", "naam": "Duurzaamheid", "wegingsfactor": 10, "type": "duurzaamheid"}
  ]'::jsonb,
  NULL -- Will need to be updated with actual user ID
)
ON CONFLICT (id) DO NOTHING;
*/