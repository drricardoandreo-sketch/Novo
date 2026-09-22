import Link from "next/link";
import { requireFinanceContext } from "@/lib/finance/guard";
import { ensureDefaultFinanceCategories } from "@/lib/finance/categories";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/dashboard/finance/progress-bar";
import type { FinanceTransaction } from "@/types/finance";

function monthRange(date = new Date()) {
  const start = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

export default async function FinancasOverviewPage() {
  const { supabase, userId } = await requireFinanceContext();
  await ensureDefaultFinanceCategories(supabase, userId);

  const { start, end } = monthRange();
  const today = new Date();
  const diaHoje = today.getDate();

  const [{ data: transacoes }, { data: dividas }, { data: metas }] =
    await Promise.all([
      supabase
        .from("finance_transactions")
        .select("id, tipo, valor, descricao, categoria_id, finance_categories(nome, cor)")
        .gte("data", start)
        .lte("data", end),
      supabase
        .from("finance_debts")
        .select("id, nome, saldo_devedor, dia_vencimento, status")
        .eq("status", "ativa"),
      supabase
        .from("finance_savings_goals")
        .select("id, nome, valor_meta, valor_atual"),
    ]);

  const lista = (transacoes ?? []) as unknown as FinanceTransaction[];
  const receitas = lista
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const despesas = lista
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const saldoMes = receitas - despesas;
  const taxaPoupanca = receitas > 0 ? (saldoMes / receitas) * 100 : 0;

  const porCategoria = new Map<string, { nome: string; cor: string; total: number }>();
  lista
    .filter((t) => t.tipo === "despesa")
    .forEach((t) => {
      const nome = t.finance_categories?.nome ?? "Sem categoria";
      const cor = t.finance_categories?.cor ?? "#6b7280";
      const atual = porCategoria.get(nome)?.total ?? 0;
      porCategoria.set(nome, { nome, cor, total: atual + Number(t.valor) });
    });
  const topCategorias = [...porCategoria.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalDividas = (dividas ?? []).reduce(
    (sum, d) => sum + Number(d.saldo_devedor),
    0
  );

  const dividasVencendo = (dividas ?? []).filter((d) => {
    if (!d.dia_vencimento) return false;
    const diff = (d.dia_vencimento - diaHoje + 31) % 31;
    return diff <= 5;
  });

  const totalMetaAtual = (metas ?? []).reduce((sum, m) => sum + Number(m.valor_atual), 0);
  const totalMetaAlvo = (metas ?? []).reduce((sum, m) => sum + Number(m.valor_meta), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-evolve-900">
            Finanças pessoais
          </h1>
          <p className="text-sm text-gray-500">
            Resumo do mês atual — anote seus gastos em Lançamentos assim que
            eles acontecerem.
          </p>
        </div>
        <Link href="/dashboard/financas/lancamentos" className="btn-primary">
          + Lançar gasto/receita
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Receitas do mês" value={formatCurrency(receitas)} tone="green" />
        <MetricCard label="Despesas do mês" value={formatCurrency(despesas)} tone="red" />
        <MetricCard
          label="Saldo do mês"
          value={formatCurrency(saldoMes)}
          tone={saldoMes >= 0 ? "green" : "red"}
        />
        <MetricCard
          label="Taxa de poupança"
          value={`${taxaPoupanca.toFixed(1)}%`}
          tone={taxaPoupanca >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-3 lg:col-span-2">
          <h2 className="font-medium text-evolve-900">
            Onde o dinheiro foi esse mês
          </h2>
          {topCategorias.length === 0 && (
            <p className="text-sm text-gray-400">
              Ainda sem despesas lançadas neste mês.
            </p>
          )}
          {topCategorias.map((cat) => (
            <div key={cat.nome} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.cor }}
                  />
                  {cat.nome}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(cat.total)}
                </span>
              </div>
              <ProgressBar value={cat.total} max={despesas || 1} />
            </div>
          ))}
          <Link
            href="/dashboard/financas/relatorios"
            className="inline-block text-sm font-medium text-evolve-700 hover:underline"
          >
            Ver relatório completo →
          </Link>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="font-medium text-evolve-900">Dívidas ativas</h2>
            <p className="mt-1 text-xl font-semibold text-red-600">
              {formatCurrency(totalDividas)}
            </p>
            {dividasVencendo.length > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                {dividasVencendo.length} vencendo nos próximos dias
              </p>
            )}
            <Link
              href="/dashboard/financas/dividas"
              className="mt-2 inline-block text-sm font-medium text-evolve-700 hover:underline"
            >
              Ver plano de quitação →
            </Link>
          </div>

          <div className="border-t border-evolve-100 pt-4">
            <h2 className="font-medium text-evolve-900">Reserva / metas</h2>
            <p className="mt-1 text-xl font-semibold text-evolve-700">
              {formatCurrency(totalMetaAtual)}
              <span className="text-sm font-normal text-gray-400">
                {" "}
                / {formatCurrency(totalMetaAlvo)}
              </span>
            </p>
            <div className="mt-2">
              <ProgressBar value={totalMetaAtual} max={totalMetaAlvo || 1} />
            </div>
            <Link
              href="/dashboard/financas/metas"
              className="mt-2 inline-block text-sm font-medium text-evolve-700 hover:underline"
            >
              Ver metas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red";
}) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          tone === "green" ? "text-evolve-700" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
