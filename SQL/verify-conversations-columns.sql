-- Verify conversations table columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'conversations'
ORDER BY 
    ordinal_position;

-- Check if typing columns exist
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name IN ('user_read', 'admin_read', 'user_typing', 'user_typing_at', 'admin_typing', 'admin_typing_at')
) as typing_columns_exist;

-- Count conversations
SELECT COUNT(*) as total_conversations FROM public.conversations;

-- Sample conversation data with typing columns
SELECT 
    id,
    status,
    user_read,
    admin_read,
    user_typing,
    admin_typing,
    created_at,
    updated_at
FROM public.conversations
LIMIT 5;
