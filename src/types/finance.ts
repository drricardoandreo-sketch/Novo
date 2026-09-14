export type FinanceTransactionType = "receita" | "despesa";

export type FinancePaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "boleto"
  | "transferencia";

export type FinanceDebtStatus = "ativa" | "quitada";

export interface FinanceCategory {
  id: string;
  user_id: string;
  nome: string;
  tipo: FinanceTransactionType;
  cor: string;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  data: string;
  tipo: FinanceTransactionType;
  valor: number;
  categoria_id: string | null;
  descricao: string | null;
  forma_pagamento: FinancePaymentMethod;
  fixo: boolean;
  created_at: string;
  finance_categories?: { nome: string; cor: string } | null;
}

export interface FinanceDebt {
  id: string;
  user_id: string;
  nome: string;
  valor_original: number;
  saldo_devedor: number;
  taxa_juros_mensal: number;
  dia_vencimento: number | null;
  pagamento_minimo: number;
  status: FinanceDebtStatus;
  created_at: string;
  updated_at: string;
}

export interface FinanceDebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  valor: number;
  data_pagamento: string;
  observacao: string | null;
  created_at: string;
}

export interface FinanceSavingsGoal {
  id: string;
  user_id: string;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  data_meta: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceSavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  valor: number;
  data: string;
  observacao: string | null;
  created_at: string;
}

export const FINANCE_TRANSACTION_TYPE_LABEL: Record<FinanceTransactionType, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export const FINANCE_PAYMENT_METHOD_LABEL: Record<FinancePaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  boleto: "Boleto",
  transferencia: "Transferência",
};

export const FINANCE_DEBT_STATUS_LABEL: Record<FinanceDebtStatus, string> = {
  ativa: "Ativa",
  quitada: "Quitada",
};
