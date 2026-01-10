-- ============================================
-- Migration: Add Maintenance Cost Tracking for Printers
-- Date: 2026-01-08
-- Description: Ajoute les colonnes de coûts de maintenance pour chaque imprimante
-- ============================================

BEGIN;

-- Ajouter les colonnes de coûts de maintenance
ALTER TABLE printers 
ADD COLUMN IF NOT EXISTS maintenance_cost_monthly DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS total_maintenance_cost DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN printers.maintenance_cost_monthly IS 'Coût mensuel de maintenance de l''imprimante (pièces, lubrifiants, etc.) en PLN';
COMMENT ON COLUMN printers.last_maintenance_date IS 'Date de la dernière maintenance effectuée';
COMMENT ON COLUMN printers.next_maintenance_date IS 'Date planifiée de la prochaine maintenance';
COMMENT ON COLUMN printers.maintenance_interval_days IS 'Intervalle en jours entre chaque maintenance';
COMMENT ON COLUMN printers.total_maintenance_cost IS 'Coût total cumulé de maintenance depuis l''achat';
COMMENT ON COLUMN printers.maintenance_notes IS 'Notes sur l''historique de maintenance';

-- Créer un index pour les requêtes de maintenance
CREATE INDEX IF NOT EXISTS idx_printers_next_maintenance ON printers(next_maintenance_date) WHERE is_active = true;

-- Mettre à jour les imprimantes existantes avec des valeurs par défaut
UPDATE printers 
SET 
  maintenance_cost_monthly = 50.00,  -- 50 PLN/mois par défaut
  maintenance_interval_days = 90,     -- Maintenance tous les 3 mois
  last_maintenance_date = NOW() - INTERVAL '30 days',
  next_maintenance_date = NOW() + INTERVAL '60 days'
WHERE maintenance_cost_monthly IS NULL;

COMMIT;

-- ============================================
-- Créer une table pour l'historique de maintenance
-- ============================================

CREATE TABLE IF NOT EXISTS printer_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  maintenance_type VARCHAR(50) NOT NULL, -- 'routine', 'repair', 'upgrade', 'emergency'
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  parts_replaced TEXT[],
  performed_by VARCHAR(100),
  duration_minutes INTEGER,
  next_scheduled_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'scheduled', 'in_progress', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_printer ON printer_maintenance_logs(printer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON printer_maintenance_logs(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_status ON printer_maintenance_logs(status);

-- Commentaires
COMMENT ON TABLE printer_maintenance_logs IS 'Historique de toutes les maintenances effectuées sur les imprimantes';
COMMENT ON COLUMN printer_maintenance_logs.maintenance_type IS 'Type de maintenance: routine, repair, upgrade, emergency';
COMMENT ON COLUMN printer_maintenance_logs.parts_replaced IS 'Liste des pièces remplacées durant la maintenance';

-- Fonction pour mettre à jour automatiquement le coût total
CREATE OR REPLACE FUNCTION update_printer_total_maintenance_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE printers 
    SET 
      total_maintenance_cost = COALESCE(total_maintenance_cost, 0) + NEW.cost,
      last_maintenance_date = NEW.maintenance_date,
      next_maintenance_date = NEW.next_scheduled_date
    WHERE id = NEW.printer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_printer_maintenance_cost ON printer_maintenance_logs;
CREATE TRIGGER trigger_update_printer_maintenance_cost
  AFTER INSERT OR UPDATE ON printer_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_printer_total_maintenance_cost();

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_maintenance_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintenance_log_updated_at ON printer_maintenance_logs;
CREATE TRIGGER trigger_maintenance_log_updated_at
  BEFORE UPDATE ON printer_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_log_timestamp();

-- Vue pour les insights de maintenance
CREATE OR REPLACE VIEW printer_maintenance_insights AS
SELECT 
  p.id,
  p.name,
  p.model,
  p.status,
  p.maintenance_cost_monthly,
  p.total_maintenance_cost,
  p.last_maintenance_date,
  p.next_maintenance_date,
  p.maintenance_interval_days,
  EXTRACT(DAY FROM (p.next_maintenance_date - NOW())) as days_until_maintenance,
  COUNT(pml.id) as total_maintenance_count,
  SUM(CASE WHEN pml.maintenance_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count,
  AVG(pml.cost) as avg_maintenance_cost,
  MAX(pml.maintenance_date) as last_recorded_maintenance
FROM printers p
LEFT JOIN printer_maintenance_logs pml ON p.id = pml.printer_id AND pml.status = 'completed'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.model, p.status, p.maintenance_cost_monthly, 
         p.total_maintenance_cost, p.last_maintenance_date, 
         p.next_maintenance_date, p.maintenance_interval_days;

COMMENT ON VIEW printer_maintenance_insights IS 'Vue consolidée des insights de maintenance pour le dashboard admin';

-- Copier-coller SQL/create-payment-tables.sql
