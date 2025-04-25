-- Create recipe substitution cache table
CREATE TABLE IF NOT EXISTS "recipe_substitution_cache" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on key for faster lookups
CREATE INDEX IF NOT EXISTS "recipe_substitution_cache_key_idx" ON "recipe_substitution_cache" ("key");

-- Automatically update updated_at on each row update
CREATE TRIGGER handle_recipe_substitution_cache_updated_at
BEFORE UPDATE ON "recipe_substitution_cache"
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
