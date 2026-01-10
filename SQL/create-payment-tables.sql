-- ============================================
-- Migration: User Payment Details Enhancement
-- Date: 2026-01-08
-- Description: Tables pour comptes de paiement et historique des paiements
-- ============================================

BEGIN;

-- ============================================
-- 1. Table user_payment_accounts
-- ============================================

CREATE TABLE IF NOT EXISTS user_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Account information
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other')),
  account_number VARCHAR(255), -- Encrypted or last 4 digits
  account_holder_name VARCHAR(255),
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional details
  expiry_date DATE, -- For cards
  bank_name VARCHAR(255), -- For bank transfers
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_id ON user_payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_default ON user_payment_accounts(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_accounts_active ON user_payment_accounts(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE user_payment_accounts IS 'Comptes de paiement enregistrés par les utilisateurs';
COMMENT ON COLUMN user_payment_accounts.account_number IS 'Numéro de compte (encrypté ou derniers 4 chiffres)';
COMMENT ON COLUMN user_payment_accounts.verified IS 'Compte vérifié par micro-dépôt ou autre méthode';

-- ============================================
-- 2. Table payments (historique des paiements)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_account_id UUID REFERENCES user_payment_accounts(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PLN',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  
  -- Transaction info
  transaction_id VARCHAR(255) UNIQUE,
  provider_transaction_id VARCHAR(255), -- ID from payment provider
  provider_name VARCHAR(100), -- Stripe, PayPal, etc.
  
  -- Additional data
  description TEXT,
  metadata JSONB, -- Store additional provider-specific data
  
  -- Failure/refund info
  failure_reason TEXT,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refunded_amount DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Comments
COMMENT ON TABLE payments IS 'Historique complet de tous les paiements';
COMMENT ON COLUMN payments.metadata IS 'Données supplémentaires du provider (JSON)';
COMMENT ON COLUMN payments.provider_transaction_id IS 'ID de transaction du provider (Stripe, PayPal, etc.)';

-- ============================================
-- 3. Mise à jour de la table orders
-- ============================================

-- Ajouter colonnes de paiement si elles n'existent pas
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- Index pour requêtes de paiement
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Comments
COMMENT ON COLUMN orders.payment_status IS 'Statut du paiement: pending, paid, failed, refunded, cancelled';
COMMENT ON COLUMN orders.payment_method IS 'Méthode de paiement utilisée';
COMMENT ON COLUMN orders.paid_amount IS 'Montant réellement payé (peut différer du prix si promo)';

-- ============================================
-- 4. Triggers pour updated_at
-- ============================================

-- Trigger for user_payment_accounts
CREATE OR REPLACE FUNCTION update_payment_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_accounts_updated_at
BEFORE UPDATE ON user_payment_accounts
FOR EACH ROW
EXECUTE FUNCTION update_payment_accounts_updated_at();

-- Trigger for payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- 5. Fonction helper pour catégoriser les users
-- ============================================

CREATE OR REPLACE FUNCTION get_user_payment_category(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_paid_orders INTEGER;
  v_total_spent DECIMAL(10, 2);
  v_category VARCHAR(50);
BEGIN
  -- Count paid orders and total spent
  SELECT 
    COUNT(*) FILTER (WHERE payment_status = 'paid'),
    COALESCE(SUM(paid_amount) FILTER (WHERE payment_status = 'paid'), 0)
  INTO v_paid_orders, v_total_spent
  FROM orders
  WHERE user_id = p_user_id;
  
  -- Categorize
  IF v_paid_orders = 0 THEN
    v_category := 'no_purchases';
  ELSIF v_paid_orders >= 10 AND v_total_spent >= 5000 THEN
    v_category := 'premium';
  ELSIF v_paid_orders >= 5 AND v_total_spent >= 2000 THEN
    v_category := 'regular';
  ELSIF v_paid_orders >= 1 THEN
    v_category := 'occasional';
  ELSE
    v_category := 'new';
  END IF;
  
  RETURN v_category;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Vue pour statistiques utilisateurs
-- ============================================

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  u.status,
  
  -- Orders stats
  COUNT(o.id) as total_orders,
  COUNT(o.id) FILTER (WHERE o.payment_status = 'paid') as paid_orders,
  COUNT(o.id) FILTER (WHERE o.payment_status = 'pending') as pending_orders,
  COUNT(o.id) FILTER (WHERE o.payment_status = 'failed') as failed_orders,
  COUNT(o.id) FILTER (WHERE o.payment_status = 'refunded') as refunded_orders,
  
  -- Amount stats
  COALESCE(SUM(o.paid_amount) FILTER (WHERE o.payment_status = 'paid'), 0) as total_spent,
  COALESCE(SUM(o.price) FILTER (WHERE o.payment_status = 'pending'), 0) as pending_amount,
  COALESCE(AVG(o.paid_amount) FILTER (WHERE o.payment_status = 'paid'), 0) as average_order,
  
  -- Payment account
  EXISTS(SELECT 1 FROM user_payment_accounts WHERE user_id = u.id) as has_payment_account,
  
  -- Category
  get_user_payment_category(u.id) as payment_category
  
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, u.status;

COMMENT ON VIEW user_statistics IS 'Vue avec statistiques complètes des utilisateurs';

COMMIT;

-- ============================================
-- Vérification
-- ============================================

-- Vérifier que les tables sont créées
SELECT 
  'user_payment_accounts' as table_name, 
  COUNT(*) as columns
FROM information_schema.columns 
WHERE table_name = 'user_payment_accounts'
UNION ALL
SELECT 
  'payments' as table_name, 
  COUNT(*) as columns
FROM information_schema.columns 
WHERE table_name = 'payments';

-- Afficher la vue user_statistics (vide au début)
SELECT * FROM user_statistics LIMIT 5;

-- Fonction de test
SELECT 
  id, 
  name, 
  email,
  get_user_payment_category(id) as category
FROM users
LIMIT 5;
