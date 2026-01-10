-- ============================================
-- Migration: Create Printers Table
-- Date: 2026-01-08
-- Description: Crée la table printers pour la gestion de la flotte d'imprimantes 3D
-- ============================================

BEGIN;

-- Créer la table printers
CREATE TABLE IF NOT EXISTS printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  current_job TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  temperature INTEGER DEFAULT 25,
  bed_temp INTEGER DEFAULT 25,
  uptime VARCHAR(50) DEFAULT '0%',
  total_prints INTEGER DEFAULT 0,
  
  -- Maintenance fields
  last_maintenance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_maintenance TIMESTAMP WITH TIME ZONE,
  maintenance_cost_monthly DECIMAL(10, 2) DEFAULT 0.00,
  maintenance_interval_days INTEGER DEFAULT 90,
  maintenance_notes TEXT,
  
  -- Specifications
  build_volume_x INTEGER,
  build_volume_y INTEGER,
  build_volume_z INTEGER,
  max_nozzle_temp INTEGER,
  max_bed_temp INTEGER,
  supported_materials TEXT[], -- Array of supported material types
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaires pour documentation
COMMENT ON TABLE printers IS 'Table de gestion de la flotte d''imprimantes 3D';
COMMENT ON COLUMN printers.name IS 'Nom de l''imprimante (ex: Prusa i3 MK3S+)';
COMMENT ON COLUMN printers.status IS 'Statut actuel: online, offline, maintenance';
COMMENT ON COLUMN printers.current_job IS 'Job d''impression en cours';
COMMENT ON COLUMN printers.progress IS 'Progression du job actuel (0-100%)';
COMMENT ON COLUMN printers.uptime IS 'Temps de disponibilité en pourcentage';
COMMENT ON COLUMN printers.total_prints IS 'Nombre total d''impressions réalisées';
COMMENT ON COLUMN printers.maintenance_cost_monthly IS 'Coût mensuel de maintenance en PLN';

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_printers_status ON printers(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_printers_next_maintenance ON printers(next_maintenance) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_printers_created_at ON printers(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_printers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_printers_updated_at
BEFORE UPDATE ON printers
FOR EACH ROW
EXECUTE FUNCTION update_printers_updated_at();

-- Insérer quelques imprimantes par défaut
INSERT INTO printers (name, model, manufacturer, status, temperature, bed_temp, uptime, total_prints, last_maintenance, maintenance_cost_monthly, maintenance_interval_days, next_maintenance)
VALUES 
  ('Prusa i3 MK3S+', 'MK3S+', 'Prusa Research', 'online', 210, 60, '98.2%', 342, NOW() - INTERVAL '5 days', 75.00, 90, NOW() + INTERVAL '85 days'),
  ('Creality Ender 3 Pro', 'Ender 3 Pro', 'Creality', 'online', 180, 45, '96.5%', 512, NOW() - INTERVAL '11 days', 50.00, 90, NOW() + INTERVAL '79 days'),
  ('Anycubic i3 Mega', 'i3 Mega', 'Anycubic', 'offline', 25, 25, '0%', 198, NOW() - INTERVAL '24 days', 45.00, 90, NOW() + INTERVAL '66 days'),
  ('Artillery Sidewinder X1', 'Sidewinder X1', 'Artillery', 'maintenance', 85, 40, '82.1%', 287, NOW() - INTERVAL '2 days', 60.00, 90, NOW() + INTERVAL '88 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================
-- Enable RLS (Row Level Security) - Optional
-- ============================================

-- Si vous souhaitez activer RLS pour sécuriser l'accès:
-- ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (peuvent tout voir et modifier)
-- CREATE POLICY "Admins can manage all printers" ON printers
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.role = 'admin'
--     )
--   );

-- Policy pour les utilisateurs (lecture seule des imprimantes actives)
-- CREATE POLICY "Users can view active printers" ON printers
--   FOR SELECT USING (is_active = true);
