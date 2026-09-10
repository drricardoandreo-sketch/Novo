import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/format";

function firstDayOfMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardOverviewPage() {
  const supabase = createClient();

  const [{ data: activeClients }, { data: statusCounts }, { data: monthPayments }] =
    await Promise.all([
      supabase.from("clients").select("valor_plano").eq("status", "ativo"),
      supabase.from("clients").select("status"),
      supabase
        .from("payments")
        .select("status, valor")
        .eq("mes_referencia", firstDayOfMonth()),
    ]);

  const mrr = (activeClients ?? []).reduce(
    (sum, c) => sum + Number(c.valor_plano ?? 0),
    0
  );
  const ticketMedio = activeClients?.length ? mrr / activeClients.length : 0;

  const counts = { ativo: 0, trancado: 0, cancelado: 0 };
  (statusCounts ?? []).forEach((c) => {
    counts[c.status as keyof typeof counts] += 1;
  });

  const totalPagamentosMes = monthPayments?.length ?? 0;
  const vencidosMes =
    monthPayments?.filter((p) => p.status === "vencido").length ?? 0;
  const taxaInadimplencia = totalPagamentosMes
    ? (vencidosMes / totalPagamentosMes) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">
          Visão geral
        </h1>
        <p className="text-sm text-gray-500">
          Indicadores financeiros e de clientes do estúdio Evolve.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="MRR (receita recorrente)" value={formatCurrency(mrr)} />
        <MetricCard
          label="Taxa de inadimplência (mês)"
          value={formatPercent(taxaInadimplencia)}
        />
        <MetricCard label="Ticket médio" value={formatCurrency(ticketMedio)} />
        <MetricCard label="Clientes ativos" value={String(counts.ativo)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Ativos" value={String(counts.ativo)} tone="green" />
        <MetricCard
          label="Trancados"
          value={String(counts.trancado)}
          tone="yellow"
        />
        <MetricCard
          label="Cancelados"
          value={String(counts.cancelado)}
          tone="red"
        />
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
  tone?: "green" | "yellow" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-evolve-700"
      : tone === "yellow"
        ? "text-amber-600"
        : tone === "red"
          ? "text-red-600"
          : "text-evolve-900";

  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
