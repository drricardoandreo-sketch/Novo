import { requireFinanceContext } from "@/lib/finance/guard";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ProgressBar } from "@/components/dashboard/finance/progress-bar";
import {
  DEBT_STRATEGY_LABEL,
  estimateMonthsToPayoff,
  sortDebtsByStrategy,
  type DebtStrategy,
} from "@/lib/finance/debt-strategy";
import { FINANCE_DEBT_STATUS_LABEL, type FinanceDebt } from "@/types/finance";
import {
  createDebtAction,
  deleteDebtAction,
  registerDebtPaymentAction,
} from "./actions";

export default async function DividasPage({
  searchParams,
}: {
  searchParams: { estrategia?: string };
}) {
  const { supabase } = await requireFinanceContext();
  const estrategia: DebtStrategy =
    searchParams.estrategia === "avalanche" ? "avalanche" : "bola_de_neve";

  const { data: dividas } = await supabase
    .from("finance_debts")
    .select("*")
    .order("created_at", { ascending: true });

  const lista = (dividas ?? []) as FinanceDebt[];
  const ativas = sortDebtsByStrategy(lista, estrategia);
  const quitadas = lista.filter((d) => d.status === "quitada");

  const totalDevedor = ativas.reduce((sum, d) => sum + Number(d.saldo_devedor), 0);
  const totalMinimo = ativas.reduce((sum, d) => sum + Number(d.pagamento_minimo), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Dívidas</h1>
        <p className="text-sm text-gray-500">
          Cadastre tudo que você deve e siga a ordem sugerida pra sair da
          pindaíba mais rápido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Total devedor</p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {formatCurrency(totalDevedor)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Soma dos mínimos mensais</p>
          <p className="mt-1 text-xl font-semibold text-evolve-900">
            {formatCurrency(totalMinimo)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Dívidas quitadas</p>
          <p className="mt-1 text-xl font-semibold text-evolve-700">
            {quitadas.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form action={createDebtAction} className="card space-y-4">
          <h2 className="font-medium text-evolve-900">Nova dívida</h2>
          <div>
            <label className="label">Nome</label>
            <input type="text" name="nome" required className="input" />
          </div>
          <div>
            <label className="label">Valor original (R$)</label>
            <input
              type="number"
              name="valor_original"
              step="0.01"
              min="0"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Saldo devedor hoje (R$)</label>
            <input
              type="number"
              name="saldo_devedor"
              step="0.01"
              min="0"
              className="input"
              placeholder="deixe igual ao original se nunca pagou"
            />
          </div>
          <div>
            <label className="label">Juros ao mês (%)</label>
            <input
              type="number"
              name="taxa_juros_mensal"
              step="0.01"
              min="0"
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label">Pagamento mínimo mensal (R$)</label>
            <input
              type="number"
              name="pagamento_minimo"
              step="0.01"
              min="0"
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label">Dia de vencimento (opcional)</label>
            <input
              type="number"
              name="dia_vencimento"
              min="1"
              max="31"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Cadastrar dívida
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-evolve-900">
              Ordem sugerida de quitação
            </h2>
            <form className="flex items-center gap-2">
              <select name="estrategia" defaultValue={estrategia} className="input max-w-xs">
                <option value="bola_de_neve">
                  {DEBT_STRATEGY_LABEL.bola_de_neve}
                </option>
                <option value="avalanche">{DEBT_STRATEGY_LABEL.avalanche}</option>
              </select>
              <button type="submit" className="btn-secondary text-sm">
                Aplicar
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {ativas.map((d, index) => {
              const pago = Number(d.valor_original) - Number(d.saldo_devedor);
              const meses = estimateMonthsToPayoff(
                Number(d.saldo_devedor),
                Number(d.taxa_juros_mensal),
                Number(d.pagamento_minimo)
              );

              return (
                <div key={d.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-evolve-600">
                        #{index + 1} nessa estratégia
                      </p>
                      <h3 className="font-medium text-evolve-900">{d.nome}</h3>
                      <p className="text-xs text-gray-500">
                        Juros: {formatPercent(Number(d.taxa_juros_mensal))} a.m.
                        {d.dia_vencimento ? ` · vence dia ${d.dia_vencimento}` : ""}
                      </p>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteDebtAction(d.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        excluir
                      </button>
                    </form>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Pago {formatCurrency(pago)} de{" "}
                        {formatCurrency(Number(d.valor_original))}
                      </span>
                      <span className="font-medium text-red-600">
                        Falta {formatCurrency(Number(d.saldo_devedor))}
                      </span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar
                        value={pago}
                        max={Number(d.valor_original) || 1}
                        tone="evolve"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {meses === null
                      ? "O pagamento mínimo cadastrado não cobre nem os juros — aumente o valor pra essa dívida sair do lugar."
                      : `No ritmo do pagamento mínimo (${formatCurrency(
                          Number(d.pagamento_minimo)
                        )}/mês), quita em ~${meses} mês(es).`}
                  </p>

                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await registerDebtPaymentAction(d.id, formData);
                    }}
                    className="flex flex-wrap items-end gap-2 border-t border-evolve-100 pt-3"
                  >
                    <div>
                      <label className="label">Registrar pagamento</label>
                      <input
                        type="number"
                        name="valor"
                        step="0.01"
                        min="0.01"
                        required
                        className="input w-32"
                        placeholder="R$"
                      />
                    </div>
                    <input
                      type="date"
                      name="data_pagamento"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="input w-40"
                    />
                    <button type="submit" className="btn-secondary text-sm">
                      Pagar
                    </button>
                  </form>
                </div>
              );
            })}
            {ativas.length === 0 && (
              <p className="card text-sm text-gray-400">
                Nenhuma dívida ativa cadastrada. 🎉
              </p>
            )}
          </div>

          {quitadas.length > 0 && (
            <div className="card space-y-2">
              <h2 className="font-medium text-evolve-900">Quitadas</h2>
              {quitadas.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-sm text-gray-500"
                >
                  <span>{d.nome}</span>
                  <span className="badge bg-evolve-100 text-evolve-800">
                    {FINANCE_DEBT_STATUS_LABEL.quitada}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
