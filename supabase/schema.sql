-- FixPic Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Processing history table
create table if not exists public.processing_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tool_type text not null, -- 'watermark', 'background', 'compress', 'resize', 'transparency'
  original_filename text not null,
  original_size bigint not null,
  result_size bigint,
  status text default 'completed' not null, -- 'processing', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb -- Additional data like dimensions, compression ratio, etc.
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.processing_history enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Processing history policies
create policy "Users can view own history"
  on public.processing_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.processing_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on public.processing_history for delete
  using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index if not exists idx_processing_history_user_id on public.processing_history(user_id);
create index if not exists idx_processing_history_created_at on public.processing_history(created_at desc);
create index if not exists idx_processing_history_tool_type on public.processing_history(tool_type);
