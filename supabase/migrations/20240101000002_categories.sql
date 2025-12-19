create table public.categories (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  user_id uuid null,
  name text null,
  description text null,
  color character varying null,
  icon character varying null,
  constraint categories_pkey primary key (id),
  constraint categories_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
