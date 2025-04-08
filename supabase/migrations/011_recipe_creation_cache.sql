-- Create recipe creation cache table
create table public.recipe_creation_cache (
    id uuid primary key default uuid_generate_v4(),
    key text not null unique,
    data jsonb not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    last_accessed_at timestamp with time zone default now()
);

-- Add updated_at trigger
create trigger handle_recipe_creation_cache_updated_at
    before update on public.recipe_creation_cache
    for each row
    execute function public.handle_updated_at();

-- Add last_accessed_at update function (if it doesn't already exist)
create or replace function public.update_recipe_creation_last_accessed()
returns trigger as $$
begin
    new.last_accessed_at = now();
    return new;
end;
$$ language plpgsql;

-- Add last_accessed_at trigger
create trigger update_recipe_creation_cache_last_accessed
    before update on public.recipe_creation_cache
    for each row
    execute function public.update_recipe_creation_last_accessed();

-- Add indexes
create index recipe_creation_cache_key_idx on public.recipe_creation_cache(key);
create index recipe_creation_cache_last_accessed_idx on public.recipe_creation_cache(last_accessed_at);

-- Enable RLS
alter table public.recipe_creation_cache enable row level security;

-- Add RLS policies
create policy "Allow public read access to recipe creation cache"
    on public.recipe_creation_cache for select
    to anon
    using (true);
