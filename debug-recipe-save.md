# Debugging Recipe Save Issues

This guide will help you troubleshoot issues with recipe data not saving correctly, specifically images and instructions.

## Common Issues

1. **Row Level Security (RLS) Policies**: These policies control access to database tables. If the user_id isn't properly set or doesn't match the authenticated user, saving related data will fail.

2. **Data Structure Mismatches**: The structure in the frontend (Recipe object) may not match what the database expects.

3. **Console Logging**: We've added detailed logging to help identify where issues occur.

## Check User Authentication

Make sure you're properly authenticated before saving:

1. Open the browser console (F12) before saving a recipe
2. Verify the user object is present in the logs
3. Check that user.id matches the user_id being sent in recipe save operations

## Check Recipe Data Structure

The Recipe object should have:

```typescript
{
  id?: string;              // Optional for new recipes
  title: string;            // Required
  description: string;      // Required
  images: string[];         // Array of image URLs
  servings: number;         // Required
  ingredients: Ingredient[]; // Array of ingredient objects
  instructions: InstructionSection[]; // Array of instruction section objects
  notes: string[];          // Array of note strings
  tags: string[];           // Array of tag strings
  time_estimate?: {         // Optional time estimates
    prep: number;
    cook: number;
    rest: number;
    total: number;
  }
}
```

Pay special attention to:

-   `images`: Should be an array of strings, not objects
-   `instructions`: Should have the correct nested structure with sections and steps

## Check Database Policies

In Supabase Studio (http://localhost:54323), check:

1. Go to Authentication > Policies
2. Verify that all recipe-related tables have appropriate policies:

    - recipes
    - recipe_images
    - recipe_ingredients
    - recipe_instruction_sections
    - recipe_instruction_steps

3. Make sure all policies correctly use `auth.uid() = user_id` or the appropriate join conditions

## Specific Debugging Steps

1. Try saving a recipe with minimal data (just title, description, servings)
2. Check console logs for any errors during the save process
3. Verify the main recipe was saved in the Supabase Studio table browser
4. Try adding just one image, then check if it saves correctly
5. Try adding a single instruction section with one step

## Checking Database Data

In Supabase Studio (http://localhost:54323):

1. Navigate to Table Editor
2. Check the `recipes` table
3. Find your recently saved recipe
4. Check related tables by using the recipe ID:
    - `recipe_images`: Look for entries with matching recipe_id
    - `recipe_instruction_sections`: Look for sections with matching recipe_id
    - `recipe_instruction_steps`: Join with sections to find correct steps

## Potential Fixes

If you identify issues:

1. **Image URLs**: Make sure image URLs are valid and accessible
2. **User ID**: Ensure the user_id is properly set in all recipe operations
3. **Instruction Structure**: Verify the instruction sections and steps have the correct format
4. **Database Schema**: Check for any schema constraints that might prevent saving

With the added logging in the RecipeService, you should see detailed information about each step of the save process in the browser console.
