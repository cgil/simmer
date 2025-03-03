-- Add user_id column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set NOT NULL constraint after we have migrated existing data
-- We'll temporarily allow NULL to handle existing data, then add the constraint

-- Create an index for user_id to improve performance
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes(user_id);

-- Create transaction support functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
    -- No explicit BEGIN needed in Supabase since each RPC call runs in its own transaction
    -- This is a placeholder for API consistency
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose the function via RPC to be callable from the client
GRANT EXECUTE ON FUNCTION begin_transaction() TO service_role;
GRANT EXECUTE ON FUNCTION begin_transaction() TO authenticated;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

-- Create new RLS policies for recipes
CREATE POLICY "Users can view their own recipes"
ON recipes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
ON recipes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);

-- Add similar policies for related tables
-- For recipe_images
DROP POLICY IF EXISTS "Users can view their own recipe images" ON recipe_images;
DROP POLICY IF EXISTS "Users can insert their own recipe images" ON recipe_images;
DROP POLICY IF EXISTS "Users can update their own recipe images" ON recipe_images;
DROP POLICY IF EXISTS "Users can delete their own recipe images" ON recipe_images;

CREATE POLICY "Users can view their own recipe images"
ON recipe_images FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own recipe images"
ON recipe_images FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own recipe images"
ON recipe_images FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own recipe images"
ON recipe_images FOR DELETE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.user_id = auth.uid()
));

-- For recipe_ingredients
DROP POLICY IF EXISTS "Users can view their own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can insert their own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update their own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete their own recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Users can view their own recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own recipe ingredients"
ON recipe_ingredients FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own recipe ingredients"
ON recipe_ingredients FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own recipe ingredients"
ON recipe_ingredients FOR DELETE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
));

-- For recipe_instruction_sections
DROP POLICY IF EXISTS "Users can view their own recipe instruction sections" ON recipe_instruction_sections;
DROP POLICY IF EXISTS "Users can insert their own recipe instruction sections" ON recipe_instruction_sections;
DROP POLICY IF EXISTS "Users can update their own recipe instruction sections" ON recipe_instruction_sections;
DROP POLICY IF EXISTS "Users can delete their own recipe instruction sections" ON recipe_instruction_sections;

CREATE POLICY "Users can view their own recipe instruction sections"
ON recipe_instruction_sections FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own recipe instruction sections"
ON recipe_instruction_sections FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own recipe instruction sections"
ON recipe_instruction_sections FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own recipe instruction sections"
ON recipe_instruction_sections FOR DELETE
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.user_id = auth.uid()
));

-- For recipe_instruction_steps
DROP POLICY IF EXISTS "Users can view their own recipe instruction steps" ON recipe_instruction_steps;
DROP POLICY IF EXISTS "Users can insert their own recipe instruction steps" ON recipe_instruction_steps;
DROP POLICY IF EXISTS "Users can update their own recipe instruction steps" ON recipe_instruction_steps;
DROP POLICY IF EXISTS "Users can delete their own recipe instruction steps" ON recipe_instruction_steps;

CREATE POLICY "Users can view their own recipe instruction steps"
ON recipe_instruction_steps FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own recipe instruction steps"
ON recipe_instruction_steps FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own recipe instruction steps"
ON recipe_instruction_steps FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own recipe instruction steps"
ON recipe_instruction_steps FOR DELETE
USING (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.user_id = auth.uid()
));
