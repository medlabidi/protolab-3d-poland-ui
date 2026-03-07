-- Insert test data for design_requests table

-- First, get a valid user_id (update this with an actual user ID from your database)
-- You can find a user ID by running: SELECT id, email FROM public.users LIMIT 1;

-- Insert sample design requests
INSERT INTO public.design_requests (
  user_id,
  name,
  email,
  phone,
  project_description,
  reference_files,
  status,
  admin_notes,
  estimated_completion_date,
  final_files,
  price
) VALUES
(
  (SELECT id FROM public.users ORDER BY created_at DESC LIMIT 1), -- Get the most recent user
  'Custom Mechanical Part',
  'user@example.com',
  '+48 123 456 789',
  'I need a custom gear mechanism for my robotics project. The gear should have specific dimensions and needs to be compatible with NEMA 17 motors.',
  '[{"name": "reference1.jpg", "url": "https://example.com/ref1.jpg"}]'::jsonb,
  'pending',
  NULL,
  CURRENT_DATE + INTERVAL '7 days',
  '[]'::jsonb,
  NULL
),
(
  (SELECT id FROM public.users ORDER BY created_at DESC LIMIT 1),
  'Decorative Vase Design',
  'user@example.com',
  '+48 987 654 321',
  'I want a decorative vase with geometric patterns. Height around 25cm, modern minimalist style.',
  '[{"name": "inspiration.png", "url": "https://example.com/vase.png"}]'::jsonb,
  'in_review',
  'Nice concept, working on initial sketches',
  CURRENT_DATE + INTERVAL '5 days',
  '[]'::jsonb,
  150.00
),
(
  (SELECT id FROM public.users ORDER BY created_at DESC LIMIT 1),
  'Functional Phone Stand',
  'user@example.com',
  '+48 555 123 456',
  'Need a phone stand that can hold my phone in portrait and landscape mode. Should be stable and have cable management.',
  '[]'::jsonb,
  'in_progress',
  'Design approved, starting 3D modeling',
  CURRENT_DATE + INTERVAL '3 days',
  '[{"name": "draft_v1.stl", "url": "https://example.com/draft.stl"}]'::jsonb,
  80.00
),
(
  (SELECT id FROM public.users ORDER BY created_at DESC LIMIT 1),
  'Custom Gaming Accessory',
  'user@example.com',
  '+48 666 777 888',
  'Custom controller holder for my gaming setup. Needs to hold 2 controllers and have RGB lighting compatibility.',
  '[{"name": "sketch.jpg", "url": "https://example.com/sketch.jpg"}]'::jsonb,
  'completed',
  'Project completed successfully',
  CURRENT_DATE - INTERVAL '2 days',
  '[{"name": "final_design.stl", "url": "https://example.com/final.stl"}, {"name": "assembly_guide.pdf", "url": "https://example.com/guide.pdf"}]'::jsonb,
  200.00
);

-- Verify inserted data
SELECT 
  id,
  name,
  email,
  status,
  price,
  created_at
FROM public.design_requests
ORDER BY created_at DESC
LIMIT 5;

-- Count total design requests
SELECT 
  status,
  COUNT(*) as count
FROM public.design_requests
GROUP BY status
ORDER BY status;
