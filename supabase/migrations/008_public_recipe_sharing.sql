-- Add public sharing capabilities to recipes
-- Migration: 008_public_recipe_sharing.sql

-- Add is_public column to recipes table with default value of false
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index on is_public to improve query performance when filtering by visibility
CREATE INDEX IF NOT EXISTS recipes_is_public_idx ON recipes(is_public);

-- Update RLS policies for public recipe access
-- Drop existing policy for viewing recipes
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;

-- Create new policies for recipe visibility
-- 1. Users can view their own recipes
-- 2. Anyone can view public recipes
CREATE POLICY "Users can view their own recipes"
ON recipes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public recipes are viewable by everyone"
ON recipes FOR SELECT
USING (is_public = true);

-- Similar updates for related tables

-- For recipe_images
DROP POLICY IF EXISTS "Users can view their own recipe images" ON recipe_images;

CREATE POLICY "Users can view their own recipe images"
ON recipe_images FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Anyone can view public recipe images"
ON recipe_images FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id AND recipes.is_public = true
));

-- For recipe_ingredients
DROP POLICY IF EXISTS "Users can view their own recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Users can view their own recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Anyone can view public recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.is_public = true
));

-- For recipe_instruction_sections
DROP POLICY IF EXISTS "Users can view their own recipe instruction sections" ON recipe_instruction_sections;

CREATE POLICY "Users can view their own recipe instruction sections"
ON recipe_instruction_sections FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Anyone can view public recipe instruction sections"
ON recipe_instruction_sections FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_instruction_sections.recipe_id AND recipes.is_public = true
));

-- For recipe_instruction_steps
DROP POLICY IF EXISTS "Users can view their own recipe instruction steps" ON recipe_instruction_steps;

CREATE POLICY "Users can view their own recipe instruction steps"
ON recipe_instruction_steps FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.user_id = auth.uid()
));

CREATE POLICY "Anyone can view public recipe instruction steps"
ON recipe_instruction_steps FOR SELECT
USING (EXISTS (
    SELECT 1 FROM recipes
    JOIN recipe_instruction_sections ON recipes.id = recipe_instruction_sections.recipe_id
    WHERE recipe_instruction_steps.section_id = recipe_instruction_sections.id AND recipes.is_public = true
));

-- Add comments for documentation
COMMENT ON COLUMN recipes.is_public IS 'When true, this recipe is publicly viewable without authentication';
