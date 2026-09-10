-- Evolve Pilates SaaS — Row Level Security
-- O painel usa Supabase Auth (usuários autenticados = equipe do estúdio).
-- A API de integração (n8n) usa a service role key no servidor e não
-- passa pelas políticas abaixo.

alter table public.instructors enable row level security;
alter table public.clients enable row level security;
alter table public.classes enable row level security;
alter table public.class_schedules enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;

drop policy if exists "staff_full_access" on public.instructors;
create policy "staff_full_access" on public.instructors
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_full_access" on public.clients;
create policy "staff_full_access" on public.clients
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_full_access" on public.classes;
create policy "staff_full_access" on public.classes
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_full_access" on public.class_schedules;
create policy "staff_full_access" on public.class_schedules
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_full_access" on public.attendance;
create policy "staff_full_access" on public.attendance
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff_full_access" on public.payments;
create policy "staff_full_access" on public.payments
  for all
  to authenticated
  using (true)
  with check (true);

-- Storage: bucket privado para atestados médicos / avaliações físicas ----
insert into storage.buckets (id, name, public)
values ('atestados', 'atestados', false)
on conflict (id) do nothing;

drop policy if exists "staff_manage_atestados" on storage.objects;
create policy "staff_manage_atestados" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'atestados')
  with check (bucket_id = 'atestados');
