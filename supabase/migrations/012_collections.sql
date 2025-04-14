-- Migration: 012_collections.sql
-- Description: Add collections functionality

-- Create collections table
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add updated_at trigger for collections
create trigger handle_collections_updated_at
  before update on public.collections
  for each row
  execute function public.handle_updated_at();

-- Create recipe-collections junction table
create table public.recipe_collections (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  collection_id uuid references public.collections(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(recipe_id, collection_id) -- Prevent duplicates
);

-- Add indexes for performance
create index collections_user_id_idx on public.collections(user_id);
create index recipe_collections_recipe_id_idx on public.recipe_collections(recipe_id);
create index recipe_collections_collection_id_idx on public.recipe_collections(collection_id);

-- Enable Row Level Security
alter table public.collections enable row level security;
alter table public.recipe_collections enable row level security;

-- Create RLS policies
-- Users can manage their own collections
create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- Users can manage recipes in their collections
create policy "Users can view their own recipe collections"
  on recipe_collections for select
  using (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can insert their own recipe collections"
  on recipe_collections for insert
  with check (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can delete their own recipe collections"
  on recipe_collections for delete
  using (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- Create stored procedure for getting collection counts
create or replace function get_collection_counts(collection_ids uuid[])
returns table (collection_id uuid, count bigint) as $$
begin
  return query
  select rc.collection_id, count(rc.recipe_id)::bigint
  from recipe_collections rc
  where rc.collection_id = ANY(collection_ids)
  group by rc.collection_id;
end;
$$ language plpgsql security definer;

-- Add comments for documentation
comment on table collections is 'User-created recipe collections';
comment on table recipe_collections is 'Junction table linking recipes to collections';
comment on column collections.emoji is 'Optional emoji to visually represent the collection';
comment on function get_collection_counts is 'Get recipe counts for multiple collections at once';
