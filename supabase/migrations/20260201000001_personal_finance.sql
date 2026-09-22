-- Finanças Pessoais — módulo pessoal do dono da conta (admin), apartado
-- dos dados do estúdio. Cada linha pertence a um user_id (auth.uid()),
-- então mesmo com mais de um admin no futuro, os dados não se misturam.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'finance_transaction_type') then
    create type public.finance_transaction_type as enum ('receita', 'despesa');
  end if;

  if not exists (select 1 from pg_type where typname = 'finance_payment_method') then
    create type public.finance_payment_method as enum (
      'dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'transferencia'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'finance_debt_status') then
    create type public.finance_debt_status as enum ('ativa', 'quitada');
  end if;
end
$$;

create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo public.finance_transaction_type not null,
  cor text not null default '#16a34a',
  created_at timestamptz not null default now(),
  unique (user_id, nome, tipo)
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null default current_date,
  tipo public.finance_transaction_type not null,
  valor numeric(10, 2) not null check (valor > 0),
  categoria_id uuid references public.finance_categories (id) on delete set null,
  descricao text,
  forma_pagamento public.finance_payment_method not null default 'pix',
  fixo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_transactions_user_data
  on public.finance_transactions (user_id, data desc);
create index if not exists idx_finance_transactions_categoria
  on public.finance_transactions (categoria_id);

create table if not exists public.finance_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_original numeric(10, 2) not null check (valor_original >= 0),
  saldo_devedor numeric(10, 2) not null check (saldo_devedor >= 0),
  taxa_juros_mensal numeric(5, 2) not null default 0 check (taxa_juros_mensal >= 0),
  dia_vencimento int check (dia_vencimento between 1 and 31),
  pagamento_minimo numeric(10, 2) not null default 0 check (pagamento_minimo >= 0),
  status public.finance_debt_status not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_finance_debts_user_status
  on public.finance_debts (user_id, status);

create table if not exists public.finance_debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.finance_debts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  data_pagamento date not null default current_date,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_debt_payments_debt
  on public.finance_debt_payments (debt_id, data_pagamento desc);

create table if not exists public.finance_savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_meta numeric(10, 2) not null check (valor_meta > 0),
  valor_atual numeric(10, 2) not null default 0 check (valor_atual >= 0),
  data_meta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.finance_savings_goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  data date not null default current_date,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_savings_contrib_goal
  on public.finance_savings_contributions (goal_id, data desc);

-- updated_at automático ---------------------------------------------------
drop trigger if exists trg_finance_debts_updated_at on public.finance_debts;
create trigger trg_finance_debts_updated_at
  before update on public.finance_debts
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_finance_savings_goals_updated_at on public.finance_savings_goals;
create trigger trg_finance_savings_goals_updated_at
  before update on public.finance_savings_goals
  for each row
  execute function public.set_updated_at();

-- Pagamento de dívida abate o saldo devedor automaticamente --------------
create or replace function public.apply_finance_debt_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.finance_debts
  set
    saldo_devedor = greatest(saldo_devedor - new.valor, 0),
    status = case
      when saldo_devedor - new.valor <= 0 then 'quitada'
      else status
    end
  where id = new.debt_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_finance_debt_payment on public.finance_debt_payments;
create trigger trg_apply_finance_debt_payment
  after insert on public.finance_debt_payments
  for each row
  execute function public.apply_finance_debt_payment();

-- Aporte em meta soma ao valor atual automaticamente ---------------------
create or replace function public.apply_finance_savings_contribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.finance_savings_goals
  set valor_atual = valor_atual + new.valor
  where id = new.goal_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_finance_savings_contribution on public.finance_savings_contributions;
create trigger trg_apply_finance_savings_contribution
  after insert on public.finance_savings_contributions
  for each row
  execute function public.apply_finance_savings_contribution();

-- RLS: cada usuário só enxerga e mexe nos próprios dados -----------------
alter table public.finance_categories enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_debts enable row level security;
alter table public.finance_debt_payments enable row level security;
alter table public.finance_savings_goals enable row level security;
alter table public.finance_savings_contributions enable row level security;

drop policy if exists "owner_full_access" on public.finance_categories;
create policy "owner_full_access" on public.finance_categories
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner_full_access" on public.finance_transactions;
create policy "owner_full_access" on public.finance_transactions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner_full_access" on public.finance_debts;
create policy "owner_full_access" on public.finance_debts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner_full_access" on public.finance_debt_payments;
create policy "owner_full_access" on public.finance_debt_payments
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner_full_access" on public.finance_savings_goals;
create policy "owner_full_access" on public.finance_savings_goals
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner_full_access" on public.finance_savings_contributions;
create policy "owner_full_access" on public.finance_savings_contributions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
