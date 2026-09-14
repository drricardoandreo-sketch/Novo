import type { FinanceDebt } from "@/types/finance";

export type DebtStrategy = "bola_de_neve" | "avalanche";

export const DEBT_STRATEGY_LABEL: Record<DebtStrategy, string> = {
  bola_de_neve: "Bola de neve (menor saldo primeiro)",
  avalanche: "Avalanche (maior juros primeiro)",
};

/**
 * Ordena as dívidas ativas pela estratégia escolhida:
 * - bola de neve: quita as menores primeiro (ganho psicológico rápido);
 * - avalanche: ataca primeiro quem cobra mais juros (economiza mais dinheiro).
 */
export function sortDebtsByStrategy(
  debts: FinanceDebt[],
  strategy: DebtStrategy
): FinanceDebt[] {
  const ativas = debts.filter((d) => d.status === "ativa");

  return [...ativas].sort((a, b) =>
    strategy === "bola_de_neve"
      ? a.saldo_devedor - b.saldo_devedor
      : b.taxa_juros_mensal - a.taxa_juros_mensal
  );
}

/**
 * Estima quantos meses faltam para quitar uma dívida, dado um pagamento
 * mensal fixo. Usa a fórmula padrão de amortização; se o pagamento não
 * cobrir nem os juros do mês, retorna null (nunca quita nesse ritmo).
 */
export function estimateMonthsToPayoff(
  saldoDevedor: number,
  taxaJurosMensal: number,
  pagamentoMensal: number
): number | null {
  if (saldoDevedor <= 0) return 0;
  if (pagamentoMensal <= 0) return null;

  const r = taxaJurosMensal / 100;

  if (r === 0) {
    return Math.ceil(saldoDevedor / pagamentoMensal);
  }

  if (pagamentoMensal <= saldoDevedor * r) {
    return null;
  }

  const meses =
    -Math.log(1 - (r * saldoDevedor) / pagamentoMensal) / Math.log(1 + r);

  return Math.ceil(meses);
}
