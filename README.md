# Evolve — Gestão de Estúdio de Pilates

SaaS de gestão para o estúdio de pilates Evolve: cadastro de clientes,
turmas/horários, check-in de frequência, controle de pagamentos e
dashboard financeiro, com API dual-auth para integração externa (n8n).

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage)
- **Vercel** (deploy)
- API com autenticação dupla: cookie de sessão (dashboard) e header
  `x-api-key` (integrações externas via n8n)

## Estrutura do projeto

```
src/
  app/
    login/                  # tela de login (Supabase Auth)
    dashboard/               # área autenticada
      page.tsx                # visão geral (MRR, inadimplência, ticket médio)
      clientes/                # cadastro/edição de clientes
      turmas/                  # turmas, capacidade e matrícula
      frequencia/               # check-in e clientes em risco
      pagamentos/               # kanban de vencimentos
    api/
      clients/due-soon/         # GET — pagamentos a vencer em X dias
      clients/birthdays-today/  # GET — aniversariantes do dia
      payments/register/        # POST — registrar pagamento recebido
  components/dashboard/        # Sidebar, formulário de cliente
  lib/
    supabase/                  # clientes browser/server/middleware + service role
    api-auth.ts                # autenticação dual das rotas de API
    format.ts                  # helpers de formatação (moeda, data)
  types/database.ts            # tipos das tabelas do Supabase
supabase/
  migrations/                  # schema completo (tabelas, enums, triggers, RLS)
  config.toml                  # config do Supabase CLI (dev local)
```

## 1. Configurar o Supabase

Este ambiente não tem acesso interativo (browser) para `supabase login`,
então a criação/link do projeto precisa ser feita manualmente:

1. Crie um projeto em https://supabase.com/dashboard (ou use um existente).
2. Em **Project Settings > API**, copie `Project URL`, `anon public key` e
   `service_role key`.
3. Rode as migrations do schema (`supabase/migrations/*.sql`) de uma das formas:
   - **Supabase CLI** (recomendado):
     ```bash
     npx supabase login
     npx supabase link --project-ref SEU_PROJECT_REF
     npx supabase db push
     ```
   - **SQL Editor do painel Supabase**: cole o conteúdo de cada arquivo em
     `supabase/migrations/`, na ordem numérica, e execute.
4. (Opcional, recomendado) Habilite a extensão **pg_cron** em
   *Database > Extensions* para agendar automaticamente:
   - geração mensal de mensalidades (`generate_monthly_payments`), todo
     dia 1 às 03h;
   - marcação de pagamentos vencidos (`mark_overdue_payments`), todo dia
     às 04h.

   Sem `pg_cron`, use os botões "Gerar mensalidades do mês" / "Marcar
   vencidos" na tela **Pagamentos** do dashboard, ou agende chamadas via
   n8n para as mesmas funções (`select public.generate_monthly_payments();`
   / `select public.mark_overdue_payments();`) através do SQL editor da API
   do Supabase.
5. Em **Authentication > Users**, crie os usuários da equipe do estúdio
   manualmente (o cadastro público está desabilitado — só quem tem
   usuário/senha criado pelo admin acessa o painel).

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings > API > service_role (secreta!) |
| `EVOLVE_API_KEY` | defina você mesmo (ex: `openssl rand -hex 32`) |

## 3. Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 4. Deploy na Vercel

Também não é possível fazer `vercel login` interativo neste ambiente.
Para publicar:

```bash
npm i -g vercel
vercel login
vercel link            # cria/conecta o projeto "evolve-pilates"
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add EVOLVE_API_KEY production
vercel --prod
```

Repita `vercel env add` para os ambientes `preview` e `development` se
necessário.

### Subdomínio próprio (evolve.evolveaut.com.br)

1. No painel da Vercel, vá em **Project > Settings > Domains** e adicione
   `evolve.evolveaut.com.br`.
2. No provedor de DNS do domínio `evolveaut.com.br`, crie um registro
   `CNAME` apontando `evolve` para `cname.vercel-dns.com` (a Vercel indica
   o valor exato na tela de domínios).
3. Aguarde a validação/SSL automático da Vercel.

## 5. API para integração externa (n8n)

Todas as rotas aceitam autenticação por **cookie de sessão** (chamadas
feitas pelo próprio dashboard) OU pelo header `x-api-key: EVOLVE_API_KEY`
(chamadas externas, ex: n8n).

### Clientes com pagamento a vencer em X dias

```
GET /api/clients/due-soon?days=3
x-api-key: <EVOLVE_API_KEY>
```

### Aniversariantes do dia

```
GET /api/clients/birthdays-today
x-api-key: <EVOLVE_API_KEY>
```

### Registrar pagamento recebido

```
POST /api/payments/register
x-api-key: <EVOLVE_API_KEY>
Content-Type: application/json

{ "payment_id": "uuid" }
```

ou

```json
{ "client_id": "uuid", "mes_referencia": "2026-01-01" }
```

Opcionalmente informe `"data_pagamento": "YYYY-MM-DD"` (padrão: hoje).

## Modelo de dados

Ver `supabase/migrations/` para o schema completo (tabelas `clients`,
`instructors`, `classes`, `class_schedules`, `attendance`, `payments`,
enums, triggers de negócio e RLS).
