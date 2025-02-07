-- Create rate limits table
create table public.rate_limits (
    id uuid primary key default uuid_generate_v4(),
    key text not null unique,
    count integer default 0 check (count >= 0),
    reset_at timestamp with time zone default now() + interval '1 day',
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add updated_at trigger
create trigger handle_rate_limits_updated_at
    before update on public.rate_limits
    for each row
    execute function public.handle_updated_at();

-- Create function to increment rate limit
create or replace function public.increment_rate_limit(p_key text, p_user_id uuid)
returns void as $$
declare
    v_rate_limit record;
begin
    -- Get or create rate limit record
    select * into v_rate_limit
    from public.rate_limits
    where key = p_key
    for update skip locked;  -- Add row-level locking for concurrent updates

    if not found then
        insert into public.rate_limits (key, count, user_id)
        values (p_key, 1, p_user_id);
    else
        -- Reset count if past reset time
        if v_rate_limit.reset_at <= now() then
            update public.rate_limits
            set count = 1,
                reset_at = now() + interval '1 day'
            where key = p_key;
        else
            update public.rate_limits
            set count = count + 1
            where key = p_key;
        end if;
    end if;
end;
$$ language plpgsql security definer;

-- Add RLS policies
alter table public.rate_limits enable row level security;

create policy "Users can view their own rate limits"
    on public.rate_limits for select
    using (auth.uid() = user_id);

-- Create indexes
create index rate_limits_key_idx on public.rate_limits(key);
create index rate_limits_user_id_idx on public.rate_limits(user_id);
create index rate_limits_reset_at_idx on public.rate_limits(reset_at);
