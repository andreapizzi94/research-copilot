-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  institution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Research contexts
create table public.research_contexts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  population text,
  outcomes text,
  keywords text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.research_contexts enable row level security;

create policy "Users can manage own contexts"
  on public.research_contexts for all
  using (auth.uid() = user_id);

-- Saved papers
create table public.saved_papers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pubmed_id text not null,
  title text not null,
  authors text[] default '{}',
  abstract text,
  journal text,
  year integer,
  doi text,
  relevance_score integer,
  ai_summary text,
  ai_relevance_note text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  unique(user_id, pubmed_id)
);

alter table public.saved_papers enable row level security;

create policy "Users can manage own papers"
  on public.saved_papers for all
  using (auth.uid() = user_id);

-- Index for performance
create index idx_saved_papers_user_id on public.saved_papers(user_id);
create index idx_research_contexts_user_id on public.research_contexts(user_id);

-- Manuscripts
create table public.manuscripts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Senza titolo',
  introduction text default '',
  methods text default '',
  results text default '',
  discussion text default '',
  status text default 'draft' check (status in ('draft', 'review', 'final')),
  cited_paper_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.manuscripts enable row level security;

create policy "Users can manage own manuscripts"
  on public.manuscripts for all
  using (auth.uid() = user_id);

create index idx_manuscripts_user_id on public.manuscripts(user_id);

-- Data analyses history
create table public.data_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  dataset_name text not null default 'Dataset',
  n_rows integer,
  n_cols integer,
  query text not null,
  result jsonb not null,
  suggestions text[] default '{}',
  created_at timestamptz default now()
);

alter table public.data_analyses enable row level security;

create policy "Users can manage own analyses"
  on public.data_analyses for all
  using (auth.uid() = user_id);

create index idx_data_analyses_user_id on public.data_analyses(user_id);
