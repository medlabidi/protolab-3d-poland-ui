-- Script pour donner les droits admin à un utilisateur

-- Option 1: Par email
-- Remplace 'your.email@example.com' par ton email
UPDATE users 
SET role = 'admin'
WHERE email = 'your.email@example.com';

-- Option 2: Le premier utilisateur devient admin
-- Décommente si tu veux que le premier utilisateur créé soit admin
-- UPDATE users 
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Option 3: Par ID utilisateur
-- Remplace 'user-uuid-here' par l'ID de l'utilisateur
-- UPDATE users 
-- SET role = 'admin'
-- WHERE id = 'user-uuid-here';

-- Vérification: Afficher tous les admins
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM users
WHERE role = 'admin';

-- Vérification: Afficher tous les utilisateurs avec leur rôle
SELECT 
  id,
  email,
  CONCAT(first_name, ' ', last_name) as name,
  role,
  created_at
FROM users
ORDER BY created_at DESC;
