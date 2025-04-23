-- Migration: 015_combined_users_and_permissions.sql
-- Description: This is a consolidated migration that includes:
-- 1. Creating a public users table to mirror relevant auth.users data
-- 2. Creating RPC functions to check edit permissions for recipes and collections

-- SECTION 1: Create and configure public.users table
-- =================================================

-- 1. Create public.users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Add comments for clarity
COMMENT ON TABLE public.users IS 'Public user profiles synced from auth.users.';
COMMENT ON COLUMN public.users.id IS 'References the user in auth.users.';
COMMENT ON COLUMN public.users.email IS 'User email address (synced).';
COMMENT ON COLUMN public.users.avatar_url IS 'User avatar URL from provider (synced).';

-- Trigger function to handle updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the updated_at trigger to the new users table
DROP TRIGGER IF EXISTS handle_public_users_updated_at ON public.users;
CREATE TRIGGER handle_public_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 2. Create trigger function to sync on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to call handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. Create trigger function to sync on user update
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET email = NEW.email,
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        updated_at = now() -- Explicitly set updated_at here too
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call handle_update_user on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();


-- 6. Enable RLS and define policies for public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read any profile (adjust if needed)
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.users;
CREATE POLICY "Allow authenticated read access"
  ON public.users FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- IMPORTANT: Users should not be able to insert/update/delete directly
-- These operations are handled by the triggers synced from auth.users

-- (Optional) Backfill existing users from auth.users into public.users
-- Run this manually if needed after the migration is applied
-- INSERT INTO public.users (id, email, avatar_url)
-- SELECT id, email, raw_user_meta_data->>'avatar_url'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.users);


-- SECTION 2: Create RPC functions for permission checking
-- ======================================================

-- Recipe edit permission RPC function
CREATE OR REPLACE FUNCTION public.check_recipe_edit_permission(recipe_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- Use definer security to leverage the existing can_edit_recipe function's permissions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user can edit the recipe using the existing helper function
  RETURN public.can_edit_recipe(recipe_id_to_check);
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.check_recipe_edit_permission(UUID) TO authenticated;

COMMENT ON FUNCTION public.check_recipe_edit_permission(UUID) IS 'RPC function to determine if the currently authenticated user has edit permission for a specific recipe.';

-- Collection edit permission RPC function
CREATE OR REPLACE FUNCTION public.check_collection_edit_permission(collection_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    -- Call the existing helper function to check if user can edit this collection
    SELECT public.can_edit_collection(collection_id_to_check)
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_collection_edit_permission(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_collection_edit_permission(UUID) IS 'Checks if the current user has edit permission for a specific collection';
