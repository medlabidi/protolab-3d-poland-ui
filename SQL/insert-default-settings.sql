-- Insert default settings if not exists
INSERT INTO public.settings (material_rate, time_rate, service_fee)
SELECT 0.05, 10, 5
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);

-- Verify settings
SELECT * FROM public.settings;
