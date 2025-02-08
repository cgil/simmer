-- Add rest_time column to recipes table
ALTER TABLE recipes ADD COLUMN rest_time integer;

-- Add check constraint to ensure rest_time is non-negative
ALTER TABLE recipes ADD CONSTRAINT rest_time_non_negative CHECK (rest_time >= 0);

-- Update existing rows to have a default rest_time of 0
UPDATE recipes SET rest_time = 0 WHERE rest_time IS NULL;
