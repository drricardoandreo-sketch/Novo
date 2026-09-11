-- Evolve Pilates SaaS — papéis de acesso (admin vs. instrutor)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'instrutor');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text,
  role public.user_role not null default 'instrutor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Cria automaticamente um profile (role padrão: instrutor) para cada novo
-- usuário do Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_completo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_completo', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill: usuários que já existiam antes deste trigger.
insert into public.profiles (id, nome_completo, role)
select u.id, u.email, 'instrutor'
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "select_own_or_admin" on public.profiles;
create policy "select_own_or_admin" on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "admin_update_roles" on public.profiles;
create policy "admin_update_roles" on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Financeiro: acesso restrito a administradores -------------------------
drop policy if exists "staff_full_access" on public.payments;
drop policy if exists "admin_full_access" on public.payments;
create policy "admin_full_access" on public.payments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Clientes: leitura para toda a equipe, escrita restrita a admin --------
drop policy if exists "staff_full_access" on public.clients;
drop policy if exists "staff_select" on public.clients;
drop policy if exists "admin_write" on public.clients;
create policy "staff_select" on public.clients
  for select
  to authenticated
  using (true);
create policy "admin_write" on public.clients
  for insert
  to authenticated
  with check (public.is_admin());
create policy "admin_update" on public.clients
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "admin_delete" on public.clients
  for delete
  to authenticated
  using (public.is_admin());

-- Instrutores: leitura para toda a equipe, escrita restrita a admin -----
drop policy if exists "staff_full_access" on public.instructors;
drop policy if exists "staff_select" on public.instructors;
create policy "staff_select" on public.instructors
  for select
  to authenticated
  using (true);
create policy "admin_write" on public.instructors
  for insert
  to authenticated
  with check (public.is_admin());
create policy "admin_update" on public.instructors
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "admin_delete" on public.instructors
  for delete
  to authenticated
  using (public.is_admin());

-- Turmas, matrículas e frequência seguem liberadas para toda a equipe
-- (operação do dia a dia do estúdio), sem alteração das policies atuais.
