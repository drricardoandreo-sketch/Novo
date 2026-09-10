-- Evolve Pilates SaaS — views auxiliares

create or replace view public.v_clients_risco_faltas as
select
  c.id as client_id,
  c.nome_completo,
  public.client_has_consecutive_absences(c.id, 2) as risco_cancelamento
from public.clients c
where c.status = 'ativo';
