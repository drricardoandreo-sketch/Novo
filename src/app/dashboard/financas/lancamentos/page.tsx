import { requireFinanceContext } from "@/lib/finance/guard";
import { ensureDefaultFinanceCategories } from "@/lib/finance/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  FINANCE_PAYMENT_METHOD_LABEL,
  type FinanceCategory,
  type FinanceTransaction,
} from "@/types/finance";
import {
  createCategoryAction,
  createTransactionAction,
  deleteTransactionAction,
} from "./actions";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const start = `${mes}-01`;
  const end = new Date(ano, mesNum, 0).toISOString().slice(0, 10);
  return { start, end };
}

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const { supabase, userId } = await requireFinanceContext();
  await ensureDefaultFinanceCategories(supabase, userId);

  const mes = searchParams.mes ?? currentMonth();
  const { start, end } = monthBounds(mes);

  const [{ data: categorias }, { data: transacoes }] = await Promise.all([
    supabase
      .from("finance_categories")
      .select("*")
      .order("tipo")
      .order("nome"),
    supabase
      .from("finance_transactions")
      .select("*, finance_categories(nome, cor)")
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: false }),
  ]);

  const listaCategorias = (categorias ?? []) as FinanceCategory[];
  const lista = (transacoes ?? []) as unknown as FinanceTransaction[];

  const receitas = lista.filter((t) => t.tipo === "receita");
  const despesas = lista.filter((t) => t.tipo === "despesa");
  const totalReceitas = receitas.reduce((sum, t) => sum + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((sum, t) => sum + Number(t.valor), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Lançamentos</h1>
        <p className="text-sm text-gray-500">
          Anote cada gasto ou receita assim que acontecer — é o hábito que
          mantém tudo organizado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form action={createTransactionAction} className="card space-y-4 lg:col-span-1">
          <h2 className="font-medium text-evolve-900">Novo lançamento</h2>

          <div>
            <label className="label">Tipo</label>
            <select name="tipo" defaultValue="despesa" className="input">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              name="valor"
              step="0.01"
              min="0.01"
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Data</label>
            <input
              type="date"
              name="data"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select name="categoria_id" className="input">
              <option value="">Sem categoria</option>
              {listaCategorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipo === "receita" ? "↑" : "↓"} {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Forma de pagamento</label>
            <select name="forma_pagamento" defaultValue="pix" className="input">
              {Object.entries(FINANCE_PAYMENT_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descrição (opcional)</label>
            <input type="text" name="descricao" className="input" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="fixo" className="rounded" />
            É um gasto/receita fixo mensal
          </label>

          <button type="submit" className="btn-primary w-full">
            Lançar
          </button>

          <details className="pt-2 text-sm">
            <summary className="cursor-pointer text-evolve-700">
              + Criar nova categoria
            </summary>
            <form action={createCategoryAction} className="mt-3 space-y-2">
              <input
                type="text"
                name="nome"
                placeholder="Nome da categoria"
                required
                className="input"
              />
              <select name="tipo" defaultValue="despesa" className="input">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
              <input type="color" name="cor" defaultValue="#6b7280" className="h-9 w-full rounded" />
              <button type="submit" className="btn-secondary w-full text-sm">
                Salvar categoria
              </button>
            </form>
          </details>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <form className="flex flex-wrap items-center gap-3">
            <input
              type="month"
              name="mes"
              defaultValue={mes}
              className="input max-w-xs"
            />
            <button type="submit" className="btn-secondary">
              Filtrar mês
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs uppercase text-gray-500">Receitas no mês</p>
              <p className="mt-1 text-lg font-semibold text-evolve-700">
                {formatCurrency(totalReceitas)}
              </p>
            </div>
            <div className="card">
              <p className="text-xs uppercase text-gray-500">Despesas no mês</p>
              <p className="mt-1 text-lg font-semibold text-red-600">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-evolve-100 bg-evolve-50/60 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Forma</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-evolve-50/40">
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.data)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.finance_categories?.cor ?? "#9ca3af" }}
                        />
                        {t.finance_categories?.nome ?? "Sem categoria"}
                        {t.fixo && (
                          <span className="badge bg-gray-100 text-gray-600">fixo</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.descricao ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {FINANCE_PAYMENT_METHOD_LABEL[t.forma_pagamento]}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.tipo === "receita" ? "text-evolve-700" : "text-red-600"
                      }`}
                    >
                      {t.tipo === "receita" ? "+" : "-"}
                      {formatCurrency(Number(t.valor))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteTransactionAction(t.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-gray-400 hover:text-red-600"
                        >
                          excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Nenhum lançamento nesse mês ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
