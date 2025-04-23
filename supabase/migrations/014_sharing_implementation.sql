-- Migration: 014_sharing_implementation.sql
-- Description: Add tables and columns required for sharing recipes and collections.

-- 1. Create access level enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level') THEN
        CREATE TYPE public.access_level AS ENUM ('view', 'edit');
    END IF;
END$$;

-- 2. Add is_public column to collections table
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for is_public on collections
CREATE INDEX IF NOT EXISTS collections_is_public_idx ON public.collections (is_public);

-- Ensure is_public is never NULL (backfill default applies to existing rows)
ALTER TABLE public.collections
ALTER COLUMN is_public SET NOT NULL;

-- 3. Create shared_recipes table
CREATE TABLE IF NOT EXISTS public.shared_recipes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    shared_with_user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Null if shared via email to non-user
    shared_with_email TEXT NULL, -- Store email for pending invites
    access_level public.access_level NOT NULL DEFAULT 'view',
    granted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Ensure one entry per recipe per potential user (either by email or user_id)
    CONSTRAINT unique_recipe_share_email UNIQUE (recipe_id, shared_with_email),
    CONSTRAINT unique_recipe_share_user_id UNIQUE (recipe_id, shared_with_user_id),
    -- Ensure either email or user_id is present (or both during transition)
    CONSTRAINT chk_shared_recipe_target CHECK (shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS shared_recipes_recipe_id_idx ON public.shared_recipes (recipe_id);
CREATE INDEX IF NOT EXISTS shared_recipes_shared_with_user_id_idx ON public.shared_recipes (shared_with_user_id);
CREATE INDEX IF NOT EXISTS shared_recipes_shared_with_email_idx ON public.shared_recipes (shared_with_email);
CREATE INDEX IF NOT EXISTS shared_recipes_granted_by_user_id_idx ON public.shared_recipes (granted_by_user_id);

-- Trigger to update 'updated_at' timestamp for shared_recipes
DROP TRIGGER IF EXISTS handle_shared_recipes_updated_at ON public.shared_recipes;
CREATE TRIGGER handle_shared_recipes_updated_at
BEFORE UPDATE ON public.shared_recipes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create shared_collections table
CREATE TABLE IF NOT EXISTS public.shared_collections (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    shared_with_user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Null if shared via email to non-user
    shared_with_email TEXT NULL, -- Store email for pending invites
    access_level public.access_level NOT NULL DEFAULT 'view',
    granted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Ensure one entry per collection per potential user (either by email or user_id)
    CONSTRAINT unique_collection_share_email UNIQUE (collection_id, shared_with_email),
    CONSTRAINT unique_collection_share_user_id UNIQUE (collection_id, shared_with_user_id),
    -- Ensure either email or user_id is present (or both during transition)
    CONSTRAINT chk_shared_collection_target CHECK (shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS shared_collections_collection_id_idx ON public.shared_collections (collection_id);
CREATE INDEX IF NOT EXISTS shared_collections_shared_with_user_id_idx ON public.shared_collections (shared_with_user_id);
CREATE INDEX IF NOT EXISTS shared_collections_shared_with_email_idx ON public.shared_collections (shared_with_email);
CREATE INDEX IF NOT EXISTS shared_collections_granted_by_user_id_idx ON public.shared_collections (granted_by_user_id);

-- Trigger to update 'updated_at' timestamp for shared_collections
DROP TRIGGER IF EXISTS handle_shared_collections_updated_at ON public.shared_collections;
CREATE TRIGGER handle_shared_collections_updated_at
BEFORE UPDATE ON public.shared_collections
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Add comments
COMMENT ON COLUMN public.collections.is_public IS 'If true, the collection can be viewed by anyone with the link.';
COMMENT ON TABLE public.shared_recipes IS 'Manages sharing permissions for individual recipes.';
COMMENT ON COLUMN public.shared_recipes.shared_with_user_id IS 'User who has been granted access. Null if invited via email and user has not signed up yet.';
COMMENT ON COLUMN public.shared_recipes.shared_with_email IS 'Email address the recipe was shared with, used for invites to non-users.';
COMMENT ON COLUMN public.shared_recipes.access_level IS 'Permission level granted (view or edit).';
COMMENT ON COLUMN public.shared_recipes.granted_by_user_id IS 'User who granted this permission (owner or editor).';
COMMENT ON TABLE public.shared_collections IS 'Manages sharing permissions for collections.';
COMMENT ON COLUMN public.shared_collections.shared_with_user_id IS 'User who has been granted access. Null if invited via email and user has not signed up yet.';
COMMENT ON COLUMN public.shared_collections.shared_with_email IS 'Email address the collection was shared with, used for invites to non-users.';
COMMENT ON COLUMN public.shared_collections.access_level IS 'Permission level granted (view or edit).';
COMMENT ON COLUMN public.shared_collections.granted_by_user_id IS 'User who granted this permission (owner or editor).';

-- 6. Create Helper Functions for RLS

-- Helper function to check recipe ownership
CREATE OR REPLACE FUNCTION public.is_recipe_owner(recipe_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.recipes
    WHERE id = recipe_id_to_check AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user can view a recipe
CREATE OR REPLACE FUNCTION public.can_view_recipe(recipe_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.recipes r
    WHERE r.id = recipe_id_to_check
    AND (
      r.is_public = true
      OR r.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.shared_recipes sr
        WHERE sr.recipe_id = recipe_id_to_check AND sr.shared_with_user_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user can edit a recipe
CREATE OR REPLACE FUNCTION public.can_edit_recipe(recipe_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.recipes r
    WHERE r.id = recipe_id_to_check
    AND (
      r.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.shared_recipes sr
        WHERE sr.recipe_id = recipe_id_to_check
          AND sr.shared_with_user_id = auth.uid()
          AND sr.access_level = 'edit'::public.access_level
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check collection ownership
CREATE OR REPLACE FUNCTION public.is_collection_owner(collection_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.collections
    WHERE id = collection_id_to_check AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user can view a collection
CREATE OR REPLACE FUNCTION public.can_view_collection(collection_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = collection_id_to_check
    AND (
      c.is_public = true
      OR c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.shared_collections sc
        WHERE sc.collection_id = collection_id_to_check AND sc.shared_with_user_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user can edit a collection
CREATE OR REPLACE FUNCTION public.can_edit_collection(collection_id_to_check UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = collection_id_to_check
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.shared_collections sc
        WHERE sc.collection_id = collection_id_to_check
          AND sc.shared_with_user_id = auth.uid()
          AND sc.access_level = 'edit'::public.access_level
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_recipe_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_recipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_recipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_collection_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_collection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_collection(UUID) TO authenticated;

-- 7. Enable RLS and Define Policies

-- Recipes Table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.recipes;
CREATE POLICY "Allow public read access"
  ON public.recipes FOR SELECT
  USING ( is_public = true );

DROP POLICY IF EXISTS "Allow individual read access" ON public.recipes;
CREATE POLICY "Allow individual read access"
  ON public.recipes FOR SELECT
  USING ( auth.uid() IS NOT NULL AND public.can_view_recipe(id) );

DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.recipes;
CREATE POLICY "Allow authenticated insert access"
  ON public.recipes FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL AND user_id = auth.uid() );

DROP POLICY IF EXISTS "Allow update access for owners and editors" ON public.recipes;
CREATE POLICY "Allow update access for owners and editors"
  ON public.recipes FOR UPDATE
  USING ( auth.uid() IS NOT NULL AND public.can_edit_recipe(id) )
  WITH CHECK ( auth.uid() IS NOT NULL AND public.can_edit_recipe(id) );

DROP POLICY IF EXISTS "Allow delete access for owners" ON public.recipes;
CREATE POLICY "Allow delete access for owners"
  ON public.recipes FOR DELETE
  USING ( auth.uid() IS NOT NULL AND public.is_recipe_owner(id) );

-- Collections Table
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.collections;
CREATE POLICY "Allow public read access"
  ON public.collections FOR SELECT
  USING ( is_public = true );

DROP POLICY IF EXISTS "Allow individual read access" ON public.collections;
CREATE POLICY "Allow individual read access"
  ON public.collections FOR SELECT
  USING ( auth.uid() IS NOT NULL AND public.can_view_collection(id) );

DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.collections;
CREATE POLICY "Allow authenticated insert access"
  ON public.collections FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL AND user_id = auth.uid() ); -- Ensure user_id is set correctly

DROP POLICY IF EXISTS "Allow update access for owners and editors" ON public.collections;
CREATE POLICY "Allow update access for owners and editors"
  ON public.collections FOR UPDATE
  USING ( auth.uid() IS NOT NULL AND public.can_edit_collection(id) )
  WITH CHECK ( auth.uid() IS NOT NULL AND public.can_edit_collection(id) );

DROP POLICY IF EXISTS "Allow delete access for owners" ON public.collections;
CREATE POLICY "Allow delete access for owners"
  ON public.collections FOR DELETE
  USING ( auth.uid() IS NOT NULL AND public.is_collection_owner(id) );

-- Shared Recipes Table
ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to involved users" ON public.shared_recipes;
CREATE POLICY "Allow read access to involved users"
  ON public.shared_recipes FOR SELECT
  USING ( auth.uid() IS NOT NULL AND (public.is_recipe_owner(recipe_id) OR shared_with_user_id = auth.uid()) );

DROP POLICY IF EXISTS "Allow insert access for owners/editors" ON public.shared_recipes;
CREATE POLICY "Allow insert access for owners/editors"
  ON public.shared_recipes FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL AND public.can_edit_recipe(recipe_id) AND granted_by_user_id = auth.uid() );

DROP POLICY IF EXISTS "Allow update access for owners" ON public.shared_recipes;
CREATE POLICY "Allow update access for owners"
  ON public.shared_recipes FOR UPDATE
  USING ( auth.uid() IS NOT NULL AND public.is_recipe_owner(recipe_id) )
  WITH CHECK ( auth.uid() IS NOT NULL AND public.is_recipe_owner(recipe_id) );

DROP POLICY IF EXISTS "Allow delete access for owners and self" ON public.shared_recipes;
CREATE POLICY "Allow delete access for owners and self"
  ON public.shared_recipes FOR DELETE
  USING ( auth.uid() IS NOT NULL AND (public.is_recipe_owner(recipe_id) OR shared_with_user_id = auth.uid()) );

-- Shared Collections Table
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to involved users" ON public.shared_collections;
CREATE POLICY "Allow read access to involved users"
  ON public.shared_collections FOR SELECT
  USING ( auth.uid() IS NOT NULL AND (public.is_collection_owner(collection_id) OR shared_with_user_id = auth.uid()) );

DROP POLICY IF EXISTS "Allow insert access for owners/editors" ON public.shared_collections;
CREATE POLICY "Allow insert access for owners/editors"
  ON public.shared_collections FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL AND public.can_edit_collection(collection_id) AND granted_by_user_id = auth.uid() );

DROP POLICY IF EXISTS "Allow update access for owners" ON public.shared_collections;
CREATE POLICY "Allow update access for owners"
  ON public.shared_collections FOR UPDATE
  USING ( auth.uid() IS NOT NULL AND public.is_collection_owner(collection_id) )
  WITH CHECK ( auth.uid() IS NOT NULL AND public.is_collection_owner(collection_id) );

DROP POLICY IF EXISTS "Allow delete access for owners and self" ON public.shared_collections;
CREATE POLICY "Allow delete access for owners and self"
  ON public.shared_collections FOR DELETE
  USING ( auth.uid() IS NOT NULL AND (public.is_collection_owner(collection_id) OR shared_with_user_id = auth.uid()) );

-- 8. RLS for dependent recipe tables to honor shared access

-- Recipe Images
ALTER TABLE public.recipe_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow view recipe images" ON public.recipe_images;
CREATE POLICY "Allow view recipe images"
  ON public.recipe_images FOR SELECT
  USING (
    public.can_view_recipe(recipe_id)
  );

-- Recipe Ingredients
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow view recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow view recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (
    public.can_view_recipe(recipe_id)
  );

-- Recipe Instruction Sections
ALTER TABLE public.recipe_instruction_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow view instruction sections" ON public.recipe_instruction_sections;
CREATE POLICY "Allow view instruction sections"
  ON public.recipe_instruction_sections FOR SELECT
  USING (
    public.can_view_recipe(recipe_id)
  );

-- Recipe Instruction Steps
ALTER TABLE public.recipe_instruction_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow view instruction steps" ON public.recipe_instruction_steps;
CREATE POLICY "Allow view instruction steps"
  ON public.recipe_instruction_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipe_instruction_sections s
      WHERE s.id = section_id
        AND public.can_view_recipe(s.recipe_id)
    )
  );

-- 9. RLS on recipe_collections table
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select recipe_collections" ON public.recipe_collections;
CREATE POLICY "Allow select recipe_collections"
  ON public.recipe_collections FOR SELECT
  USING (public.can_view_collection(collection_id));

DROP POLICY IF EXISTS "Allow insert recipe_collections" ON public.recipe_collections;
CREATE POLICY "Allow insert recipe_collections"
  ON public.recipe_collections FOR INSERT
  WITH CHECK (public.can_edit_collection(collection_id));

DROP POLICY IF EXISTS "Allow update recipe_collections" ON public.recipe_collections;
CREATE POLICY "Allow update recipe_collections"
  ON public.recipe_collections FOR UPDATE
  USING (public.can_edit_collection(collection_id))
  WITH CHECK (public.can_edit_collection(collection_id));

DROP POLICY IF EXISTS "Allow delete recipe_collections" ON public.recipe_collections;
CREATE POLICY "Allow delete recipe_collections"
  ON public.recipe_collections FOR DELETE
  USING (public.can_edit_collection(collection_id));

-- 10. Manage dependent recipe tables for editors

-- Recipe Images: allow INSERT/UPDATE/DELETE by editors
ALTER TABLE public.recipe_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert recipe images" ON public.recipe_images;
CREATE POLICY "Allow insert recipe images"
  ON public.recipe_images FOR INSERT
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow update recipe images" ON public.recipe_images;
CREATE POLICY "Allow update recipe images"
  ON public.recipe_images FOR UPDATE
  USING (public.can_edit_recipe(recipe_id))
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow delete recipe images" ON public.recipe_images;
CREATE POLICY "Allow delete recipe images"
  ON public.recipe_images FOR DELETE
  USING (public.can_edit_recipe(recipe_id));

-- Recipe Ingredients: allow INSERT/UPDATE/DELETE by editors
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow insert recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow update recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow update recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (public.can_edit_recipe(recipe_id))
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow delete recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow delete recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (public.can_edit_recipe(recipe_id));

-- Recipe Instruction Sections: allow INSERT/UPDATE/DELETE by editors
ALTER TABLE public.recipe_instruction_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert instruction sections" ON public.recipe_instruction_sections;
CREATE POLICY "Allow insert instruction sections"
  ON public.recipe_instruction_sections FOR INSERT
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow update instruction sections" ON public.recipe_instruction_sections;
CREATE POLICY "Allow update instruction sections"
  ON public.recipe_instruction_sections FOR UPDATE
  USING (public.can_edit_recipe(recipe_id))
  WITH CHECK (public.can_edit_recipe(recipe_id));
DROP POLICY IF EXISTS "Allow delete instruction sections" ON public.recipe_instruction_sections;
CREATE POLICY "Allow delete instruction sections"
  ON public.recipe_instruction_sections FOR DELETE
  USING (public.can_edit_recipe(recipe_id));

-- Recipe Instruction Steps: allow INSERT/UPDATE/DELETE by editors
ALTER TABLE public.recipe_instruction_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert instruction steps" ON public.recipe_instruction_steps;
CREATE POLICY "Allow insert instruction steps"
  ON public.recipe_instruction_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipe_instruction_sections s
      WHERE s.id = section_id AND public.can_edit_recipe(s.recipe_id)
    )
  );
DROP POLICY IF EXISTS "Allow update instruction steps" ON public.recipe_instruction_steps;
CREATE POLICY "Allow update instruction steps"
  ON public.recipe_instruction_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipe_instruction_sections s
      WHERE s.id = section_id AND public.can_edit_recipe(s.recipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipe_instruction_sections s
      WHERE s.id = section_id AND public.can_edit_recipe(s.recipe_id)
    )
  );
DROP POLICY IF EXISTS "Allow delete instruction steps" ON public.recipe_instruction_steps;
CREATE POLICY "Allow delete instruction steps"
  ON public.recipe_instruction_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipe_instruction_sections s
      WHERE s.id = section_id AND public.can_edit_recipe(s.recipe_id)
    )
  );
