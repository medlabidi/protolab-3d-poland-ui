-- Create maintenances table
CREATE TABLE IF NOT EXISTS maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('preventive', 'corrective', 'predictive')),
  description TEXT NOT NULL,
  cost DECIMAL(10, 2) DEFAULT 0,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_maintenances_printer_id ON maintenances(printer_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_type ON maintenances(type);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances(status);
CREATE INDEX IF NOT EXISTS idx_maintenances_scheduled_date ON maintenances(scheduled_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenances_updated_at ON maintenances;
CREATE TRIGGER maintenances_updated_at
BEFORE UPDATE ON maintenances
FOR EACH ROW
EXECUTE FUNCTION update_maintenances_updated_at();

-- Add maintenance_rate column to printers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='printers' AND column_name='maintenance_rate') THEN
    ALTER TABLE printers ADD COLUMN maintenance_rate DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;
