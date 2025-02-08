-- Add rest_time column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rest_time integer;

-- Add check constraint to ensure rest_time is non-negative
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS rest_time_non_negative;
ALTER TABLE recipes ADD CONSTRAINT rest_time_non_negative CHECK (rest_time >= 0);

-- Update existing rows to have a default rest_time of 0
UPDATE recipes SET rest_time = 0 WHERE rest_time IS NULL;

-- Update total_time calculation to include rest_time
DROP TRIGGER IF EXISTS update_total_time ON recipes;
CREATE OR REPLACE FUNCTION calculate_total_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_time = COALESCE(NEW.prep_time, 0) + COALESCE(NEW.cook_time, 0) + COALESCE(NEW.rest_time, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_time
    BEFORE INSERT OR UPDATE OF prep_time, cook_time, rest_time
    ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_time();
