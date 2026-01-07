-- ============================================
-- Migration: Design Assistance
-- Date: 2026-01-08
-- Description: Ajoute les colonnes nécessaires pour les demandes de Design Assistance
-- ============================================

BEGIN;

-- Ajouter order_type column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'print';

-- Ajouter design_description
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS design_description TEXT;

-- Ajouter design_requirements  
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS design_requirements TEXT;

-- Ajouter reference_images (JSON pour stocker les URLs des images)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]'::jsonb;

-- Ajouter parent_order_id (pour lier les print orders aux design orders)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Ajouter approximate_dimensions
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS approximate_dimensions VARCHAR(100);

-- Ajouter desired_material
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS desired_material VARCHAR(50);

-- Ajouter usage_type
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS usage_type VARCHAR(50);

-- Ajouter usage_details
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS usage_details TEXT;

-- Ajouter request_chat flag
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS request_chat BOOLEAN DEFAULT FALSE;

-- Ajouter contrainte pour order_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_order_type'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_order_type 
        CHECK (order_type IN ('print', 'design'));
    END IF;
END $$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_request_chat ON orders(request_chat) WHERE request_chat = TRUE;

-- Backfill: Mettre à jour les orders existants qui ont "design" dans le nom
UPDATE orders 
SET order_type = 'design'
WHERE order_type = 'print' 
AND (
  file_name ILIKE '%design%' OR 
  file_name ILIKE '%assistance%' OR 
  file_name ILIKE '%request%'
);

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN orders.order_type IS 'Type de commande: print (impression 3D standard) ou design (demande d''assistance design)';
COMMENT ON COLUMN orders.design_description IS 'Description du projet de design (pour order_type=design)';
COMMENT ON COLUMN orders.design_requirements IS 'Exigences et spécifications spécifiques (pour order_type=design)';
COMMENT ON COLUMN orders.reference_images IS 'Tableau JSON des URLs d''images de référence (pour order_type=design)';
COMMENT ON COLUMN orders.parent_order_id IS 'Référence à l''order parent (ex: design order qui a créé ce print order)';
COMMENT ON COLUMN orders.approximate_dimensions IS 'Dimensions approximatives (ex: 100mm x 50mm x 30mm)';
COMMENT ON COLUMN orders.desired_material IS 'Matériau souhaité (PLA, ABS, PETG, etc.)';
COMMENT ON COLUMN orders.usage_type IS 'Type d''utilisation (mechanical, decorative, functional, other)';
COMMENT ON COLUMN orders.usage_details IS 'Détails d''utilisation supplémentaires';
COMMENT ON COLUMN orders.request_chat IS 'Indique si l''utilisateur a demandé un chat avec l''admin';

COMMIT;

-- Vérification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
    'order_type', 
    'design_description', 
    'design_requirements', 
    'reference_images', 
    'parent_order_id',
    'approximate_dimensions',
    'desired_material',
    'usage_type',
    'usage_details',
    'request_chat'
)
ORDER BY ordinal_position;

-- Afficher le nombre d'orders par type
SELECT 
    order_type, 
    COUNT(*) as total,
    COUNT(CASE WHEN request_chat = TRUE THEN 1 END) as with_chat_request
FROM orders 
GROUP BY order_type;

-- Message de succès
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Migration Design Assistance: COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Colonnes ajoutées:';
    RAISE NOTICE '  ✓ order_type';
    RAISE NOTICE '  ✓ design_description';
    RAISE NOTICE '  ✓ design_requirements';
    RAISE NOTICE '  ✓ reference_images';
    RAISE NOTICE '  ✓ parent_order_id';
    RAISE NOTICE '  ✓ approximate_dimensions';
    RAISE NOTICE '  ✓ desired_material';
    RAISE NOTICE '  ✓ usage_type';
    RAISE NOTICE '  ✓ usage_details';
    RAISE NOTICE '  ✓ request_chat';
    RAISE NOTICE '';
    RAISE NOTICE 'Index créés:';
    RAISE NOTICE '  ✓ idx_orders_order_type';
    RAISE NOTICE '  ✓ idx_orders_parent_order_id';
    RAISE NOTICE '  ✓ idx_orders_request_chat';
    RAISE NOTICE '';
END $$;
