# Applying the Decimal Timing Migration

This guide explains how to apply the new migration that adds support for decimal timing values in recipe instructions.

## What This Migration Does

The migration converts the `timing_min` and `timing_max` columns in the `recipe_instruction_steps` table from integer to numeric(10, 2), allowing for:

-   Storage of decimal values (e.g., 0.5 minutes instead of 30 seconds)
-   Precision up to 2 decimal places
-   More natural representation of cooking times

## How to Apply the Migration

### 1. Reset the Local Database (Development Only)

```bash
npm run db:reset
```

This command will apply all migrations including the new one.

### 2. Deploy Migration to Production

When you're ready to apply to production, use:

```bash
npm run supabase:db:push
```

This will push the migration to your Supabase project.

## Testing the Changes

After applying the migration, you should test by:

1. Editing an existing recipe or creating a new one
2. Adding steps with decimal timing values (e.g., 0.5 minutes, 1.5 hours)
3. Saving the recipe and verifying it saves successfully
4. Viewing the recipe to ensure the timing values display correctly

## Reverting (If Needed)

If you encounter issues, you can create a revert migration:

```sql
-- Revert timing columns back to integer
ALTER TABLE recipe_instruction_steps
    ALTER COLUMN timing_min TYPE INTEGER USING timing_min::INTEGER,
    ALTER COLUMN timing_max TYPE INTEGER USING timing_max::INTEGER;
```

But this should only be necessary in extreme cases, as any decimal values would be truncated.
