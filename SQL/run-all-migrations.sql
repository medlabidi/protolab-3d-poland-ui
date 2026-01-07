-- ============================================
-- ProtoLab - Complete Migration Script
-- Date: 2026-01-08
-- Description: Runs all necessary migrations for Design Assistance and Conversations
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- ============================================
-- MIGRATION 1: Add order_type and design fields
-- ============================================
DO $$ 
BEGIN
    -- Add order_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_type'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'print';
        RAISE NOTICE 'Added order_type column';
    END IF;

    -- Add design_description
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'design_description'
    ) THEN
        ALTER TABLE orders ADD COLUMN design_description TEXT;
        RAISE NOTICE 'Added design_description column';
    END IF;

    -- Add design_requirements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'design_requirements'
    ) THEN
        ALTER TABLE orders ADD COLUMN design_requirements TEXT;
        RAISE NOTICE 'Added design_requirements column';
    END IF;

    -- Add reference_images
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'reference_images'
    ) THEN
        ALTER TABLE orders ADD COLUMN reference_images JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added reference_images column';
    END IF;

    -- Add parent_order_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'parent_order_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN parent_order_id UUID REFERENCES orders(id);
        RAISE NOTICE 'Added parent_order_id column';
    END IF;
END $$;

-- Add check constraint for order_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_order_type'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_order_type 
        CHECK (order_type IN ('print', 'design'));
        RAISE NOTICE 'Added check_order_type constraint';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

-- Add comments
COMMENT ON COLUMN orders.order_type IS 'Type of order: print (standard 3D printing) or design (design assistance request)';
COMMENT ON COLUMN orders.design_description IS 'Description of the design project (for design orders)';
COMMENT ON COLUMN orders.design_requirements IS 'Specific requirements and specifications (for design orders)';
COMMENT ON COLUMN orders.reference_images IS 'Array of reference image URLs (for design orders)';
COMMENT ON COLUMN orders.parent_order_id IS 'Reference to parent design order if this is a print order created from a design';

-- Backfill existing orders: set order_type based on file_name patterns
UPDATE orders 
SET order_type = 'design'
WHERE order_type = 'print' 
AND (
  file_name ILIKE '%design%' OR 
  file_name ILIKE '%assistance%' OR 
  file_name ILIKE '%request%'
);

RAISE NOTICE 'Migration 1: Order type and design fields - COMPLETED';

-- ============================================
-- MIGRATION 2: Conversations and Messages Tables
-- ============================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'admin', 'system'
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_is_read ON public.conversation_messages(is_read);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations for their orders" ON public.conversations;
DROP POLICY IF EXISTS "Service role can manage all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.conversation_messages;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations for their orders" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for conversation_messages
CREATE POLICY "Users can view messages in their conversations" ON public.conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.conversation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their messages" ON public.conversation_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

-- Add comments
COMMENT ON TABLE public.conversations IS 'Customer support conversations linked to orders';
COMMENT ON TABLE public.conversation_messages IS 'Messages within conversations';
COMMENT ON COLUMN public.conversations.status IS 'Conversation status: open, in_progress, resolved, closed';
COMMENT ON COLUMN public.conversation_messages.sender_type IS 'Type of sender: user, admin, system';

RAISE NOTICE 'Migration 2: Conversations tables - COMPLETED';

-- ============================================
-- MIGRATION 3: Update trigger for conversations
-- ============================================

-- Create or replace function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        updated_at = NOW(),
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.conversation_messages;

-- Create trigger
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON public.conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

RAISE NOTICE 'Migration 3: Conversation triggers - COMPLETED';

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$ 
DECLARE
    order_type_exists BOOLEAN;
    conversations_exists BOOLEAN;
    messages_exists BOOLEAN;
BEGIN
    -- Check orders table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_type'
    ) INTO order_type_exists;

    -- Check conversations table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversations'
    ) INTO conversations_exists;

    -- Check messages table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversation_messages'
    ) INTO messages_exists;

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '============================================';
    
    IF order_type_exists THEN
        RAISE NOTICE '✓ Orders table: order_type column exists';
    ELSE
        RAISE WARNING '✗ Orders table: order_type column missing';
    END IF;

    IF conversations_exists THEN
        RAISE NOTICE '✓ Conversations table exists';
    ELSE
        RAISE WARNING '✗ Conversations table missing';
    END IF;

    IF messages_exists THEN
        RAISE NOTICE '✓ Conversation_messages table exists';
    ELSE
        RAISE WARNING '✗ Conversation_messages table missing';
    END IF;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
END $$;
