-- Make recipes public by default
-- Migration: 009_make_recipes_public_by_default.sql

-- Update default value for is_public column to true for all new recipes
ALTER TABLE recipes ALTER COLUMN is_public SET DEFAULT true;

-- Update all existing recipes to be public
UPDATE recipes SET is_public = true WHERE is_public = false;

-- Make sure all recipe-related tables have appropriate RLS policies for public access
-- First check if policies already exist before creating them

-- For recipe_ingredients
DROP POLICY IF EXISTS "Public recipe ingredients are viewable by everyone" ON recipe_ingredients;
CREATE POLICY "Public recipe ingredients are viewable by everyone"
ON recipe_ingredients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.is_public = true
  )
);

-- For recipe_instruction_sections
DROP POLICY IF EXISTS "Public recipe instructions are viewable by everyone" ON recipe_instruction_sections;
CREATE POLICY "Public recipe instructions are viewable by everyone"
ON recipe_instruction_sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id
    AND recipes.is_public = true
  )
);

-- For recipe_instruction_steps
DROP POLICY IF EXISTS "Public recipe instruction steps are viewable by everyone" ON recipe_instruction_steps;
CREATE POLICY "Public recipe instruction steps are viewable by everyone"
ON recipe_instruction_steps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id
    AND recipes.is_public = true
  )
);

-- For recipe_images
DROP POLICY IF EXISTS "Public recipe images are viewable by everyone" ON recipe_images;
CREATE POLICY "Public recipe images are viewable by everyone"
ON recipe_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id
    AND recipes.is_public = true
  )
);
