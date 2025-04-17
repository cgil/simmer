-- Migration: 013_recipe_collection_ordering.sql
-- Description: Add support for ordering recipes within collections

-- Add position column to recipe_collections table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'recipe_collections' AND column_name = 'position'
    ) THEN
        ALTER TABLE public.recipe_collections ADD COLUMN position DOUBLE PRECISION DEFAULT 1000.0;
    END IF;
END $$;

-- Backfill existing recipes with position values if position column exists
UPDATE public.recipe_collections
SET position = subquery.position
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY collection_id ORDER BY recipe_id) * 1000.0 as position
  FROM public.recipe_collections
  WHERE position IS NULL OR position = 1000.0
) as subquery
WHERE public.recipe_collections.id = subquery.id;

-- Make position column NOT NULL after backfilling
ALTER TABLE public.recipe_collections ALTER COLUMN position SET NOT NULL;

-- Create an index on collection_id and position for efficient ordering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_recipe_collections_collection_position'
    ) THEN
        CREATE INDEX idx_recipe_collections_collection_position ON public.recipe_collections (collection_id, position);
    END IF;
END $$;

-- Create a function to get the minimum position in a collection
CREATE OR REPLACE FUNCTION public.get_min_position_in_collection(collection_id UUID)
RETURNS TABLE(min_position DOUBLE PRECISION)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT MIN(position) as min_position
  FROM public.recipe_collections
  WHERE recipe_collections.collection_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Grant executable permission for the function
GRANT EXECUTE ON FUNCTION public.get_min_position_in_collection TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_min_position_in_collection TO anon;

-- Add policy for updating recipe positions in collections (critical for reordering)
DO $$
BEGIN
    -- Check if policy already exists to avoid errors
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'recipe_collections'
        AND policyname = 'Users can update their own recipe collections'
    ) THEN
        -- Add policy for updating recipe positions in collections
        EXECUTE format('
            CREATE POLICY "Users can update their own recipe collections"
            ON recipe_collections FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM collections
                    WHERE collections.id = recipe_collections.collection_id
                    AND collections.user_id = auth.uid()
                )
            )
        ');
    END IF;
END
$$;

-- Add comments
COMMENT ON COLUMN public.recipe_collections.position IS 'Position of the recipe within the collection for ordering';
COMMENT ON FUNCTION public.get_min_position_in_collection IS 'Gets the minimum position value in a collection for ordering recipes';
COMMENT ON POLICY "Users can update their own recipe collections" ON recipe_collections
  IS 'Allow users to update recipe collections they own, needed for reordering recipes';
