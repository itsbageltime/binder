-- Add username to profiles
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/nbiwbvqbtyqvuzaklvcx/sql

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Callable by anon key so the signup form can check availability before creating the account
CREATE OR REPLACE FUNCTION check_username_available(uname text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM profiles WHERE username = uname);
$$;

GRANT EXECUTE ON FUNCTION check_username_available(text) TO anon;
