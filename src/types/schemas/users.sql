create table public.users (
  id uuid not null default auth.uid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp without time zone null default now(),
  deleted_at timestamp without time zone null,
  username character varying null,
  full_name character varying null,
  email character varying null,
  role character varying null default 'user'::character varying,
  avatar_url character varying null,
  background_url character varying null,
  is_active boolean null default true,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;

create trigger trigger_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION set_updated_at ();