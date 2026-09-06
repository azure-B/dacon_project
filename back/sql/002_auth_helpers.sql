-- 로그인 ID 조회용 (SQL Editor에서 Run)
-- service_role 없이도 anon 로그인이 가능하도록 함

create or replace function public.email_for_login_id(p_login_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where login_id = p_login_id
  limit 1;
$$;

create or replace function public.login_id_taken(p_login_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where login_id = p_login_id
  );
$$;

grant execute on function public.email_for_login_id(text) to anon, authenticated;
grant execute on function public.login_id_taken(text) to anon, authenticated;
