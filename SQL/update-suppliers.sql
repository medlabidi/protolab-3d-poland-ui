-- Clean up and standardize suppliers in materials table
-- Keep only Prusament, Polymaker, and eSun

UPDATE materials
SET supplier = CASE
  WHEN supplier ILIKE '%prusa%' THEN 'Prusament'
  WHEN supplier ILIKE '%polymaker%' THEN 'Polymaker'
  WHEN supplier ILIKE '%esun%' OR supplier ILIKE '%e-sun%' THEN 'eSun'
  ELSE 'Prusament'  -- Default fallback
END
WHERE supplier IS NOT NULL;

-- Set NULL suppliers to default
UPDATE materials
SET supplier = 'Prusament'
WHERE supplier IS NULL;
