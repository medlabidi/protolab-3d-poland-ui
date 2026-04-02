-- Add OpenSCAD support columns to generation_jobs
-- generation_type: 'tripo3d' (default, existing) or 'openscad' (new)
-- openscad_code: stores the generated OpenSCAD source code
-- parameters: JSON array of extracted parameters for UI sliders

ALTER TABLE generation_jobs
  ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'tripo3d',
  ADD COLUMN IF NOT EXISTS openscad_code TEXT,
  ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '[]';
