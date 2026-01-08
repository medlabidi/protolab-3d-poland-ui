-- ============================================
-- Migration: Design Assistance
-- Date: 2026-01-08
-- Description: Ajoute les colonnes nécessaires pour les demandes de Design Assistance
-- ============================================

BEGIN;

-- ============================================
-- Colonnes principales pour Design Assistance
-- ============================================

-- Type d'order: 'print' ou 'design'
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'print';

-- Description de l'idée (champ: ideaDescription)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS idea_description TEXT;

-- Type d'utilisation: mechanical, decorative, functional, other (champ: usage)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS usage_type VARCHAR(50);

-- Détails supplémentaires (champ: usageDetails)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS usage_details TEXT;

-- Dimensions approximatives (champ: approximateDimensions)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS approximate_dimensions VARCHAR(100);

-- Matériau souhaité (champ: desiredMaterial)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS desired_material VARCHAR(50);

-- Demande de chat avec admin (champ: requestChat)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS request_chat BOOLEAN DEFAULT FALSE;

-- Fichiers attachés en JSON (champ: attachedFiles)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS attached_files JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- Colonnes pour la gestion des design orders
-- ============================================

-- Lien vers l'order parent (pour les print orders créés depuis un design)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Statut de la demande de design (draft, pending, in_progress, completed, cancelled)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS design_status VARCHAR(50) DEFAULT 'pending';

-- Fichier 3D créé par l'admin (URL du fichier STL/STEP créé)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS admin_design_file VARCHAR(500);

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
CREATE INDEX IF NOT EXISTS idx_orders_design_status ON orders(design_status) WHERE order_type = 'design';
CREATE INDEX IF NOT EXISTS idx_orders_usage_type ON orders(usage_type);

-- Backfill: Mettre à jour les orders existants qui ont "design" dans le nom
UPDATE orders 
SET order_type = 'design'
WHERE order_type = 'print' 
AND (
  file_name ILIKE '%design%' OR 
  file_name ILIKE '%assistance%' OR 
  file_name ILIKE '%request%'
);
: print (impression 3D) ou design (demande d''assistance design)';
COMMENT ON COLUMN orders.idea_description IS 'Description de l''idée du client (formulaire Design Assistance)';
COMMENT ON COLUMN orders.usage_type IS 'Type d''utilisation: mechanical, decorative, functional, other';
COMMENT ON COLUMN orders.usage_details IS 'Détails supplémentaires sur l''utilisation prévue';
COMMENT ON COLUMN orders.approximate_dimensions IS 'Dimensions approximatives (ex: 100mm x 50mm x 30mm)';
COMMENT ON COLUMN orders.desired_material IS 'Matériau souhaité: PLA, ABS, PETG, TPU, Resin, etc.';
COMMENT ON COLUMN orders.request_chat IS 'TRUE si l''utilisateur a demandé un chat avec l''admin';
COMMENT ON COLUMN orders.attached_files IS 'Fichiers attachés (images, PDF, 3D files) en JSON';
COMMENT ON COLUMN orders.parent_order_id IS 'Référence au design order parent (pour print orders créés depuis un design)';
COMMENT ON COLUMN orders.design_status IS 'Statut du design: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN orders.admin_design_file IS 'URL du fichier 3D créé parional, other)';
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
AND column_name I
    'idea_description',
    'usage_type',
    'usage_details',
    'approximate_dimensions',
    'desired_material',
    'request_chat',
    'attached_files',
    'parent_order_id',
    'design_status',
    'admin_design_files',
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
    RAISE NOTICE 'Colonnes ajout (print | design)';
    RAISE NOTICE '  ✓ idea_description (description de l''idée)';
    RAISE NOTICE '  ✓ usage_type (mechanical | decorative | functional | other)';
    RAISE NOTICE '  ✓ usage_details (détails supplémentaires)';
    RAISE NOTICE '  ✓ approximate_dimensions (dimensions)';
    RAISE NOTICE '  ✓ desired_material (matériau)';
    RAISE NOTICE '  ✓ request_chat (demande de chat)';
    RAISE NOTICE '  ✓ attached_files (fichiers attachés)';
    RAISE NOTICE '  ✓ parent_order_id (lien parent)';
    RAISE NOTICE '  ✓ design_status (statut du design)';
    RAISE NOTICE '  ✓ admin_design_file (fichier créé par admin)';
    RAISE NOTICE '';
    RAISE NOTICE 'Index créés:';
    RAISE NOTICE '  ✓ idx_orders_order_type';
    RAISE NOTICE '  ✓ idx_orders_parent_order_id';
    RAISE NOTICE '  ✓ idx_orders_request_chat';
    RAISE NOTICE '  ✓ idx_orders_design_status';
    RAISE NOTICE '  ✓ idx_orders_usage_type_id';
    RAISE NOTICE '  ✓ idx_orders_request_chat';
    RAISE NOTICE '';
END $$;
