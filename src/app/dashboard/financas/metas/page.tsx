import { requireFinanceContext } from "@/lib/finance/guard";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProgressBar } from "@/components/dashboard/finance/progress-bar";
import type { FinanceSavingsGoal } from "@/types/finance";
import { contributeToGoalAction, createGoalAction, deleteGoalAction } from "./actions";

export default async function MetasPage() {
  const { supabase } = await requireFinanceContext();

  const { data: metas } = await supabase
    .from("finance_savings_goals")
    .select("*")
    .order("created_at", { ascending: true });

  const lista = (metas ?? []) as FinanceSavingsGoal[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">
          Metas e reserva
        </h1>
        <p className="text-sm text-gray-500">
          Defina quanto você quer guardar e acompanhe o progresso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form action={createGoalAction} className="card space-y-4">
          <h2 className="font-medium text-evolve-900">Nova meta</h2>
          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              name="nome"
              placeholder="Ex: Reserva de emergência"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Valor da meta (R$)</label>
            <input
              type="number"
              name="valor_meta"
              step="0.01"
              min="0.01"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Já tenho guardado (R$)</label>
            <input
              type="number"
              name="valor_atual"
              step="0.01"
              min="0"
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label">Data alvo (opcional)</label>
            <input type="date" name="data_meta" className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Criar meta
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          {lista.map((meta) => {
            const percent = meta.valor_meta > 0
              ? (Number(meta.valor_atual) / Number(meta.valor_meta)) * 100
              : 0;
            const atingida = Number(meta.valor_atual) >= Number(meta.valor_meta);

            return (
              <div key={meta.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-evolve-900">{meta.nome}</h3>
                    {meta.data_meta && (
                      <p className="text-xs text-gray-500">
                        Alvo: {formatDate(meta.data_meta)}
                      </p>
                    )}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteGoalAction(meta.id);
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
                      {formatCurrency(Number(meta.valor_atual))} de{" "}
                      {formatCurrency(Number(meta.valor_meta))}
                    </span>
                    <span
                      className={`font-medium ${
                        atingida ? "text-evolve-700" : "text-gray-500"
                      }`}
                    >
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={Number(meta.valor_atual)} max={Number(meta.valor_meta) || 1} />
                  </div>
                </div>

                {atingida ? (
                  <p className="text-sm font-medium text-evolve-700">
                    Meta atingida! 🎉
                  </p>
                ) : (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await contributeToGoalAction(meta.id, formData);
                    }}
                    className="flex flex-wrap items-end gap-2 border-t border-evolve-100 pt-3"
                  >
                    <div>
                      <label className="label">Registrar aporte</label>
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
                      name="data"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="input w-40"
                    />
                    <button type="submit" className="btn-secondary text-sm">
                      Guardar
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          {lista.length === 0 && (
            <p className="card text-sm text-gray-400">
              Nenhuma meta cadastrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
