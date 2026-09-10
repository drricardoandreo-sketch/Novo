-- Evolve Pilates SaaS — tabelas principais

create table if not exists public.instructors (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  data_nascimento date not null,
  data_entrada date not null default current_date,
  telefone_whatsapp text not null,
  status public.client_status not null default 'ativo',
  forma_pagamento public.forma_pagamento not null default 'particular',
  dia_pagamento int not null check (dia_pagamento between 1 and 31),
  valor_plano numeric(10, 2) not null default 0 check (valor_plano >= 0),
  frequencia_semanal int not null default 1 check (frequencia_semanal > 0 and frequencia_semanal <= 7),
  instrutor_responsavel_id uuid references public.instructors (id) on delete set null,
  observacoes_saude text,
  atestado_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_status on public.clients (status);
create index if not exists idx_clients_dia_pagamento on public.clients (dia_pagamento);
create index if not exists idx_clients_data_nascimento on public.clients (data_nascimento);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  dia_semana public.dia_semana not null,
  horario time not null,
  capacidade_maxima int not null default 10 check (capacidade_maxima > 0),
  instrutor_id uuid references public.instructors (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dia_semana, horario, instrutor_id)
);

create index if not exists idx_classes_dia_horario on public.classes (dia_semana, horario);

-- Vínculo cliente x turma (matrícula recorrente). Além dos campos pedidos
-- (client_id, dia_semana, horario), guardamos class_id para checar
-- capacidade máxima da turma e para o check-in em `attendance`.
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  dia_semana public.dia_semana not null,
  horario time not null,
  created_at timestamptz not null default now(),
  unique (client_id, class_id)
);

create index if not exists idx_class_schedules_client on public.class_schedules (client_id);
create index if not exists idx_class_schedules_class on public.class_schedules (class_id);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  data date not null default current_date,
  presente boolean not null default false,
  reposicao boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, class_id, data)
);

create index if not exists idx_attendance_client_data on public.attendance (client_id, data desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  valor numeric(10, 2) not null check (valor >= 0),
  data_vencimento date not null,
  data_pagamento date,
  status public.payment_status not null default 'pendente',
  mes_referencia date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, mes_referencia)
);

create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payments_vencimento on public.payments (data_vencimento);
create index if not exists idx_payments_client on public.payments (client_id);
