-- Fix get_user_role() to read from correct JWT path.
-- user_role is stored in user_metadata (nested), not as top-level claim.
CREATE OR REPLACE FUNCTION frv_omie.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt()->'user_metadata'->>'user_role',
    (current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'user_role'),
    'vendedor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
