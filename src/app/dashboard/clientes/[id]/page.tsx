import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import { ClientForm } from "@/components/dashboard/client-form";
import { updateClientAction, updateClientStatusAction } from "../actions";
import { PAYMENT_STATUS_LABEL, type PaymentStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/format";

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pago: "bg-evolve-100 text-evolve-800",
  pendente: "bg-amber-100 text-amber-800",
  vencido: "bg-red-100 text-red-700",
};

export default async function EditarClientePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const role = await getCurrentUserRole();
  const isAdmin = role === "admin";

  const [{ data: client }, { data: instructors }, paymentsResult] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", params.id).single(),
      supabase.from("instructors").select("*").eq("ativo", true).order("nome"),
      isAdmin
        ? supabase
            .from("payments")
            .select("*")
            .eq("client_id", params.id)
            .order("mes_referencia", { ascending: false })
        : Promise.resolve({ data: null }),
    ]);
  const payments = paymentsResult.data;

  if (!client) {
    notFound();
  }

  const boundUpdate = updateClientAction.bind(null, client.id);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-evolve-900">
            {client.nome_completo}
          </h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? "Editar cadastro do cliente" : "Dados do cliente"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {(["ativo", "trancado", "cancelado"] as const).map((status) => (
              <form
                key={status}
                action={async () => {
                  "use server";
                  await updateClientStatusAction(client.id, status);
                }}
              >
                <button
                  type="submit"
                  disabled={client.status === status}
                  className="btn-secondary text-xs capitalize disabled:bg-evolve-600 disabled:text-white"
                >
                  {status}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      <ClientForm
        client={client}
        instructors={instructors ?? []}
        action={boundUpdate}
        error={searchParams.error}
        readOnly={!isAdmin}
      />

      {isAdmin && (
        <div className="card space-y-4">
          <h2 className="font-medium text-evolve-900">Histórico de pagamentos</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-evolve-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Referência</th>
                <th className="py-2">Vencimento</th>
                <th className="py-2">Pagamento</th>
                <th className="py-2">Valor</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(payments ?? []).map((payment) => (
                <tr key={payment.id}>
                  <td className="py-2">{formatDate(payment.mes_referencia)}</td>
                  <td className="py-2">{formatDate(payment.data_vencimento)}</td>
                  <td className="py-2">{formatDate(payment.data_pagamento)}</td>
                  <td className="py-2">{formatCurrency(Number(payment.valor))}</td>
                  <td className="py-2">
                    <span
                      className={`badge ${PAYMENT_BADGE[payment.status as PaymentStatus]}`}
                    >
                      {PAYMENT_STATUS_LABEL[payment.status as PaymentStatus]}
                    </span>
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
