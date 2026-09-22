import { requireFinanceContext } from "@/lib/finance/guard";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/dashboard/finance/progress-bar";
import type { FinanceTransaction } from "@/types/finance";

const MESES_HISTORICO = 6;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [ano, mes] = key.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

export default async function RelatoriosPage() {
  const { supabase } = await requireFinanceContext();

  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (MESES_HISTORICO - 1), 1);
  const inicioStr = inicio.toISOString().slice(0, 10);

  const { data: transacoes } = await supabase
    .from("finance_transactions")
    .select("data, tipo, valor, categoria_id, finance_categories(nome, cor)")
    .gte("data", inicioStr)
    .order("data", { ascending: true });

  const lista = (transacoes ?? []) as unknown as FinanceTransaction[];

  const meses: string[] = [];
  for (let i = MESES_HISTORICO - 1; i >= 0; i--) {
    meses.push(monthKey(new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)));
  }

  const porMes = new Map<string, { receitas: number; despesas: number }>();
  meses.forEach((m) => porMes.set(m, { receitas: 0, despesas: 0 }));

  lista.forEach((t) => {
    const key = t.data.slice(0, 7);
    if (!porMes.has(key)) return;
    const atual = porMes.get(key)!;
    if (t.tipo === "receita") atual.receitas += Number(t.valor);
    else atual.despesas += Number(t.valor);
  });

  const maiorValorMes = Math.max(
    1,
    ...[...porMes.values()].flatMap((v) => [v.receitas, v.despesas])
  );

  const mesAtualKey = monthKey(hoje);
  const despesasMesAtual = lista.filter(
    (t) => t.tipo === "despesa" && t.data.slice(0, 7) === mesAtualKey
  );
  const totalDespesasMesAtual = despesasMesAtual.reduce((s, t) => s + Number(t.valor), 0);

  const porCategoria = new Map<string, { nome: string; cor: string; total: number }>();
  despesasMesAtual.forEach((t) => {
    const nome = t.finance_categories?.nome ?? "Sem categoria";
    const cor = t.finance_categories?.cor ?? "#6b7280";
    const atual = porCategoria.get(nome)?.total ?? 0;
    porCategoria.set(nome, { nome, cor, total: atual + Number(t.valor) });
  });
  const categoriasOrdenadas = [...porCategoria.values()].sort((a, b) => b.total - a.total);

  const totalReceitasPeriodo = [...porMes.values()].reduce((s, v) => s + v.receitas, 0);
  const totalDespesasPeriodo = [...porMes.values()].reduce((s, v) => s + v.despesas, 0);
  const taxaPoupancaPeriodo = totalReceitasPeriodo > 0
    ? ((totalReceitasPeriodo - totalDespesasPeriodo) / totalReceitasPeriodo) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Relatórios</h1>
        <p className="text-sm text-gray-500">
          Últimos {MESES_HISTORICO} meses — use pra identificar padrões e onde
          cortar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Receitas no período</p>
          <p className="mt-1 text-xl font-semibold text-evolve-700">
            {formatCurrency(totalReceitasPeriodo)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Despesas no período</p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {formatCurrency(totalDespesasPeriodo)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-500">Taxa de poupança média</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              taxaPoupancaPeriodo >= 0 ? "text-evolve-700" : "text-red-600"
            }`}
          >
            {taxaPoupancaPeriodo.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">Receitas x despesas por mês</h2>
        <div className="space-y-3">
          {meses.map((m) => {
            const v = porMes.get(m)!;
            return (
              <div key={m} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{monthLabel(m)}</span>
                  <span>
                    +{formatCurrency(v.receitas)} / -{formatCurrency(v.despesas)}
                  </span>
                </div>
                <ProgressBar value={v.receitas} max={maiorValorMes} tone="evolve" />
                <ProgressBar value={v.despesas} max={maiorValorMes} tone="red" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">
          Gastos por categoria — mês atual
        </h2>
        {categoriasOrdenadas.length === 0 && (
          <p className="text-sm text-gray-400">Sem despesas lançadas neste mês.</p>
        )}
        {categoriasOrdenadas.map((cat) => (
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
                {formatCurrency(cat.total)}{" "}
                <span className="text-xs font-normal text-gray-400">
                  (
                  {totalDespesasMesAtual > 0
                    ? ((cat.total / totalDespesasMesAtual) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </span>
            </div>
            <ProgressBar value={cat.total} max={totalDespesasMesAtual || 1} tone="amber" />
          </div>
        ))}
      </div>
    </div>
  );
}
