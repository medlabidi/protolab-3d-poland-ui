-- ============================================
-- Seed Data: Printer Maintenance Demo
-- Date: 2026-01-08
-- Description: Données d'exemple pour tester le système de maintenance
-- ============================================

-- Mettre à jour les imprimantes existantes avec des coûts de maintenance
UPDATE printers 
SET 
  maintenance_cost_monthly = 75.00,
  last_maintenance_date = '2026-01-03'::timestamp,
  next_maintenance_date = '2026-03-03'::timestamp,
  maintenance_interval_days = 90,
  total_maintenance_cost = 850.00,
  maintenance_notes = 'Maintenance régulière tous les 3 mois'
WHERE name = 'Prusa i3 MK3S+';

UPDATE printers 
SET 
  maintenance_cost_monthly = 50.00,
  last_maintenance_date = '2025-12-28'::timestamp,
  next_maintenance_date = '2026-02-28'::timestamp,
  maintenance_interval_days = 90,
  total_maintenance_cost = 1200.00,
  maintenance_notes = 'Modèle économique, maintenance basique'
WHERE name LIKE '%Ender%' OR name LIKE '%Creality%';

UPDATE printers 
SET 
  maintenance_cost_monthly = 45.00,
  last_maintenance_date = '2025-12-15'::timestamp,
  next_maintenance_date = '2026-01-15'::timestamp,
  maintenance_interval_days = 90,
  total_maintenance_cost = 540.00,
  maintenance_notes = 'Machine plus ancienne, maintenance fréquente'
WHERE name LIKE '%Anycubic%';

UPDATE printers 
SET 
  maintenance_cost_monthly = 60.00,
  last_maintenance_date = '2026-01-06'::timestamp,
  next_maintenance_date = '2026-04-06'::timestamp,
  maintenance_interval_days = 90,
  total_maintenance_cost = 720.00,
  maintenance_notes = 'Grand volume, maintenance standard'
WHERE name LIKE '%Artillery%' OR name LIKE '%Sidewinder%';

-- Insérer des logs de maintenance d'exemple
-- Pour avoir un historique réaliste

-- Prusa i3 MK3S+ - 12 maintenances
DO $$
DECLARE
  printer_id_prusa UUID;
BEGIN
  SELECT id INTO printer_id_prusa FROM printers WHERE name = 'Prusa i3 MK3S+' LIMIT 1;
  
  IF printer_id_prusa IS NOT NULL THEN
    -- Maintenance routine #1
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, parts_replaced, performed_by, duration_minutes, 
      next_scheduled_date, status
    ) VALUES (
      printer_id_prusa, '2025-01-15'::timestamp, 'routine', 65.00,
      'Maintenance préventive trimestrielle - Graissage axes et nettoyage',
      ARRAY['Graisse PTFE', 'Buse de nettoyage'],
      'Technicien A', 45, '2025-04-15'::timestamp, 'completed'
    );

    -- Maintenance urgence #2
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, parts_replaced, performed_by, duration_minutes, 
      next_scheduled_date, status
    ) VALUES (
      printer_id_prusa, '2025-02-20'::timestamp, 'emergency', 120.00,
      'Remplacement urgence ventilateur hotend défaillant',
      ARRAY['Ventilateur hotend 40mm', 'Vis M3'],
      'Technicien B', 90, '2025-04-15'::timestamp, 'completed'
    );

    -- Autres maintenances routines
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, performed_by, duration_minutes, status
    ) VALUES 
      (printer_id_prusa, '2025-04-18'::timestamp, 'routine', 70.00, 'Maintenance Q2', 'Technicien A', 50, 'completed'),
      (printer_id_prusa, '2025-07-20'::timestamp, 'routine', 68.00, 'Maintenance Q3', 'Technicien C', 45, 'completed'),
      (printer_id_prusa, '2025-10-22'::timestamp, 'routine', 75.00, 'Maintenance Q4 avec calibration', 'Technicien A', 60, 'completed'),
      (printer_id_prusa, '2026-01-03'::timestamp, 'routine', 72.00, 'Maintenance début 2026', 'Technicien B', 55, 'completed');

    RAISE NOTICE 'Prusa: % maintenance logs inserted', 6;
  END IF;
END $$;

-- Creality Ender 3 Pro - 18 maintenances (plus utilisée)
DO $$
DECLARE
  printer_id_ender UUID;
BEGIN
  SELECT id INTO printer_id_ender FROM printers WHERE name LIKE '%Ender%' OR name LIKE '%Creality%' LIMIT 1;
  
  IF printer_id_ender IS NOT NULL THEN
    -- Historique complet sur 2 ans
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, parts_replaced, performed_by, duration_minutes, status
    ) VALUES 
      (printer_id_ender, '2024-01-10'::timestamp, 'routine', 45.00, 'Setup initial et calibration', ARRAY['Kit calibration'], 'Technicien A', 120, 'completed'),
      (printer_id_ender, '2024-03-15'::timestamp, 'routine', 50.00, 'Maintenance trimestrielle', ARRAY['Graisse'], 'Technicien B', 40, 'completed'),
      (printer_id_ender, '2024-04-22'::timestamp, 'emergency', 95.00, 'Remplacement courroie Y cassée', ARRAY['Courroie Y', 'Poulies'], 'Technicien A', 75, 'completed'),
      (printer_id_ender, '2024-06-18'::timestamp, 'routine', 52.00, 'Maintenance Q2', ARRAY['Buse 0.4mm'], 'Technicien C', 45, 'completed'),
      (printer_id_ender, '2024-08-10'::timestamp, 'emergency', 110.00, 'Carte mère défaillante', ARRAY['Carte mère'], 'Technicien B', 120, 'completed'),
      (printer_id_ender, '2024-09-20'::timestamp, 'routine', 48.00, 'Maintenance post-réparation', NULL, 'Technicien A', 35, 'completed'),
      (printer_id_ender, '2024-11-05'::timestamp, 'upgrade', 150.00, 'Installation extrudeur dual drive', ARRAY['Extrudeur BMG'], 'Technicien C', 180, 'completed'),
      (printer_id_ender, '2024-12-22'::timestamp, 'routine', 55.00, 'Maintenance fin année', ARRAY['Graisse', 'Buse'], 'Technicien A', 50, 'completed'),
      (printer_id_ender, '2025-03-15'::timestamp, 'routine', 50.00, 'Maintenance Q1 2025', NULL, 'Technicien B', 45, 'completed'),
      (printer_id_ender, '2025-05-08'::timestamp, 'emergency', 88.00, 'Thermistor hotend défaillant', ARRAY['Thermistor'], 'Technicien A', 60, 'completed'),
      (printer_id_ender, '2025-06-20'::timestamp, 'routine', 52.00, 'Maintenance Q2', ARRAY['Graisse PTFE'], 'Technicien C', 40, 'completed'),
      (printer_id_ender, '2025-09-18'::timestamp, 'routine', 54.00, 'Maintenance Q3', NULL, 'Technicien B', 45, 'completed'),
      (printer_id_ender, '2025-11-02'::timestamp, 'emergency', 105.00, 'Remplacement bloc chauffant', ARRAY['Bloc chauffant', 'Cartouche'], 'Technicien A', 90, 'completed'),
      (printer_id_ender, '2025-12-28'::timestamp, 'routine', 58.00, 'Maintenance fin 2025', ARRAY['Buse 0.4mm', 'Graisse'], 'Technicien C', 50, 'completed');

    RAISE NOTICE 'Ender: % maintenance logs inserted', 14;
  END IF;
END $$;

-- Anycubic i3 Mega - 8 maintenances
DO $$
DECLARE
  printer_id_anycubic UUID;
BEGIN
  SELECT id INTO printer_id_anycubic FROM printers WHERE name LIKE '%Anycubic%' LIMIT 1;
  
  IF printer_id_anycubic IS NOT NULL THEN
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, parts_replaced, performed_by, duration_minutes, status
    ) VALUES 
      (printer_id_anycubic, '2024-06-10'::timestamp, 'routine', 60.00, 'Setup et calibration initiale', NULL, 'Technicien B', 90, 'completed'),
      (printer_id_anycubic, '2024-09-15'::timestamp, 'routine', 55.00, 'Maintenance Q3', ARRAY['Graisse'], 'Technicien A', 45, 'completed'),
      (printer_id_anycubic, '2024-12-20'::timestamp, 'routine', 58.00, 'Maintenance fin année', ARRAY['Buse'], 'Technicien C', 50, 'completed'),
      (printer_id_anycubic, '2025-03-10'::timestamp, 'routine', 62.00, 'Maintenance Q1', NULL, 'Technicien B', 55, 'completed'),
      (printer_id_anycubic, '2025-06-18'::timestamp, 'routine', 65.00, 'Maintenance Q2', ARRAY['Graisse PTFE'], 'Technicien A', 50, 'completed'),
      (printer_id_anycubic, '2025-09-22'::timestamp, 'routine', 70.00, 'Maintenance Q3 avec nettoyage', ARRAY['Kit nettoyage'], 'Technicien C', 60, 'completed'),
      (printer_id_anycubic, '2025-11-08'::timestamp, 'emergency', 125.00, 'Problème électrique carte', ARRAY['Fusible', 'Connecteurs'], 'Technicien B', 120, 'completed'),
      (printer_id_anycubic, '2025-12-15'::timestamp, 'routine', 68.00, 'Maintenance post-réparation', NULL, 'Technicien A', 55, 'completed');

    RAISE NOTICE 'Anycubic: % maintenance logs inserted', 8;
  END IF;
END $$;

-- Artillery Sidewinder X1 - 10 maintenances
DO $$
DECLARE
  printer_id_artillery UUID;
BEGIN
  SELECT id INTO printer_id_artillery FROM printers WHERE name LIKE '%Artillery%' OR name LIKE '%Sidewinder%' LIMIT 1;
  
  IF printer_id_artillery IS NOT NULL THEN
    INSERT INTO printer_maintenance_logs (
      printer_id, maintenance_date, maintenance_type, cost, 
      description, parts_replaced, performed_by, duration_minutes, status
    ) VALUES 
      (printer_id_artillery, '2024-04-12'::timestamp, 'routine', 70.00, 'Installation et setup', NULL, 'Technicien A', 120, 'completed'),
      (printer_id_artillery, '2024-07-20'::timestamp, 'routine', 65.00, 'Maintenance Q2', ARRAY['Graisse'], 'Technicien B', 50, 'completed'),
      (printer_id_artillery, '2024-09-05'::timestamp, 'emergency', 135.00, 'Carte TFT écran défaillant', ARRAY['Écran TFT'], 'Technicien C', 90, 'completed'),
      (printer_id_artillery, '2024-10-18'::timestamp, 'routine', 68.00, 'Maintenance Q4', NULL, 'Technicien A', 45, 'completed'),
      (printer_id_artillery, '2025-01-22'::timestamp, 'routine', 72.00, 'Maintenance début année', ARRAY['Buse 0.4mm'], 'Technicien B', 55, 'completed'),
      (printer_id_artillery, '2025-04-15'::timestamp, 'routine', 70.00, 'Maintenance Q1', ARRAY['Graisse PTFE'], 'Technicien C', 50, 'completed'),
      (printer_id_artillery, '2025-06-28'::timestamp, 'emergency', 145.00, 'Extrudeur bloqué, remplacement', ARRAY['Extrudeur complet'], 'Technicien A', 120, 'completed'),
      (printer_id_artillery, '2025-07-20'::timestamp, 'routine', 68.00, 'Vérification post-réparation', NULL, 'Technicien B', 40, 'completed'),
      (printer_id_artillery, '2025-10-10'::timestamp, 'emergency', 115.00, 'Problème capteur fin filament', ARRAY['Capteur filament'], 'Technicien C', 75, 'completed'),
      (printer_id_artillery, '2026-01-06'::timestamp, 'routine', 75.00, 'Maintenance complète début 2026', ARRAY['Graisse', 'Buse'], 'Technicien A', 65, 'completed');

    RAISE NOTICE 'Artillery: % maintenance logs inserted', 10;
  END IF;
END $$;

-- Vérification finale
SELECT 
  p.name,
  p.maintenance_cost_monthly,
  p.total_maintenance_cost,
  COUNT(pml.id) as log_count,
  SUM(CASE WHEN pml.maintenance_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count
FROM printers p
LEFT JOIN printer_maintenance_logs pml ON p.id = pml.printer_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.maintenance_cost_monthly, p.total_maintenance_cost
ORDER BY p.name;

-- Afficher les insights
SELECT * FROM printer_maintenance_insights ORDER BY name;
