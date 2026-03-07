-- Insert test design requests data
-- Make sure you have a test user first

-- Get or create a test user ID (replace with actual user_id from your database)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Try to get existing user
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;
  
  -- Insert test design requests
  INSERT INTO design_requests (
    user_id,
    project_name,
    idea_description,
    usage_type,
    usage_details,
    approximate_dimensions,
    desired_material,
    attached_files,
    reference_images,
    request_chat,
    design_status,
    estimated_price,
    paid_amount,
    payment_status
  ) VALUES
  (
    test_user_id,
    'Custom Phone Stand',
    'I need a phone stand that can hold my phone at different angles. It should be sturdy and have a sleek modern design.',
    'functional',
    'Will be used on my desk for video calls and watching content',
    '15cm x 10cm x 8cm',
    'PLA',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    'pending',
    45.00,
    0,
    'pending'
  ),
  (
    test_user_id,
    'Decorative Wall Art',
    'Looking for a geometric wall art piece with modern patterns. Should be eye-catching and unique.',
    'decorative',
    'Will be mounted in living room as centerpiece',
    '40cm x 40cm x 3cm',
    'PETG',
    '[]'::jsonb,
    '[]'::jsonb,
    true,
    'in_review',
    120.00,
    0,
    'pending'
  ),
  (
    test_user_id,
    'Mechanical Gear Assembly',
    'Need a custom gear assembly for a prototype. Precision is very important.',
    'mechanical',
    'Part of a larger mechanical project, needs to interface with existing components',
    '8cm diameter, 2cm thick',
    'ABS',
    '[]'::jsonb,
    '[]'::jsonb,
    true,
    'in_progress',
    85.50,
    0,
    'pending'
  ),
  (
    test_user_id,
    'Product Prototype Case',
    'Protective case for a new product prototype. Needs to be durable and precise fitting.',
    'prototype',
    'Initial prototype for testing, may need revisions',
    '12cm x 8cm x 4cm',
    'Nylon',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    'completed',
    95.00,
    95.00,
    'paid'
  ),
  (
    test_user_id,
    'Custom Cookie Cutters',
    'Set of custom shaped cookie cutters with company logo',
    'other',
    'For corporate events and marketing',
    'Various sizes, 5-10cm',
    'PLA',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    'pending',
    60.00,
    0,
    'pending'
  );
  
  RAISE NOTICE 'Successfully inserted 5 test design requests';
END $$;

-- Verify insertion
SELECT 
  id,
  project_name,
  design_status,
  estimated_price,
  payment_status,
  created_at
FROM design_requests
ORDER BY created_at DESC
LIMIT 10;
