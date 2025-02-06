-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create recipes table
create table public.recipe_images (
    id uuid primary key default uuid_generate_v4(),
    recipe_id uuid not null,
    url text not null,
    position integer default 0,
    created_at timestamp with time zone default now()
);

create table public.recipes (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    servings integer not null check (servings > 0),
    tags text[] default array[]::text[],
    notes text[] default array[]::text[],
    prep_time integer check (prep_time > 0),
    cook_time integer check (cook_time > 0),
    total_time integer check (total_time > 0),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create ingredients table
create table public.recipe_ingredients (
    id uuid primary key default uuid_generate_v4(),
    recipe_id uuid references public.recipes(id) on delete cascade,
    name text not null,
    quantity numeric check (quantity > 0),
    unit text,
    notes text,
    position integer default 0 check (position >= 0)
);

-- Create instruction sections table
create table public.recipe_instruction_sections (
    id uuid primary key default uuid_generate_v4(),
    recipe_id uuid references public.recipes(id) on delete cascade,
    section_title text not null,
    position integer default 0 check (position >= 0)
);

-- Create instruction steps table
create table public.recipe_instruction_steps (
    id uuid primary key default uuid_generate_v4(),
    section_id uuid references public.recipe_instruction_sections(id) on delete cascade,
    text text not null,
    timing_min integer check (timing_min > 0),
    timing_max integer check (timing_max > 0),
    timing_units text check (timing_units in ('seconds', 'minutes', 'hours')),
    position integer default 0 check (position >= 0),
    check (timing_max >= timing_min)
);

-- Add foreign key for recipe_images
alter table public.recipe_images
    add constraint recipe_images_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete cascade;

-- Add RLS policies
alter table public.recipes enable row level security;
alter table public.recipe_images enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_instruction_sections enable row level security;
alter table public.recipe_instruction_steps enable row level security;

-- Create indexes
create index recipes_title_idx on public.recipes using gin (to_tsvector('english', title));
create index recipes_tags_idx on public.recipes using gin (tags);
create index recipe_images_recipe_id_idx on public.recipe_images(recipe_id);
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients(recipe_id);
create index recipe_instruction_sections_recipe_id_idx on public.recipe_instruction_sections(recipe_id);
create index recipe_instruction_steps_section_id_idx on public.recipe_instruction_steps(section_id);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_recipes_updated_at
    before update on public.recipes
    for each row
    execute function public.handle_updated_at();
