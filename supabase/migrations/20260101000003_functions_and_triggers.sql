-- Evolve Pilates SaaS — funções e triggers de negócio

-- updated_at automático -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row
  execute function public.set_updated_at();

-- Status de pagamento coerente com as datas ------------------------------
create or replace function public.sync_payment_status()
returns trigger
language plpgsql
as $$
begin
  if new.data_pagamento is not null then
    new.status = 'pago';
  elsif new.data_vencimento < current_date then
    new.status = 'vencido';
  else
    new.status = 'pendente';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payments_sync_status on public.payments;
create trigger trg_payments_sync_status
  before insert or update of data_pagamento, data_vencimento on public.payments
  for each row
  execute function public.sync_payment_status();

-- Capacidade máxima da turma e frequência semanal contratada ------------
create or replace function public.enforce_class_schedule_rules()
returns trigger
language plpgsql
as $$
declare
  v_capacidade int;
  v_matriculados int;
  v_frequencia int;
  v_agendamentos int;
begin
  if new.class_id is not null then
    select capacidade_maxima into v_capacidade
    from public.classes
    where id = new.class_id;

    if v_capacidade is null then
      raise exception 'Turma % não encontrada', new.class_id;
    end if;

    select count(*) into v_matriculados
    from public.class_schedules
    where class_id = new.class_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if v_matriculados >= v_capacidade then
      raise exception 'Turma lotada: capacidade máxima de % já atingida', v_capacidade
        using errcode = 'P0001';
    end if;
  end if;

  select frequencia_semanal into v_frequencia
  from public.clients
  where id = new.client_id;

  select count(*) into v_agendamentos
  from public.class_schedules
  where client_id = new.client_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_frequencia is not null and (v_agendamentos + 1) > v_frequencia then
    raise exception 'Cliente já possui % aula(s) semanal(is) agendada(s), acima da frequência contratada (%)',
      v_agendamentos + 1, v_frequencia
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_class_schedules_rules on public.class_schedules;
create trigger trg_class_schedules_rules
  before insert or update on public.class_schedules
  for each row
  execute function public.enforce_class_schedule_rules();

-- Geração automática de mensalidades -------------------------------------
create or replace function public.generate_monthly_payments(p_month date default date_trunc('month', current_date))
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', p_month);
  v_last_day int := extract(day from (v_month + interval '1 month' - interval '1 day'));
  v_count int := 0;
  v_client record;
  v_dia int;
  v_vencimento date;
begin
  for v_client in
    select id, dia_pagamento, valor_plano
    from public.clients
    where status = 'ativo'
  loop
    v_dia := least(v_client.dia_pagamento, v_last_day);
    v_vencimento := v_month + (v_dia - 1) * interval '1 day';

    insert into public.payments (client_id, valor, data_vencimento, mes_referencia, status)
    values (
      v_client.id,
      v_client.valor_plano,
      v_vencimento,
      v_month,
      case when v_vencimento < current_date then 'vencido' else 'pendente' end
    )
    on conflict (client_id, mes_referencia) do nothing;

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

-- Marca como vencido pagamentos pendentes cuja data passou ---------------
create or replace function public.mark_overdue_payments()
returns integer
language sql
security definer
set search_path = public
as $$
  with updated as (
    update public.payments
    set status = 'vencido'
    where status = 'pendente'
      and data_pagamento is null
      and data_vencimento < current_date
    returning id
  )
  select count(*)::int from updated;
$$;

-- Sinaliza cliente com 2+ faltas seguidas ---------------------------------
create or replace function public.client_has_consecutive_absences(
  p_client_id uuid,
  p_threshold int default 2
)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select bool_and(not presente)
      from (
        select presente
        from public.attendance
        where client_id = p_client_id
        order by data desc
        limit p_threshold
      ) recentes
      having count(*) = p_threshold
    ),
    false
  );
$$;

-- Agenda via pg_cron, quando a extensão estiver disponível no projeto ----
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('evolve-generate-monthly-payments');
  end if;
exception when others then
  null;
end
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'evolve-generate-monthly-payments',
      '0 3 1 * *',
      $$select public.generate_monthly_payments();$$
    );
  end if;
exception when others then
  null;
end
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('evolve-mark-overdue-payments');
  end if;
exception when others then
  null;
end
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'evolve-mark-overdue-payments',
      '0 4 * * *',
      $$select public.mark_overdue_payments();$$
    );
  end if;
exception when others then
  null;
end
$$;
