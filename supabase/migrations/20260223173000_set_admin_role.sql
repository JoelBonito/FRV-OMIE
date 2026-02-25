-- Set user_role = 'admin' for existing user
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"user_role":"admin"}'::jsonb
WHERE id = 'a0490088-6f38-4b1b-8134-6c8d760b307f';
