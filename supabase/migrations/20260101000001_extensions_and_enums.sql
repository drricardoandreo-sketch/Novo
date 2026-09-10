-- Evolve Pilates SaaS — extensões e tipos enumerados
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum ('ativo', 'trancado', 'cancelado');
  end if;

  if not exists (select 1 from pg_type where typname = 'forma_pagamento') then
    create type public.forma_pagamento as enum ('particular', 'totalpass', 'gympass');
  end if;

  if not exists (select 1 from pg_type where typname = 'dia_semana') then
    create type public.dia_semana as enum ('seg', 'ter', 'qua', 'qui', 'sex', 'sab');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pago', 'pendente', 'vencido');
  end if;
end
$$;
