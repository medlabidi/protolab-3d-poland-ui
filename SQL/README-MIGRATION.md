# Migration Guide - ProtoLab Database

## 📋 Vue d'ensemble

Ce guide explique comment exécuter les migrations nécessaires pour les fonctionnalités Design Assistance et Conversations.

## 🎯 Migrations incluses

### Migration 1: Order Type et Design Fields
- Ajoute la colonne `order_type` (print | design)
- Ajoute `design_description` (TEXT)
- Ajoute `design_requirements` (TEXT)
- Ajoute `reference_images` (JSONB)
- Ajoute `parent_order_id` (UUID)
- Crée les index nécessaires
- Backfill les orders existants

### Migration 2: Tables Conversations
- Crée la table `conversations`
- Crée la table `conversation_messages`
- Configure Row Level Security (RLS)
- Crée les index pour performance
- Configure les policies d'accès

### Migration 3: Triggers
- Trigger pour mettre à jour `last_message_at` automatiquement

## 🚀 Comment exécuter les migrations

### Option 1: Via Supabase Studio (Recommandé)

1. **Ouvrir Supabase Studio**
   ```
   https://supabase.com/dashboard/project/ejauqqpatmqbxxhbmkzp/sql/new
   ```

2. **Copier le contenu du fichier**
   - Ouvrir: `SQL/run-all-migrations.sql`
   - Copier tout le contenu

3. **Coller dans l'éditeur SQL**
   - Coller le script dans Supabase SQL Editor

4. **Exécuter**
   - Cliquer sur "Run" ou appuyer sur `Ctrl+Enter`

5. **Vérifier les résultats**
   - Vérifier les messages de confirmation
   - Tous les messages doivent montrer "COMPLETED"

### Option 2: Via psql (Ligne de commande)

```bash
# Se connecter à la base de données
psql "postgresql://postgres.ejauqqpatmqbxxhbmkzp:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Exécuter le script
\i SQL/run-all-migrations.sql

# Ou directement
psql "postgresql://..." -f SQL/run-all-migrations.sql
```

### Option 3: Via Node.js script

```bash
npm run migrate
```

## ✅ Vérification post-migration

### Vérifier les colonnes ajoutées
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('order_type', 'design_description', 'design_requirements', 'reference_images', 'parent_order_id');
```

### Vérifier les tables créées
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'conversation_messages');
```

### Vérifier les index
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'conversations', 'conversation_messages');
```

### Compter les orders par type
```sql
SELECT order_type, COUNT(*) as count
FROM orders
GROUP BY order_type;
```

## 🔄 Rollback (si nécessaire)

Si vous devez annuler les migrations :

```sql
-- Supprimer les contraintes et colonnes
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_type;
ALTER TABLE orders DROP COLUMN IF EXISTS order_type;
ALTER TABLE orders DROP COLUMN IF EXISTS design_description;
ALTER TABLE orders DROP COLUMN IF EXISTS design_requirements;
ALTER TABLE orders DROP COLUMN IF EXISTS reference_images;
ALTER TABLE orders DROP COLUMN IF EXISTS parent_order_id;

-- Supprimer les tables conversations
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
```

## 📊 Structure des tables après migration

### Table: orders
```sql
- id (UUID)
- user_id (UUID)
- order_type (VARCHAR) ← NOUVEAU
- design_description (TEXT) ← NOUVEAU
- design_requirements (TEXT) ← NOUVEAU
- reference_images (JSONB) ← NOUVEAU
- parent_order_id (UUID) ← NOUVEAU
... (colonnes existantes)
```

### Table: conversations
```sql
- id (UUID)
- order_id (UUID) → orders.id
- user_id (UUID) → users.id
- subject (VARCHAR)
- status (VARCHAR) [open, in_progress, resolved, closed]
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_message_at (TIMESTAMP)
```

### Table: conversation_messages
```sql
- id (UUID)
- conversation_id (UUID) → conversations.id
- sender_type (VARCHAR) [user, admin, system]
- sender_id (UUID) → users.id
- message (TEXT)
- attachments (JSONB)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

## 🛡️ Sécurité (RLS)

Les policies Row Level Security sont configurées pour :
- ✅ Les users peuvent voir uniquement leurs conversations
- ✅ Les users peuvent créer des conversations pour leurs orders
- ✅ Les users peuvent envoyer des messages dans leurs conversations
- ✅ Les admins ont accès complet via service_role

## 📝 Notes importantes

1. **Backup**: Toujours faire un backup avant de migrer en production
2. **Test**: Tester d'abord sur un environnement de développement
3. **Transactions**: Le script utilise BEGIN/COMMIT pour la sécurité
4. **Idempotence**: Le script peut être exécuté plusieurs fois sans erreur
5. **Logs**: Vérifier les messages NOTICE pour le statut de chaque migration

## 🔗 Liens utiles

- [Supabase Dashboard](https://supabase.com/dashboard/project/ejauqqpatmqbxxhbmkzp)
- [SQL Editor](https://supabase.com/dashboard/project/ejauqqpatmqbxxhbmkzp/sql/new)
- [Table Editor](https://supabase.com/dashboard/project/ejauqqpatmqbxxhbmkzp/editor)

## 🐛 Troubleshooting

### Erreur: "permission denied"
→ Assurez-vous d'utiliser le service_role key ou un user avec les bonnes permissions

### Erreur: "relation does not exist"
→ Vérifiez que la table users et orders existent avant de migrer

### Erreur: "constraint already exists"
→ Normal si le script a déjà été exécuté partiellement, il continuera

## ✨ Après la migration

Une fois les migrations exécutées :
1. ✅ Les orders peuvent être de type 'print' ou 'design'
2. ✅ Les Design Assistance requests sont supportés
3. ✅ Les conversations sont activées
4. ✅ Le chat automatique fonctionne
5. ✅ Les dashboards admin/client affichent les données correctement
