-- Clean Database Script
-- This script deletes all rows from all tables EXCEPT the users table
-- Run this in Supabase SQL Editor

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Delete from conversation_messages (depends on conversations)
DELETE FROM public.conversation_messages;

-- Delete from conversations
DELETE FROM public.conversations;

-- Delete from credits_transactions (depends on credits and users)
DELETE FROM public.credits_transactions;

-- Delete from credits
DELETE FROM public.credits;

-- Delete from notifications (depends on users and orders)
DELETE FROM public.notifications;

-- Delete from support_messages (if exists)
DELETE FROM public.support_messages;

-- Delete from orders (depends on users)
DELETE FROM public.orders;

-- Delete from refresh_tokens (depends on users)
DELETE FROM public.refresh_tokens;

-- Delete from materials (if exists)
DELETE FROM public.materials;

-- Delete from printers (if exists)
DELETE FROM public.printers;

-- Delete from delivery_options (if exists)
DELETE FROM public.delivery_options;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Vacuum tables to reclaim space
VACUUM ANALYZE public.conversation_messages;
VACUUM ANALYZE public.conversations;
VACUUM ANALYZE public.credits_transactions;
VACUUM ANALYZE public.credits;
VACUUM ANALYZE public.notifications;
VACUUM ANALYZE public.orders;
VACUUM ANALYZE public.refresh_tokens;

-- Show results
DO $$
DECLARE
  orders_count INTEGER;
  notifications_count INTEGER;
  conversations_count INTEGER;
  messages_count INTEGER;
  credits_count INTEGER;
  transactions_count INTEGER;
  tokens_count INTEGER;
  users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_count FROM public.orders;
  SELECT COUNT(*) INTO notifications_count FROM public.notifications;
  SELECT COUNT(*) INTO conversations_count FROM public.conversations;
  SELECT COUNT(*) INTO messages_count FROM public.conversation_messages;
  SELECT COUNT(*) INTO credits_count FROM public.credits;
  SELECT COUNT(*) INTO transactions_count FROM public.credits_transactions;
  SELECT COUNT(*) INTO tokens_count FROM public.refresh_tokens;
  SELECT COUNT(*) INTO users_count FROM public.users;
  
  RAISE NOTICE '✅ Database cleaned successfully!';
  RAISE NOTICE '─────────────────────────────────';
  RAISE NOTICE 'Remaining rows:';
  RAISE NOTICE '  Users: % (KEPT)', users_count;
  RAISE NOTICE '  Orders: %', orders_count;
  RAISE NOTICE '  Notifications: %', notifications_count;
  RAISE NOTICE '  Conversations: %', conversations_count;
  RAISE NOTICE '  Messages: %', messages_count;
  RAISE NOTICE '  Credits: %', credits_count;
  RAISE NOTICE '  Transactions: %', transactions_count;
  RAISE NOTICE '  Refresh Tokens: %', tokens_count;
END $$;
