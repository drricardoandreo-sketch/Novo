export type ClientStatus = "ativo" | "trancado" | "cancelado";
export type FormaPagamento = "particular" | "totalpass" | "gympass";
export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex" | "sab";
export type PaymentStatus = "pago" | "pendente" | "vencido";

export interface Instructor {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  data_entrada: string;
  telefone_whatsapp: string;
  status: ClientStatus;
  forma_pagamento: FormaPagamento;
  dia_pagamento: number;
  valor_plano: number;
  frequencia_semanal: number;
  instrutor_responsavel_id: string | null;
  observacoes_saude: string | null;
  atestado_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassSchedule {
  id: string;
  client_id: string;
  dia_semana: DiaSemana;
  horario: string;
}

export interface StudioClass {
  id: string;
  dia_semana: DiaSemana;
  horario: string;
  capacidade_maxima: number;
  instrutor_id: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  client_id: string;
  class_id: string;
  data: string;
  presente: boolean;
  reposicao: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: PaymentStatus;
  mes_referencia: string;
  created_at: string;
  updated_at: string;
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ativo: "Ativo",
  trancado: "Trancado",
  cancelado: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  vencido: "Vencido",
};

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
};
