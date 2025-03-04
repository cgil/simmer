-- Fix recipe sharing visibility settings
-- Migration: 010_fix_recipe_user_constraint.sql

-- Ensure policies are set correctly for public recipe visibility
-- This maintains user ownership while allowing public access

-- Make sure is_public is properly set to true by default
ALTER TABLE recipes ALTER COLUMN is_public SET DEFAULT true;

-- Verify RLS policies to ensure public recipes are viewable by everyone
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON recipes;
CREATE POLICY "Public recipes are viewable by everyone"
ON recipes FOR SELECT
USING (is_public = true);

-- Add a helpful comment for documentation
COMMENT ON COLUMN recipes.is_public IS 'When true, this recipe can be viewed by anyone with the URL, regardless of authentication status.';
