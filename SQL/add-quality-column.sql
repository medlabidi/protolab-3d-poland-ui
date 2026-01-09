-- Migration: Add quality column to orders table
-- This stores the quality preset selected (draft/standard/high/ultra) for easy display
-- Only populated when advanced_mode = false

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS quality TEXT
CHECK (quality IS NULL OR quality IN ('draft', 'standard', 'high', 'ultra'));

COMMENT ON COLUMN public.orders.quality IS 'Quality preset selected: draft, standard, high, or ultra. Only set when advanced_mode = false.';
