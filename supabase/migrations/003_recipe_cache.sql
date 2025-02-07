-- Create recipe extraction cache table
create table public.recipe_extraction_cache (
    id uuid primary key default uuid_generate_v4(),
    url text not null unique,
    extracted_data jsonb not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    last_accessed_at timestamp with time zone default now()
);

-- Add updated_at trigger
create trigger handle_recipe_extraction_cache_updated_at
    before update on public.recipe_extraction_cache
    for each row
    execute function public.handle_updated_at();

-- Add last_accessed_at update function
create or replace function public.update_last_accessed_at()
returns trigger as $$
begin
    new.last_accessed_at = now();
    return new;
end;
$$ language plpgsql;

-- Add last_accessed_at trigger
create trigger update_recipe_extraction_cache_last_accessed
    before update on public.recipe_extraction_cache
    for each row
    execute function public.update_last_accessed_at();

-- Add indexes
create index recipe_extraction_cache_url_idx on public.recipe_extraction_cache(url);
create index recipe_extraction_cache_last_accessed_idx on public.recipe_extraction_cache(last_accessed_at);

-- Enable RLS
alter table public.recipe_extraction_cache enable row level security;

-- Add RLS policies
create policy "Allow public read access to recipe cache"
    on public.recipe_extraction_cache for select
    to anon
    using (true);

-- Create function to get or set cache
create or replace function public.get_or_set_recipe_cache(
    p_url text,
    p_data jsonb default null
) returns jsonb as $$
declare
    v_cached_data jsonb;
begin
    -- Try to get existing cache entry
    select extracted_data into v_cached_data
    from public.recipe_extraction_cache
    where url = p_url;

    -- If found, update last_accessed_at and return data
    if found then
        update public.recipe_extraction_cache
        set last_accessed_at = now()
        where url = p_url;
        return v_cached_data;
    end if;

    -- If no cache entry and new data provided, insert it
    if p_data is not null then
        insert into public.recipe_extraction_cache (url, extracted_data)
        values (p_url, p_data)
        returning extracted_data into v_cached_data;
        return v_cached_data;
    end if;

    -- No cache entry and no data provided
    return null;
end;
$$ language plpgsql security definer;
