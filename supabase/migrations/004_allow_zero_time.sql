-- Allow zero values for time fields in recipes table
alter table public.recipes
    drop constraint if exists recipes_prep_time_check,
    drop constraint if exists recipes_cook_time_check,
    drop constraint if exists recipes_total_time_check;

alter table public.recipes
    add constraint recipes_prep_time_check check (prep_time >= 0),
    add constraint recipes_cook_time_check check (cook_time >= 0),
    add constraint recipes_total_time_check check (total_time >= 0);
