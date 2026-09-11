import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  generateMonthlyPaymentsAction,
  markOverdueAction,
  registerPaymentAction,
} from "./actions";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function PagamentosPage() {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in3Days = addDays(today, 3);

  const { data: payments } = await supabase
    .from("payments")
    .select("*, clients(nome_completo)")
    .order("data_vencimento", { ascending: true });

  const list = payments ?? [];

  const vencidos = list.filter((p) => p.status === "vencido");
  const venceHoje = list.filter(
    (p) => p.status === "pendente" && p.data_vencimento === todayStr
  );
  const venceEm3Dias = list.filter(
    (p) =>
      p.status === "pendente" &&
      p.data_vencimento > todayStr &&
      p.data_vencimento <= in3Days
  );
  const pagos = list
    .filter((p) => p.status === "pago")
    .slice(0, 20);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-evolve-900">
            Pagamentos
          </h1>
          <p className="text-sm text-gray-500">
            Acompanhe vencimentos e registre pagamentos recebidos.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={generateMonthlyPaymentsAction}>
            <button type="submit" className="btn-secondary text-sm">
              Gerar mensalidades do mês
            </button>
          </form>
          <form action={markOverdueAction}>
            <button type="submit" className="btn-secondary text-sm">
              Marcar vencidos
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <PaymentColumn
          title="Vencidos"
          tone="red"
          payments={vencidos}
        />
        <PaymentColumn
          title="Vence hoje"
          tone="amber"
          payments={venceHoje}
        />
        <PaymentColumn
          title="Vence em até 3 dias"
          tone="evolve"
          payments={venceEm3Dias}
        />
        <PaymentColumn title="Pagos recentemente" tone="gray" payments={pagos} paid />
      </div>
    </div>
  );
}

function PaymentColumn({
  title,
  tone,
  payments,
  paid,
}: {
  title: string;
  tone: "red" | "amber" | "evolve" | "gray";
  payments: any[];
  paid?: boolean;
}) {
  const toneHeader: Record<typeof tone, string> = {
    red: "text-red-700",
    amber: "text-amber-700",
    evolve: "text-evolve-700",
    gray: "text-gray-600",
  } as const;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={`font-medium ${toneHeader[tone]}`}>{title}</h2>
        <span className="text-xs text-gray-400">{payments.length}</span>
      </div>
      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-medium text-evolve-900">
              {p.clients?.nome_completo}
            </p>
            <p className="text-xs text-gray-500">
              Vencimento: {formatDate(p.data_vencimento)}
            </p>
            <p className="text-xs text-gray-500">
              Valor: {formatCurrency(Number(p.valor))}
            </p>
            {!paid && (
              <form
                action={async () => {
                  "use server";
                  await registerPaymentAction(p.id);
                }}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="text-xs font-medium text-evolve-700 hover:underline"
                >
                  Registrar pagamento recebido
                </button>
              </form>
            )}
            {paid && (
              <p className="mt-1 text-xs text-evolve-700">
                Pago em {formatDate(p.data_pagamento)}
              </p>
            )}
          </div>
        ))}
        {payments.length === 0 && (
          <p className="text-xs text-gray-400">Nenhum pagamento nessa lista.</p>
        )}
      </div>
    </div>
  );
}
