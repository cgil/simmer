-- Alter recipe_instruction_steps table to support decimal timing values
-- Migration: 007_decimal_timing_values.sql

-- Drop existing timing check constraints
ALTER TABLE recipe_instruction_steps DROP CONSTRAINT IF EXISTS recipe_instruction_steps_timing_min_check;
ALTER TABLE recipe_instruction_steps DROP CONSTRAINT IF EXISTS recipe_instruction_steps_timing_max_check;

-- Convert timing_min and timing_max columns from integer to numeric(10, 2)
-- This allows numbers up to 8 digits with 2 decimal places
ALTER TABLE recipe_instruction_steps
    ALTER COLUMN timing_min TYPE NUMERIC(10, 2) USING timing_min::NUMERIC(10, 2),
    ALTER COLUMN timing_max TYPE NUMERIC(10, 2) USING timing_max::NUMERIC(10, 2);

-- Add back check constraints to ensure timing values are positive or null
ALTER TABLE recipe_instruction_steps
    ADD CONSTRAINT recipe_instruction_steps_timing_min_check
    CHECK (timing_min IS NULL OR timing_min >= 0);

ALTER TABLE recipe_instruction_steps
    ADD CONSTRAINT recipe_instruction_steps_timing_max_check
    CHECK (timing_max IS NULL OR timing_max >= 0);

-- Comment on columns to document the change
COMMENT ON COLUMN recipe_instruction_steps.timing_min IS 'Minimum timing value in the specified units with up to 2 decimal places';
COMMENT ON COLUMN recipe_instruction_steps.timing_max IS 'Maximum timing value in the specified units with up to 2 decimal places';
